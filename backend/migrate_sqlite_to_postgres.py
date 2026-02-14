"""
Script per migrare i dati dal database SQLite di esempio (data magic/magic.db)
al database PostgreSQL locale (Docker).

Uso:
  1. Avvia il container PostgreSQL: docker compose up -d
  2. Esegui: python migrate_sqlite_to_postgres.py
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

import sqlalchemy
from sqlalchemy import create_engine, inspect, text, MetaData

# --- Configurazione ---
BACKEND_DIR = Path(__file__).parent
SQLITE_DB_PATH = BACKEND_DIR.parent / "data magic" / "magic.db"

POSTGRES_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://magicdeckgen:magicdeckgen_dev@localhost:5434/magicdeckgen"
)

def get_sqlite_engine():
    if not SQLITE_DB_PATH.exists():
        print(f"❌ Database SQLite non trovato: {SQLITE_DB_PATH}")
        sys.exit(1)
    url = f"sqlite:///{SQLITE_DB_PATH}"
    return create_engine(url, connect_args={"check_same_thread": False})

def get_postgres_engine():
    return create_engine(POSTGRES_URL, pool_pre_ping=True)

def migrate():
    print("=" * 60)
    print("  Migrazione SQLite → PostgreSQL")
    print("=" * 60)
    print(f"📂 SQLite source: {SQLITE_DB_PATH}")
    print(f"🐘 PostgreSQL target: {POSTGRES_URL.split('@')[0]}@***")
    print()

    sqlite_engine = get_sqlite_engine()
    pg_engine = get_postgres_engine()

    # Test connessione PostgreSQL
    try:
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Connessione PostgreSQL OK")
    except Exception as e:
        print(f"❌ Impossibile connettersi a PostgreSQL: {e}")
        print("   Assicurati che il container Docker sia avviato: docker compose up -d")
        sys.exit(1)

    # Crea le tabelle su PostgreSQL usando i modelli SQLAlchemy
    print("\n📋 Creazione schema su PostgreSQL...")
    from app.database import Base
    from app.models import (
        User, Card, Deck, DeckTemplate, DeckTemplateCard,
        CardCollection, SavedDeck, SavedDeckCard, MTGCard,
        ConsentLog, DeletionRequest, DataExportToken, PolicyAcceptance
    )
    Base.metadata.create_all(bind=pg_engine)
    print("✅ Schema creato")

    # Leggi le tabelle dal database SQLite
    sqlite_inspector = inspect(sqlite_engine)
    sqlite_tables = sqlite_inspector.get_table_names()
    print(f"\n📊 Tabelle trovate in SQLite: {sqlite_tables}")

    # Ordine di migrazione (rispetta le foreign key)
    migration_order = [
        "users",
        "card_collections",
        "cards",
        "decks",
        "deck_cards",
        "deck_templates",
        "deck_template_cards",
        "mtg_cards",
        "saved_decks",
        "saved_deck_cards",
        "saved_deck_collections",
        "consent_logs",
        "deletion_requests",
        "data_export_tokens",
        "policy_acceptances",
    ]

    # Migra solo le tabelle che esistono in SQLite
    tables_to_migrate = [t for t in migration_order if t in sqlite_tables]
    # Aggiungi eventuali tabelle non nell'ordine predefinito
    for t in sqlite_tables:
        if t not in tables_to_migrate:
            tables_to_migrate.append(t)

    print(f"\n🔄 Tabelle da migrare: {tables_to_migrate}")

    # Rifletti i metadati SQLite
    sqlite_meta = MetaData()
    sqlite_meta.reflect(bind=sqlite_engine)

    # Rifletti i metadati PostgreSQL una sola volta
    pg_meta = MetaData()
    pg_meta.reflect(bind=pg_engine)

    total_rows = 0

    # Disabilita i vincoli FK per tutta la migrazione
    with pg_engine.begin() as conn:
        conn.execute(text("SET session_replication_role = 'replica'"))
        print("🔓 Vincoli FK disabilitati temporaneamente")
        print("⚠️  Ogni tabella viene SVUOTATA e reinserita da zero (nessun duplicato)")

        for table_name in tables_to_migrate:
            if table_name not in sqlite_meta.tables:
                print(f"  ⚠️  Tabella '{table_name}' non trovata nei metadati SQLite, skip")
                continue

            sqlite_table = sqlite_meta.tables[table_name]

            # Leggi tutti i dati dalla tabella SQLite
            with sqlite_engine.connect() as src_conn:
                rows = src_conn.execute(sqlite_table.select()).fetchall()
                columns = [col.name for col in sqlite_table.columns]

            if not rows:
                print(f"  📭 {table_name}: vuota, skip")
                continue

            # Converti in lista di dict
            data = [dict(zip(columns, row)) for row in rows]

            # Svuota la tabella PostgreSQL prima di inserire
            conn.execute(text(f'DELETE FROM "{table_name}"'))

            # Inserisci i dati in PostgreSQL a chunks
            chunk_size = 500
            inserted = 0
            try:
                if table_name in pg_meta.tables:
                    pg_table = pg_meta.tables[table_name]
                    for i in range(0, len(data), chunk_size):
                        chunk = data[i:i + chunk_size]
                        conn.execute(pg_table.insert(), chunk)
                        inserted += len(chunk)
                total_rows += inserted
                print(f"  ✅ {table_name}: {inserted} righe migrate")
            except Exception as e:
                print(f"  ❌ {table_name}: errore - {e}")

        # Riabilita i vincoli FK
        conn.execute(text("SET session_replication_role = 'origin'"))
        print("🔒 Vincoli FK riabilitati")

    # Aggiorna le sequenze PostgreSQL (auto-increment)
    print("\n🔧 Aggiornamento sequenze PostgreSQL...")
    pg_inspector = inspect(pg_engine)
    with pg_engine.begin() as conn:
        for table_name in tables_to_migrate:
            try:
                columns = pg_inspector.get_columns(table_name)
                for col in columns:
                    if col.get('autoincrement', False) or col['name'] == 'id':
                        seq_name = f"{table_name}_{col['name']}_seq"
                        try:
                            conn.execute(text(
                                f"SELECT setval('{seq_name}', "
                                f"COALESCE((SELECT MAX({col['name']}) FROM \"{table_name}\"), 0) + 1, false)"
                            ))
                        except Exception:
                            pass  # Sequenza potrebbe non esistere per questa colonna
            except Exception:
                pass

    print(f"\n{'=' * 60}")
    print(f"  ✅ Migrazione completata! {total_rows} righe totali migrate.")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    migrate()
