from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db, SessionLocal
from app.models import Chat, ChatMember, ChatMessage, User
from app.routers.tokens import consume_token
from datetime import datetime
import json
import asyncio

router = APIRouter()

# ── WebSocket connection manager ──
class ConnectionManager:
    def __init__(self):
        # chat_id -> list of (websocket, member_id, username)
        self.rooms: dict[int, list[dict]] = {}

    async def connect(self, chat_id: int, websocket: WebSocket, member_id: int, username: str):
        await websocket.accept()
        if chat_id not in self.rooms:
            self.rooms[chat_id] = []
        self.rooms[chat_id].append({"ws": websocket, "member_id": member_id, "username": username})

    def disconnect(self, chat_id: int, websocket: WebSocket):
        if chat_id in self.rooms:
            self.rooms[chat_id] = [c for c in self.rooms[chat_id] if c["ws"] != websocket]

    async def broadcast(self, chat_id: int, message: dict):
        if chat_id not in self.rooms:
            return
        dead = []
        for conn in self.rooms[chat_id]:
            try:
                await conn["ws"].send_text(json.dumps(message))
            except Exception:
                dead.append(conn)
        for d in dead:
            self.rooms[chat_id].remove(d)

    def online_count(self, chat_id: int) -> int:
        return len(self.rooms.get(chat_id, []))

manager = ConnectionManager()

# ── Pydantic schemas ──
class CreateChatInput(BaseModel):
    user_id: int
    name: str
    description: Optional[str] = None
    is_public: bool = True
    access_code: Optional[str] = None  # 4 digits if private
    username: str  # admin's display name

class JoinChatInput(BaseModel):
    user_id: int
    username: str
    access_code: Optional[str] = None  # required for private chats

class SendMessageInput(BaseModel):
    user_id: int
    content: str

class BanMemberInput(BaseModel):
    admin_user_id: int
    target_user_id: int

