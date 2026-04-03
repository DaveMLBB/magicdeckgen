# Fix Deployment - MTG Cards Model Update

## Problema Riscontrato

Il sync Scryfall fallisce con errore:
```
psycopg2.errors.UndefinedColumn: column mtg_cards.arena_id does not exist
```

**Causa:** Hai eseguito `drop_unused_mtg_cards_columns.py` sul database di produzione, eliminando 38 colonne, ma il modello Python `MTGCard` in `app/models.py` e il servizio `scryfall_sync.py` contenevano ancora riferimenti a queste colonne.

## Fix Applicati (Local)

✅ **1. Aggiornato `app/models.py`**
- Rimossi 38 campi dal modello `MTGCard`
- Campi eliminati: `arena_id`, `mtgo_id`, `mtgo_foil_id`, `tcgplayer_id`, `cardmarket_id`, `text_it`, `type_it`, `flavor_text`, `flavor_name`, `defense`, `hand_modifier`, `life_modifier`, `set_type`, `set_uri`, `layout`, `border_color`, `frame`, `frame_effects`, `finishes`, `oversized`, `digital`, `full_art`, `textless`, `story_spotlight`, `artist`, `artist_ids`, `illustration_id`, `watermark`, `color_indicator`, `produced_mana`, `games`, `image_status`, `price_usd_etched`, `price_tix`, `scryfall_uri`, `rulings_uri`, `prints_search_uri`, `card_faces`

✅ **2. Aggiornato `app/services/scryfall_sync.py`**
- Rimosso mapping dei 38 campi eliminati dalla funzione `_map()`
- Aggiornata lista `UPDATE_FIELDS` per rimuovere campi obsoleti

✅ **3. Aggiornato `app/routers/mtg_cards.py`**
- Rimosso riferimento a `MTGCard.text_it` nella ricerca testo

## Deployment su Produzione

### 1. Pull delle modifiche

```bash
cd /var/www/magicdeckgen
git pull origin main
```

### 2. Restart del backend

```bash
sudo systemctl restart magicdeckgen-backend
# oppure
sudo supervisorctl restart magicdeckgen-backend
```

### 3. Verifica sync Scryfall

```bash
cd /var/www/magicdeckgen/backend
source venv/bin/activate
python run_scryfall_sync.py
```

**Output atteso:**
```
2026-04-03 XX:XX:XX - __main__ - INFO - 🔄 Scryfall Weekly Sync - START
2026-04-03 XX:XX:XX - app.services.scryfall_sync - INFO - Download OK: 507.2 MB
2026-04-03 XX:XX:XX - app.services.scryfall_sync - INFO - Carte nel bulk: 113253
2026-04-03 XX:XX:XX - app.services.scryfall_sync - INFO - ...500 inserite, 0 aggiornate
...
2026-04-03 XX:XX:XX - __main__ - INFO - ✅ Sync completato con successo!
```

## Verifica Post-Deployment

```bash
# Verifica che il backend sia attivo
curl http://localhost:8000/health

# Verifica numero carte nel DB
psql -U magicdeckgen -d magicdeckgen_prod -c "SELECT COUNT(*) FROM mtg_cards;"

# Verifica ultima sincronizzazione
psql -U magicdeckgen -d magicdeckgen_prod -c "SELECT MAX(last_synced_at) FROM mtg_cards;"
```

## Colonne Mantenute (32)

- **Identificatori:** uuid, scryfall_id, oracle_id
- **Nomi:** name, name_it, lang
- **Mana:** mana_cost, mana_value
- **Colori:** colors, color_identity
- **Tipo:** type_line, types, subtypes, supertypes
- **Testo:** text
- **Stats:** power, toughness, loyalty
- **Set:** set_code, set_name, collector_number, rarity, released_at
- **Immagini:** image_url, image_url_small, image_url_large, image_url_art_crop, image_url_border_crop
- **Prezzi:** price_usd, price_usd_foil, price_eur, price_eur_foil
- **Altro:** keywords, legalities, promo, reprint
- **Sync:** last_synced_at

## Rollback (se necessario)

Se il deployment causa problemi, puoi ripristinare le colonne nel database:

```sql
-- SOLO SE NECESSARIO - Ripristina le colonne eliminate
-- (Dovrai poi ripristinare anche il codice vecchio)
ALTER TABLE mtg_cards ADD COLUMN arena_id INTEGER;
ALTER TABLE mtg_cards ADD COLUMN mtgo_id INTEGER;
-- ... (tutte le altre 36 colonne)
```

**Nota:** È meglio procedere con il fix piuttosto che fare rollback, dato che le colonne eliminate non erano usate.
