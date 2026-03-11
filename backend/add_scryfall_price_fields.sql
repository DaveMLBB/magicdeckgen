-- Migration: aggiunge tutti i campi Scryfall alla tabella mtg_cards
-- Eseguire una sola volta su PostgreSQL:
-- psql -U magicdeckgen -d magicdeckgen -f add_scryfall_price_fields.sql

ALTER TABLE mtg_cards
    -- Identificatori
    ADD COLUMN IF NOT EXISTS scryfall_id       VARCHAR,
    ADD COLUMN IF NOT EXISTS oracle_id         VARCHAR,
    ADD COLUMN IF NOT EXISTS arena_id          INTEGER,
    ADD COLUMN IF NOT EXISTS mtgo_id           INTEGER,
    ADD COLUMN IF NOT EXISTS mtgo_foil_id      INTEGER,
    ADD COLUMN IF NOT EXISTS tcgplayer_id      INTEGER,
    ADD COLUMN IF NOT EXISTS cardmarket_id     INTEGER,
    -- Nomi / lingua
    ADD COLUMN IF NOT EXISTS lang              VARCHAR,
    -- Mana (mana_value diventa FLOAT per carte con X)
    ADD COLUMN IF NOT EXISTS price_usd         FLOAT,
    ADD COLUMN IF NOT EXISTS price_usd_foil    FLOAT,
    ADD COLUMN IF NOT EXISTS price_usd_etched  FLOAT,
    ADD COLUMN IF NOT EXISTS price_eur         FLOAT,
    ADD COLUMN IF NOT EXISTS price_eur_foil    FLOAT,
    ADD COLUMN IF NOT EXISTS price_tix         FLOAT,
    -- Colori
    ADD COLUMN IF NOT EXISTS color_indicator   VARCHAR,
    -- Tipo
    ADD COLUMN IF NOT EXISTS flavor_name       VARCHAR,
    ADD COLUMN IF NOT EXISTS hand_modifier     VARCHAR,
    ADD COLUMN IF NOT EXISTS life_modifier     VARCHAR,
    -- Set
    ADD COLUMN IF NOT EXISTS set_name          VARCHAR,
    ADD COLUMN IF NOT EXISTS set_type          VARCHAR,
    ADD COLUMN IF NOT EXISTS set_uri           VARCHAR,
    ADD COLUMN IF NOT EXISTS collector_number  VARCHAR,
    ADD COLUMN IF NOT EXISTS released_at       VARCHAR,
    -- Layout
    ADD COLUMN IF NOT EXISTS border_color      VARCHAR,
    ADD COLUMN IF NOT EXISTS frame             VARCHAR,
    ADD COLUMN IF NOT EXISTS frame_effects     VARCHAR,
    ADD COLUMN IF NOT EXISTS finishes          VARCHAR,
    ADD COLUMN IF NOT EXISTS oversized         BOOLEAN,
    ADD COLUMN IF NOT EXISTS promo             BOOLEAN,
    ADD COLUMN IF NOT EXISTS reprint           BOOLEAN,
    ADD COLUMN IF NOT EXISTS digital           BOOLEAN,
    ADD COLUMN IF NOT EXISTS full_art          BOOLEAN,
    ADD COLUMN IF NOT EXISTS textless          BOOLEAN,
    ADD COLUMN IF NOT EXISTS story_spotlight   BOOLEAN,
    -- Artista
    ADD COLUMN IF NOT EXISTS artist_ids        VARCHAR,
    ADD COLUMN IF NOT EXISTS illustration_id   VARCHAR,
    ADD COLUMN IF NOT EXISTS watermark         VARCHAR,
    -- Keywords
    ADD COLUMN IF NOT EXISTS produced_mana     VARCHAR,
    ADD COLUMN IF NOT EXISTS games             VARCHAR,
    -- Immagini extra
    ADD COLUMN IF NOT EXISTS image_url_small       VARCHAR,
    ADD COLUMN IF NOT EXISTS image_url_large       VARCHAR,
    ADD COLUMN IF NOT EXISTS image_url_art_crop    VARCHAR,
    ADD COLUMN IF NOT EXISTS image_url_border_crop VARCHAR,
    ADD COLUMN IF NOT EXISTS image_status          VARCHAR,
    -- URI
    ADD COLUMN IF NOT EXISTS scryfall_uri          VARCHAR,
    ADD COLUMN IF NOT EXISTS rulings_uri           VARCHAR,
    ADD COLUMN IF NOT EXISTS prints_search_uri     VARCHAR,
    -- Double-faced
    ADD COLUMN IF NOT EXISTS card_faces            TEXT,
    -- Sync
    ADD COLUMN IF NOT EXISTS last_synced_at        TIMESTAMP;

CREATE INDEX IF NOT EXISTS ix_mtg_cards_scryfall_id ON mtg_cards (scryfall_id);
CREATE INDEX IF NOT EXISTS ix_mtg_cards_oracle_id   ON mtg_cards (oracle_id);