# ── Helpers ──
def get_user(user_id: int, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_member(chat_id: int, user_id: int, db: Session) -> ChatMember:
    member = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.user_id == user_id,
        ChatMember.is_banned == False
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this chat")
    return member

def serialize_message(msg: ChatMessage, username: str) -> dict:
    return {
        "id": msg.id,
        "content": msg.content,
        "username": username,
        "member_id": msg.member_id,
        "created_at": msg.created_at.isoformat(),
    }

# ── Endpoints ──

@router.post("/create")
def create_chat(data: CreateChatInput, db: Session = Depends(get_db)):
    """Create a new chat room. Creator becomes admin. Free to create."""
    user = get_user(data.user_id, db)

    if not data.name or len(data.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Chat name too short (min 2 chars)")

    if not data.is_public:
        if not data.access_code or not data.access_code.isdigit() or len(data.access_code) != 4:
            raise HTTPException(status_code=400, detail="Private chats require a 4-digit numeric access code")

    if not data.username or len(data.username.strip()) < 2:
        raise HTTPException(status_code=400, detail="Username too short (min 2 chars)")

    chat = Chat(
        name=data.name.strip(),
        description=data.description,
        is_public=data.is_public,
        access_code=data.access_code if not data.is_public else None,
        creator_id=data.user_id,
    )
    db.add(chat)
    db.flush()

    member = ChatMember(
        chat_id=chat.id,
        user_id=data.user_id,
        username=data.username.strip(),
        is_admin=True,
    )
    db.add(member)
    db.commit()
    db.refresh(chat)

    return {
        "chat_id": chat.id,
        "name": chat.name,
        "is_public": chat.is_public,
        "member_id": member.id,
        "message": "Chat created successfully"
    }


@router.get("/list")
def list_chats(db: Session = Depends(get_db)):
    """List all public active chats."""
    chats = db.query(Chat).filter(Chat.is_public == True, Chat.is_active == True)\
        .order_by(Chat.created_at.desc()).limit(100).all()

    result = []
    for c in chats:
        member_count = db.query(ChatMember).filter(
            ChatMember.chat_id == c.id,
            ChatMember.is_banned == False
        ).count()
        result.append({
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "is_public": c.is_public,
            "member_count": member_count,
            "online_count": manager.online_count(c.id),
            "created_at": c.created_at.isoformat(),
        })
    return result


@router.get("/my-chats")
def my_chats(user_id: int, db: Session = Depends(get_db)):
    """Return all chats (public + private) where the user is an active member."""
    memberships = db.query(ChatMember).filter(
        ChatMember.user_id == user_id,
        ChatMember.is_banned == False
    ).all()

    result = []
    for m in memberships:
        chat = db.query(Chat).filter(Chat.id == m.chat_id, Chat.is_active == True).first()
        if not chat:
            continue
        member_count = db.query(ChatMember).filter(
            ChatMember.chat_id == chat.id,
            ChatMember.is_banned == False
        ).count()
        result.append({
            "id": chat.id,
            "name": chat.name,
            "description": chat.description,
            "is_public": chat.is_public,
            "member_count": member_count,
            "online_count": manager.online_count(chat.id),
            "created_at": chat.created_at.isoformat(),
            "is_admin": m.is_admin,
            "my_username": m.username,
        })
    return result


@router.get("/search")
def search_chats(name: str, db: Session = Depends(get_db)):
    """Search private (and public) chats by name. Returns name + is_public only (no access_code)."""
    results = db.query(Chat).filter(
        Chat.name.ilike(f"%{name}%"),
        Chat.is_active == True
    ).limit(20).all()

    return [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "is_public": c.is_public,
            "member_count": db.query(ChatMember).filter(
                ChatMember.chat_id == c.id,
                ChatMember.is_banned == False
            ).count(),
            "online_count": manager.online_count(c.id),
            "created_at": c.created_at.isoformat(),
        }
        for c in results
    ]


@router.get("/{chat_id}")
def get_chat(chat_id: int, user_id: int, db: Session = Depends(get_db)):
    """Get chat info + check membership."""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.is_active == True).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    member = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.user_id == user_id
    ).first()

    member_count = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.is_banned == False
    ).count()

    return {
        "id": chat.id,
        "name": chat.name,
        "description": chat.description,
        "is_public": chat.is_public,
        "creator_id": chat.creator_id,
        "member_count": member_count,
        "online_count": manager.online_count(chat_id),
        "created_at": chat.created_at.isoformat(),
        "is_member": member is not None and not member.is_banned,
        "is_banned": member.is_banned if member else False,
        "is_admin": member.is_admin if member else False,
        "my_username": member.username if member else None,
        "my_member_id": member.id if member else None,
    }


@router.post("/{chat_id}/join")
def join_chat(chat_id: int, data: JoinChatInput, db: Session = Depends(get_db)):
    """Join a chat. Costs 2 tokens. Free if already a member."""
    user = get_user(data.user_id, db)

    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.is_active == True).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Check if already a member
    existing = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.user_id == data.user_id
    ).first()

    if existing:
        if existing.is_banned:
            raise HTTPException(status_code=403, detail="You are banned from this chat")
        return {
            "member_id": existing.id,
            "username": existing.username,
            "is_admin": existing.is_admin,
            "message": "Already a member"
        }

    # Validate access code for private chats
    if not chat.is_public:
        if not data.access_code or data.access_code != chat.access_code:
            raise HTTPException(status_code=403, detail="Invalid access code")

    # Validate username
    if not data.username or len(data.username.strip()) < 2:
        raise HTTPException(status_code=400, detail="Username too short (min 2 chars)")

    # Check username not taken in this chat
    taken = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.username == data.username.strip()
    ).first()
    if taken:
        raise HTTPException(status_code=400, detail="Username already taken in this chat")

    # Consume 2 tokens
    consume_token(user, 'chat_join', f'Joined chat: {chat.name}', db, tokens_to_consume=2)

    member = ChatMember(
        chat_id=chat_id,
        user_id=data.user_id,
        username=data.username.strip(),
        is_admin=False,
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    return {
        "member_id": member.id,
        "username": member.username,
        "is_admin": member.is_admin,
        "tokens_remaining": user.tokens,
        "message": "Joined successfully"
    }


@router.get("/{chat_id}/messages")
def get_messages(chat_id: int, user_id: int, limit: int = 50, db: Session = Depends(get_db)):
    """Get last N messages. User must be a member."""
    get_member(chat_id, user_id, db)

    messages = db.query(ChatMessage).filter(
        ChatMessage.chat_id == chat_id,
        ChatMessage.is_deleted == False
    ).order_by(ChatMessage.created_at.desc()).limit(limit).all()

    messages.reverse()

    result = []
    for msg in messages:
        member = db.query(ChatMember).filter(ChatMember.id == msg.member_id).first()
        result.append(serialize_message(msg, member.username if member else "?"))
    return result


@router.get("/{chat_id}/members")
def get_members(chat_id: int, user_id: int, db: Session = Depends(get_db)):
    """Get member list. User must be a member."""
    get_member(chat_id, user_id, db)

    members = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.is_banned == False
    ).order_by(ChatMember.joined_at).all()

    return [
        {
            "id": m.id,
            "user_id": m.user_id,
            "username": m.username,
            "is_admin": m.is_admin,
            "joined_at": m.joined_at.isoformat(),
            "online": any(
                c["member_id"] == m.id
                for c in manager.rooms.get(chat_id, [])
            )
        }
        for m in members
    ]


