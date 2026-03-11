"""
Test locale del sync Scryfall con DB SQLite in memoria.
Scarica solo le prime 100 carte per velocità.
Uso: cd backend && python test_scryfall_sync.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

# Override DATABASE_URL con SQLite in memoria PRIMA di importare l'app
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import MTGCard
from app.services.scryfall_sync import _get_bulk_download_url, _download_bulk, _card_from_scryfall
import json, requests

LIMIT = 100  # carte da testare

engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
Session = sessionmaker(bind=engine)
db = Session()

print("📡 Recupero URL bulk Scryfall...")
url = _get_bulk_download_url()
print(f"✅ URL: {url}")

print(f"⬇️  Download bulk (streaming, stop a {LIMIT} carte)...")
# Stream e parse solo le prime LIMIT carte senza scaricare tutto
with requests.get(url, stream=True, timeout=120) as r:
    r.raise_for_status()
    # Legge chunk finché non ha abbastanza dati per parsare LIMIT carte
    buffer = b""
    cards_raw = []
    for chunk in r.iter_content(chunk_size=1024 * 512):
        buffer += chunk
        # Prova a parsare il JSON parziale cercando oggetti completi
        try:
            # Trova la fine dell'N-esimo oggetto carta
            text = buffer.decode("utf-8", errors="ignore")
            # Conta le carte trovate finora
            depth = 0
            in_string = False
            escape = False
            card_start = None
            found = []
            for i, ch in enumerate(text):
                if escape:
                    escape = False
                    continue
                if ch == '\\' and in_string:
                    escape = True
                    continue
                if ch == '"' and not escape:
                    in_string = not in_string
                    continue
                if in_string:
                    continue
                if ch == '{':
                    if depth == 1:
                        card_start = i
                    depth += 1
                elif ch == '}':
                    depth -= 1
                    if depth == 1 and card_start is not None:
                        found.append(text[card_start:i+1])
                        card_start = None
                        if len(found) >= LIMIT:
                            break
            if len(found) >= LIMIT:
                cards_raw = found[:LIMIT]
                break
        except Exception:
            continue

print(f"✅ Parsate {len(cards_raw)} carte dal buffer")

inserted = 0
errors = 0
for raw_str in cards_raw:
    try:
        raw = json.loads(raw_str)
        if raw.get("layout") in ("token", "art_series", "emblem") or raw.get("digital"):
            continue
        card_data = _card_from_scryfall(raw)
        db.add(MTGCard(**card_data))
        inserted += 1
    except Exception as e:
        errors += 1

db.commit()

# Verifica risultati
total = db.query(MTGCard).count()
with_price = db.query(MTGCard).filter(MTGCard.price_usd.isnot(None)).count()
sample = db.query(MTGCard).filter(MTGCard.price_usd.isnot(None)).first()

print(f"\n📊 Risultati:")
print(f"   Carte inserite : {total}")
print(f"   Con prezzo USD : {with_price}")
print(f"   Errori         : {errors}")
if sample:
    print(f"\n🃏 Esempio carta:")
    print(f"   Nome     : {sample.name}")
    print(f"   CMC      : {sample.mana_value}")
    print(f"   Rarità   : {sample.rarity}")
    print(f"   USD      : ${sample.price_usd}")
    print(f"   EUR      : €{sample.price_eur}")
    print(f"   Foil USD : ${sample.price_usd_foil}")
    print(f"   Synced   : {sample.last_synced_at}")

db.close()
print("\n✅ Test completato — DB in memoria eliminato automaticamente")
