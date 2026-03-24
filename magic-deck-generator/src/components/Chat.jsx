import { useState, useEffect, useRef, useCallback } from 'react'
import './Chat.css'

const API_URL = import.meta.env.PROD
  ? 'https://api.mtgdecksbuilder.com'
  : 'http://localhost:8000'

const WS_URL = import.meta.env.PROD
  ? 'wss://api.mtgdecksbuilder.com'
  : 'ws://localhost:8000'

const T = {
  it: {
    title: '💬 Community Chat',
    subtitle: 'Chatta con altri giocatori MTG',
    createChat: '+ Crea Chat',
    joinChat: 'Entra',
    publicChats: 'Chat Pubbliche',
    noChats: 'Nessuna chat disponibile. Creane una!',
    members: 'membri',
    online: 'online',
    back: '← Indietro',
    send: 'Invia',
    messagePlaceholder: 'Scrivi un messaggio...',
    createTitle: 'Crea una nuova chat',
    chatName: 'Nome chat',
    chatDesc: 'Descrizione (opzionale)',
    isPrivate: 'Chat privata',
    accessCode: 'Codice accesso (4 cifre)',
    yourUsername: 'Il tuo username in questa chat',
    create: 'Crea Chat (gratis)',
    cancel: 'Annulla',
    joinTitle: 'Entra nella chat',
    joinCost: 'Entrare costa 2 🪙 token',
    joinBtn: 'Entra (2 🪙)',
    alreadyMember: 'Sei già membro',
    enterCode: 'Codice accesso (4 cifre)',
    banUser: 'Banna',
    banConfirm: 'Bannare questo utente?',
    banned: 'Bannato',
    deleteChat: '🗑️ Chiudi chat',
    deleteChatConfirm: 'Chiudere definitivamente questa chat?',
    membersTitle: 'Membri',
    errorTokens: 'Token insufficienti (servono 2 token)',
    errorGeneric: 'Errore. Riprova.',
    errorCode: 'Codice accesso non valido',
    errorUsername: 'Username non valido o già in uso',
    systemMsg: 'Sistema',
    you: 'Tu',
    adminBadge: 'Admin',
    privateLabel: '🔒 Privata',
    publicLabel: '🌐 Pubblica',
    loadingChats: 'Caricamento chat...',
    enterUsername: 'Scegli il tuo username',
    usernameHint: 'Sarà visibile a tutti nella chat',
    myChats: 'Le mie chat',
    noMyChats: 'Non sei ancora membro di nessuna chat.',
    searchPrivate: '🔍 Cerca chat privata',
    searchPlaceholder: 'Cerca per nome...',
    searchBtn: 'Cerca',
    searchResults: 'Risultati ricerca',
    noResults: 'Nessuna chat trovata.',
  },
  en: {
    title: '💬 Community Chat',
    subtitle: 'Chat with other MTG players',
    createChat: '+ Create Chat',
    joinChat: 'Join',
    publicChats: 'Public Chats',
    noChats: 'No chats available. Create one!',
    members: 'members',
    online: 'online',
    back: '← Back',
    send: 'Send',
    messagePlaceholder: 'Write a message...',
    createTitle: 'Create a new chat',
    chatName: 'Chat name',
    chatDesc: 'Description (optional)',
    isPrivate: 'Private chat',
    accessCode: 'Access code (4 digits)',
    yourUsername: 'Your username in this chat',
    create: 'Create Chat (free)',
    cancel: 'Cancel',
    joinTitle: 'Join chat',
    joinCost: 'Joining costs 2 🪙 tokens',
    joinBtn: 'Join (2 🪙)',
    alreadyMember: 'Already a member',
    enterCode: 'Access code (4 digits)',
    banUser: 'Ban',
    banConfirm: 'Ban this user?',
    banned: 'Banned',
    deleteChat: '🗑️ Close chat',
    deleteChatConfirm: 'Permanently close this chat?',
    membersTitle: 'Members',
    errorTokens: 'Insufficient tokens (need 2 tokens)',
    errorGeneric: 'Error. Please try again.',
    errorCode: 'Invalid access code',
    errorUsername: 'Invalid or already taken username',
    systemMsg: 'System',
    you: 'You',
    adminBadge: 'Admin',
    privateLabel: '🔒 Private',
    publicLabel: '🌐 Public',
    loadingChats: 'Loading chats...',
    enterUsername: 'Choose your username',
    usernameHint: 'Will be visible to everyone in the chat',
    myChats: 'My chats',
    noMyChats: 'You are not a member of any chat yet.',
    searchPrivate: '🔍 Search private chat',
    searchPlaceholder: 'Search by name...',
    searchBtn: 'Search',
    searchResults: 'Search results',
    noResults: 'No chats found.',
  }
}