@router.post("/{chat_id}/ban")
def ban_member(chat_id: int, data: BanMemberInput, db: Session = Depends(get_db)):
    """Admin bans a user from the chat."""
    admin_member = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.user_id == data.admin_user_id,
        ChatMember.is_admin == True,
        ChatMember.is_banned == False
    ).first()
    if not admin_member:
        raise HTTPException(status_code=403, detail="Only admins can ban members")

    if data.target_user_id == data.admin_user_id:
        raise HTTPException(status_code=400, detail="Cannot ban yourself")

    target = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.user_id == data.target_user_id
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")

    target.is_banned = True
    db.commit()

    return {"message": f"User {target.username} banned from chat"}


@router.delete("/{chat_id}")
def delete_chat(chat_id: int, user_id: int, db: Session = Depends(get_db)):
    """Admin closes/deletes a chat."""
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat.creator_id != user_id:
        raise HTTPException(status_code=403, detail="Only the creator can delete this chat")

    chat.is_active = False
    db.commit()
    return {"message": "Chat closed"}


# ── WebSocket endpoint ──
@router.websocket("/{chat_id}/ws")
async def chat_websocket(chat_id: int, websocket: WebSocket, user_id: int):
    """Real-time WebSocket for chat messages."""
    db = SessionLocal()
    try:
        member = db.query(ChatMember).filter(
            ChatMember.chat_id == chat_id,
            ChatMember.user_id == user_id,
            ChatMember.is_banned == False
        ).first()
        if not member:
            await websocket.close(code=4003)
            return

        chat = db.query(Chat).filter(Chat.id == chat_id, Chat.is_active == True).first()
        if not chat:
            await websocket.close(code=4004)
            return

        member_id = member.id
        username = member.username
    finally:
        db.close()

    await manager.connect(chat_id, websocket, member_id, username)

    # Notify room of new user
    await manager.broadcast(chat_id, {
        "type": "system",
        "content": f"{username} è entrato nella chat",
        "username": "Sistema",
        "created_at": datetime.utcnow().isoformat(),
    })

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                payload = json.loads(raw)
            except Exception:
                continue

            content = (payload.get("content") or "").strip()
            if not content or len(content) > 2000:
                continue

            db = SessionLocal()
            try:
                # Re-check ban status
                fresh_member = db.query(ChatMember).filter(
                    ChatMember.id == member_id
                ).first()
                if not fresh_member or fresh_member.is_banned:
                    await websocket.close(code=4003)
                    break

                # Persist message
                msg = ChatMessage(
                    chat_id=chat_id,
                    member_id=member_id,
                    content=content,
                )
                db.add(msg)
                db.commit()
                db.refresh(msg)
                msg_id = msg.id
                msg_created_at = msg.created_at.isoformat()
            finally:
                db.close()

            await manager.broadcast(chat_id, {
                "type": "message",
                "id": msg_id,
                "content": content,
                "username": username,
                "member_id": member_id,
                "created_at": msg_created_at,
            })

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(chat_id, websocket)
        await manager.broadcast(chat_id, {
            "type": "system",
            "content": f"{username} ha lasciato la chat",
            "username": "Sistema",
            "created_at": datetime.utcnow().isoformat(),
        })