export default function Chat({ user, language = 'it' }) {
  const t = T[language] || T.it
  const [view, setView] = useState('list') // list | room | create | join
  const [chats, setChats] = useState([])
  const [myChats, setMyChats] = useState([])
  const [loadingChats, setLoadingChats] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null) // null = not searched yet
  const [searching, setSearching] = useState(false)
  const [activeChat, setActiveChat] = useState(null) // full chat info
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState([])
  const [msgInput, setMsgInput] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const [error, setError] = useState(null)
  const [tokens, setTokens] = useState(user?.tokens || 0)

  useEffect(() => {
    if (user?.tokens != null) setTokens(user.tokens)
  }, [user?.tokens])

  // Create form
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createPrivate, setCreatePrivate] = useState(false)
  const [createCode, setCreateCode] = useState('')
  const [createUsername, setCreateUsername] = useState('')
  const [creating, setCreating] = useState(false)

  // Join form
  const [joinTarget, setJoinTarget] = useState(null)
  const [joinUsername, setJoinUsername] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)

  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)
  const myMemberIdRef = useRef(null)

  // ── Load chat list ──
  const loadChats = useCallback(async () => {
    setLoadingChats(true)
    try {
      const [pubRes, myRes] = await Promise.all([
        fetch(`${API_URL}/api/chat/list`),
        fetch(`${API_URL}/api/chat/my-chats?user_id=${user.userId}`),
      ])
      if (pubRes.ok) setChats(await pubRes.json())
      if (myRes.ok) setMyChats(await myRes.json())
    } catch {}
    setLoadingChats(false)
  }, [user.userId])

  useEffect(() => {
    loadChats()
    const interval = setInterval(loadChats, 30000)
    return () => clearInterval(interval)
  }, [loadChats])

  // ── Search chats ──
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`${API_URL}/api/chat/search?name=${encodeURIComponent(searchQuery.trim())}`)
      if (res.ok) setSearchResults(await res.json())
    } catch {}
    setSearching(false)
  }

  const handleSearchKey = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  // ── Scroll to bottom ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── WebSocket ──
  const connectWS = useCallback((chatId, memberId) => {
    if (wsRef.current) wsRef.current.close()
    const ws = new WebSocket(`${WS_URL}/api/chat/${chatId}/ws?user_id=${user.userId}`)
    wsRef.current = ws
    myMemberIdRef.current = memberId

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        setMessages(prev => [...prev, data])
      } catch {}
    }
    ws.onclose = () => {}
    ws.onerror = () => {}
  }, [user])

  const disconnectWS = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  // ── Enter a room ──
  const enterRoom = async (chatId) => {
    setError(null)
    try {
      const [infoRes, msgsRes, membersRes] = await Promise.all([
        fetch(`${API_URL}/api/chat/${chatId}?user_id=${user.userId}`),
        fetch(`${API_URL}/api/chat/${chatId}/messages?user_id=${user.userId}&limit=50`),
        fetch(`${API_URL}/api/chat/${chatId}/members?user_id=${user.userId}`),
      ])
      if (!infoRes.ok) { setError(t.errorGeneric); return }
      const info = await infoRes.json()
      const msgs = msgsRes.ok ? await msgsRes.json() : []
      const mems = membersRes.ok ? await membersRes.json() : []

      setActiveChat(info)
      setMessages(msgs)
      setMembers(mems)
      myMemberIdRef.current = info.my_member_id
      setView('room')
      connectWS(chatId, info.my_member_id)
    } catch { setError(t.errorGeneric) }
  }

  const leaveRoom = () => {
    disconnectWS()
    setActiveChat(null)
    setMessages([])
    setMembers([])
    setView('list')
    loadChats()
  }

  // ── Send message ──
  const sendMessage = () => {
    const content = msgInput.trim()
    if (!content || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ content }))
    setMsgInput('')
  }

  const handleMsgKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // ── Create chat ──
  const handleCreate = async () => {
    setError(null)
    if (!createName.trim() || createName.trim().length < 2) {
      setError(t.chatName + ' troppo corto'); return
    }
    if (!createUsername.trim() || createUsername.trim().length < 2) {
      setError(t.errorUsername); return
    }
    if (createPrivate && (!/^\d{4}$/.test(createCode))) {
      setError(t.accessCode + ': 4 cifre numeriche'); return
    }
    setCreating(true)
    try {
      const res = await fetch(`${API_URL}/api/chat/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          name: createName.trim(),
          description: createDesc.trim() || null,
          is_public: !createPrivate,
          access_code: createPrivate ? createCode : null,
          username: createUsername.trim(),
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || t.errorGeneric); setCreating(false); return }
      // Reset form
      setCreateName(''); setCreateDesc(''); setCreatePrivate(false)
      setCreateCode(''); setCreateUsername('')
      setCreating(false)
      await enterRoom(data.chat_id)
    } catch { setError(t.errorGeneric); setCreating(false) }
  }

  // ── Join chat ──
  const handleJoin = async () => {
    setError(null)
    if (!joinUsername.trim() || joinUsername.trim().length < 2) {
      setError(t.errorUsername); return
    }
    if (joinTarget && !joinTarget.is_public && !/^\d{4}$/.test(joinCode)) {
      setError(t.errorCode); return
    }
    setJoining(true)
    try {
      const res = await fetch(`${API_URL}/api/chat/${joinTarget.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          username: joinUsername.trim(),
          access_code: joinCode || null,
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(res.status === 403 ? t.errorTokens : (data.detail || t.errorGeneric))
        setJoining(false); return
      }
      if (data.tokens_remaining !== undefined) {
        setTokens(data.tokens_remaining)
        if (user) user.tokens = data.tokens_remaining
      }
      setJoinUsername(''); setJoinCode(''); setJoinTarget(null)
      setJoining(false)
      await enterRoom(joinTarget.id)
    } catch { setError(t.errorGeneric); setJoining(false) }
  }

  // ── Ban member ──
  const handleBan = async (targetUserId, username) => {
    if (!window.confirm(`${t.banConfirm} (${username})`)) return
    try {
      const res = await fetch(`${API_URL}/api/chat/${activeChat.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_user_id: user.userId, target_user_id: targetUserId })
      })
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.user_id !== targetUserId))
      }
    } catch {}
  }

  // ── Delete chat ──
  const handleDeleteChat = async () => {
    if (!window.confirm(t.deleteChatConfirm)) return
    try {
      await fetch(`${API_URL}/api/chat/${activeChat.id}?user_id=${user.userId}`, { method: 'DELETE' })
      leaveRoom()
    } catch {}
  }

  // ── Click on chat in list ──
  const handleChatClick = async (chat) => {
    setError(null)
    // Check if already member
    const infoRes = await fetch(`${API_URL}/api/chat/${chat.id}?user_id=${user.userId}`)
    if (!infoRes.ok) return
    const info = await infoRes.json()

    if (info.is_member) {
      await enterRoom(chat.id)
    } else {
      setJoinTarget(chat)
      setView('join')
    }
  }

  // ── Render ──
  if (view === 'create') return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="chat-back-btn" onClick={() => { setView('list'); setError(null) }}>{t.back}</button>
        <h2>{t.createTitle}</h2>
      </div>
      {error && <div className="chat-error">{error}</div>}
      <div className="chat-form">
        <label>{t.chatName} *</label>
        <input className="chat-input" value={createName} onChange={e => setCreateName(e.target.value)} maxLength={60} placeholder="Es: Deck Commander Italia" />

        <label>{t.chatDesc}</label>
        <input className="chat-input" value={createDesc} onChange={e => setCreateDesc(e.target.value)} maxLength={200} placeholder="Descrizione opzionale..." />

        <label>{t.yourUsername} *</label>
        <input className="chat-input" value={createUsername} onChange={e => setCreateUsername(e.target.value)} maxLength={30} placeholder={t.usernameHint} />

        <label className="chat-checkbox-label">
          <input type="checkbox" checked={createPrivate} onChange={e => setCreatePrivate(e.target.checked)} />
          {t.isPrivate}
        </label>

        {createPrivate && (
          <>
            <label>{t.accessCode} *</label>
            <input className="chat-input" value={createCode} onChange={e => setCreateCode(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} placeholder="1234" />
          </>
        )}

        <div className="chat-form-actions">
          <button className="chat-btn-secondary" onClick={() => { setView('list'); setError(null) }}>{t.cancel}</button>
          <button className="chat-btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? '...' : t.create}
          </button>
        </div>
      </div>
    </div>
  )

  if (view === 'join') return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="chat-back-btn" onClick={() => { setView('list'); setError(null); setJoinTarget(null) }}>{t.back}</button>
        <h2>{t.joinTitle}: <span className="chat-name-highlight">{joinTarget?.name}</span></h2>
      </div>
      {error && <div className="chat-error">{error}</div>}
      <div className="chat-form">
        <div className="chat-join-cost-badge">💰 {t.joinCost}</div>
        <div className="chat-token-badge">🪙 {tokens}</div>

        <label>{t.yourUsername} *</label>
        <input className="chat-input" value={joinUsername} onChange={e => setJoinUsername(e.target.value)} maxLength={30} placeholder={t.usernameHint} />

        {joinTarget && !joinTarget.is_public && (
          <>
            <label>{t.enterCode} *</label>
            <input className="chat-input" value={joinCode} onChange={e => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} placeholder="1234" />
          </>
        )}

        <div className="chat-form-actions">
          <button className="chat-btn-secondary" onClick={() => { setView('list'); setError(null); setJoinTarget(null) }}>{t.cancel}</button>
          <button className="chat-btn-primary" onClick={handleJoin} disabled={joining}>
            {joining ? '...' : t.joinBtn}
          </button>
        </div>
      </div>
    </div>
  )

  if (view === 'room' && activeChat) return (
    <div className="chat-room">
      <div className="chat-room-header">
        <button className="chat-back-btn" onClick={leaveRoom}>{t.back}</button>
        <div className="chat-room-title">
          <span className="chat-room-name">{activeChat.name}</span>
          <span className="chat-room-meta">
            {activeChat.is_public ? t.publicLabel : t.privateLabel}
            {' · '}{activeChat.member_count} {t.members}
            {' · '}{activeChat.online_count} {t.online}
          </span>
        </div>
        <div className="chat-room-actions">
          <button className="chat-members-btn" onClick={() => setShowMembers(v => !v)}>
            👥 {members.length}
          </button>
          {activeChat.is_admin && (
            <button className="chat-delete-btn" onClick={handleDeleteChat}>{t.deleteChat}</button>
          )}
        </div>
      </div>

      <div className="chat-room-body">
        <div className="chat-messages-area">
          {messages.map((msg, i) => {
            const isMe = msg.member_id === myMemberIdRef.current
            const isSystem = msg.type === 'system'
            return (
              <div key={msg.id || i} className={`chat-msg ${isSystem ? 'chat-msg-system' : isMe ? 'chat-msg-me' : 'chat-msg-other'}`}>
                {!isSystem && (
                  <span className="chat-msg-author">
                    {isMe ? t.you : msg.username}
                    {members.find(m => m.member_id === msg.member_id)?.is_admin && (
                      <span className="chat-admin-badge">{t.adminBadge}</span>
                    )}
                  </span>
                )}
                <span className="chat-msg-content">{msg.content}</span>
                {!isSystem && (
                  <span className="chat-msg-time">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {showMembers && (
          <div className="chat-members-panel">
            <h4>{t.membersTitle}</h4>
            {members.map(m => (
              <div key={m.id} className="chat-member-row">
                <span className={`chat-member-dot ${m.online ? 'online' : ''}`} />
                <span className="chat-member-name">{m.username}</span>
                {m.is_admin && <span className="chat-admin-badge">{t.adminBadge}</span>}
                {activeChat.is_admin && !m.is_admin && m.user_id !== user.userId && (
                  <button className="chat-ban-btn" onClick={() => handleBan(m.user_id, m.username)}>
                    {t.banUser}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="chat-input-bar">
        <textarea
          className="chat-msg-input"
          value={msgInput}
          onChange={e => setMsgInput(e.target.value)}
          onKeyDown={handleMsgKey}
          placeholder={t.messagePlaceholder}
          rows={1}
          maxLength={2000}
        />
        <button className="chat-send-btn" onClick={sendMessage} disabled={!msgInput.trim()} title={t.send}>
          ➤
        </button>
      </div>
    </div>
  )

  // ── List view ──
  const renderChatCard = (chat) => (
    <div key={chat.id} className="chat-card" onClick={() => handleChatClick(chat)}>
      <div className="chat-card-header">
        <span className="chat-card-name">{chat.name}</span>
        <span className="chat-card-badge">{chat.is_public ? t.publicLabel : t.privateLabel}</span>
      </div>
      {chat.description && <p className="chat-card-desc">{chat.description}</p>}
      <div className="chat-card-meta">
        <span>👥 {chat.member_count} {t.members}</span>
        <span className="chat-online-dot">🟢 {chat.online_count} {t.online}</span>
      </div>
    </div>
  )

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div>
          <h2>{t.title}</h2>
          <p className="chat-subtitle">{t.subtitle}</p>
        </div>
        <button className="chat-btn-primary" onClick={() => { setView('create'); setError(null) }}>
          {t.createChat}
        </button>
      </div>

      {error && <div className="chat-error">{error}</div>}

      {/* ── Le mie chat ── */}
      <h3 className="chat-section-title">{t.myChats}</h3>
      {loadingChats ? (
        <div className="chat-loading">{t.loadingChats}</div>
      ) : myChats.length === 0 ? (
        <div className="chat-empty">{t.noMyChats}</div>
      ) : (
        <div className="chat-list">
          {myChats.map(chat => renderChatCard(chat))}
        </div>
      )}

      {/* ── Cerca chat privata ── */}
      <h3 className="chat-section-title" style={{ marginTop: '24px' }}>{t.searchPrivate}</h3>
      <div className="chat-search-bar">
        <input
          className="chat-input chat-search-input"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKey}
          placeholder={t.searchPlaceholder}
          maxLength={60}
        />
        <button className="chat-btn-primary" onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
          {searching ? '...' : t.searchBtn}
        </button>
      </div>
      {searchResults !== null && (
        <>
          <h4 className="chat-section-title">{t.searchResults}</h4>
          {searchResults.length === 0 ? (
            <div className="chat-empty">{t.noResults}</div>
          ) : (
            <div className="chat-list">
              {searchResults.map(chat => renderChatCard(chat))}
            </div>
          )}
        </>
      )}

      {/* ── Chat pubbliche ── */}
      <h3 className="chat-section-title" style={{ marginTop: '24px' }}>{t.publicChats}</h3>
      {loadingChats ? (
        <div className="chat-loading">{t.loadingChats}</div>
      ) : chats.length === 0 ? (
        <div className="chat-empty">{t.noChats}</div>
      ) : (
        <div className="chat-list">
          {chats.map(chat => renderChatCard(chat))}
        </div>
      )}
    </div>
  )
}
