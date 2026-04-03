# Deployment - Supporto Multilingua Completo

## Obiettivo

Caricare **tutte le carte Magic da Scryfall** con **tutti i dati disponibili** in **tutte le lingue** e **tutti i set**.

## Modifiche Applicate

### 1. Ripristino Colonne Database

**Script:** `restore_mtg_cards_columns.py`

Ripristina le 38 colonne precedentemente eliminate per supportare:
- ✅ Traduzioni multilingua (`text_it`, `type_it`, ecc.)
- ✅ ID esterni per integrazione piattaforme (`arena_id`, `mtgo_id`, `tcgplayer_id`, ecc.)
- ✅ Metadati completi (artista, layout, frame, flavor text, ecc.)
- ✅ Prezzi completi (USD, EUR, TIX, etched)
- ✅ URI e link esterni
- ✅ Supporto carte double-faced (`card_faces` JSON)

### 2. Modello MTGCard Completo

**File:** `app/models.py`

Ripristinati tutti i 70 campi del modello MTGCard per dataset completo:

**Identificatori (8):**
- uuid, scryfall_id, oracle_id
- arena_id, mtgo_id, mtgo_foil_id, tcgplayer_id, cardmarket_id

**Traduzioni (3):**
- name_it, text_it, type_it

**Metadati Completi (59 campi totali)**

### 3. Sync Scryfall Completo

**File:** `app/services/scryfall_sync.py`

- ✅ Mapping completo di tutti i campi Scryfall
- ✅ Supporto carte double-faced (card_faces JSON)
- ✅ Tutti i prezzi (USD, EUR, TIX, etched)
- ✅ Tutti i metadati (artista, layout, frame, ecc.)

### 4. API Multilingua

**File:** `app/routers/mtg_cards.py`

- ✅ Supporto `language=it` per traduzioni italiane
- ✅ Fallback automatico a inglese se traduzione non disponibile
- ✅ Tutti i campi esposti nelle API

---

## Deployment su Produzione

### Passo 1: Ripristinare Colonne nel Database

```bash
# Sul server di produzione
cd /var/www/magicdeckgen/backend
source venv/bin/activate

# Esegui migration per ripristinare colonne
python restore_mtg_cards_columns.py
```

**Output atteso:**
```
================================================================================
RIPRISTINO COLONNE mtg_cards - Supporto Multilingua Completo
================================================================================

📋 Colonne da ripristinare: 38

✅ arena_id                  - ripristinata (INTEGER)
✅ mtgo_id                   - ripristinata (INTEGER)
✅ text_it                   - ripristinata (TEXT)
✅ type_it                   - ripristinata (TEXT)
...
✅ card_faces                - ripristinata (TEXT)

================================================================================
✅ Ripristino completato!
================================================================================
```

### Passo 2: Pull Codice Aggiornato

```bash
cd /var/www/magicdeckgen
git pull origin main
```

### Passo 3: Restart Backend

```bash
sudo systemctl restart magicdeckgen-backend
sudo systemctl status magicdeckgen-backend
```

### Passo 4: Sync Completo Scryfall

```bash
cd /var/www/magicdeckgen/backend
source venv/bin/activate
python run_scryfall_sync.py
```

**Questo caricherà ~113,000 carte con tutti i dati disponibili.**

---

## Strategia Multilingua

### Fase 1: Caricamento Base (EN)

Il sync attuale carica tutte le carte in inglese dal bulk data Scryfall.

**File scaricato:** `default-cards-YYYYMMDD.json` (~500 MB)
**Carte:** ~113,000 carte uniche in inglese

### Fase 2: Sync Traduzioni Italiane (TODO)

Per popolare `name_it`, `text_it`, `type_it`, dobbiamo implementare un secondo sync che:

1. Scarica il bulk data italiano da Scryfall
2. Fa match per `oracle_id` (ID univoco della carta, indipendente dalla lingua)
3. Aggiorna solo i campi traduzione

**Script da creare:** `sync_italian_translations.py`

```python
# Pseudo-codice
def sync_italian_translations():
    # 1. Scarica bulk data italiano
    url = "https://api.scryfall.com/bulk-data/all-cards"
    # Filtra per lang=it
    
    # 2. Per ogni carta italiana
    for it_card in italian_cards:
        # 3. Trova carta inglese corrispondente per oracle_id
        en_card = db.query(MTGCard).filter(
            MTGCard.oracle_id == it_card["oracle_id"],
            MTGCard.lang == "en"
        ).first()
        
        # 4. Aggiorna traduzioni
        if en_card:
            en_card.name_it = it_card["name"]
            en_card.text_it = it_card["oracle_text"]
            en_card.type_it = it_card["type_line"]
            db.commit()
```

### Fase 3: Altre Lingue (Opzionale)

Per supportare DE, FR, ES, JA, ecc., aggiungi colonne:
- `name_de`, `text_de`, `type_de`
- `name_fr`, `text_fr`, `type_fr`
- ecc.

---

## Verifica Post-Deployment

### 1. Verifica Colonne Ripristinate

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mtg_cards' 
ORDER BY ordinal_position;
```

Dovrebbe mostrare **70 colonne totali**.

### 2. Verifica Sync Completato

```sql
-- Conta carte totali
SELECT COUNT(*) FROM mtg_cards;
-- Output atteso: ~113,000

-- Verifica ultima sincronizzazione
SELECT MAX(last_synced_at) FROM mtg_cards;

-- Verifica carte con traduzioni (dopo sync IT)
SELECT COUNT(*) FROM mtg_cards WHERE text_it IS NOT NULL;
```

### 3. Test API Multilingua

```bash
# Test ricerca in italiano
curl "https://api.mtgdecksbuilder.com/api/mtg-cards/search?language=it&page=1&page_size=10"

# Dovrebbe restituire carte con name_it, text_it, type_it se disponibili
```

---

## Dimensioni Database

Con tutte le colonne e ~113,000 carte:

- **Righe:** ~113,000 (solo EN) → ~500,000+ (con tutte le lingue e varianti)
- **Dimensione stimata:** ~2-5 GB (dipende da quante lingue/varianti)
- **Indici:** uuid, scryfall_id, oracle_id, set_code, rarity, type_line

**Nota:** Se vuoi caricare **tutte le varianti** (ogni stampa di ogni set), il numero sale a ~800,000+ carte.

---

## Prossimi Passi

1. ✅ **Ripristinare colonne** - `restore_mtg_cards_columns.py`
2. ✅ **Deploy codice aggiornato** - `git pull` + restart
3. ✅ **Sync base EN** - `run_scryfall_sync.py`
4. 🔲 **Implementare sync traduzioni IT** - `sync_italian_translations.py`
5. 🔲 **Testare API multilingua**
6. 🔲 **Ottimizzare query e indici** se necessario
7. 🔲 **Implementare cache** per performance

---

## Note Importanti

### Bulk Data vs API

**Bulk Data (attuale):**
- ✅ Veloce (~2 minuti per 113k carte)
- ✅ Nessun rate limit
- ✅ Dataset completo
- ❌ Solo carte uniche (non tutte le stampe)
- ❌ Una lingua per file

**API Scryfall:**
- ✅ Tutte le stampe di ogni set
- ✅ Ricerca avanzata
- ❌ Rate limit (10 req/sec)
- ❌ Lento per dataset completo

**Raccomandazione:** Usa bulk data per caricamento iniziale, poi API per aggiornamenti incrementali.

### Gestione Varianti

Scryfall distingue:
- **oracle_id:** Carta unica (es. "Lightning Bolt")
- **uuid:** Stampa specifica (es. "Lightning Bolt - Alpha", "Lightning Bolt - M10", ecc.)

Attualmente carichiamo per **uuid** (tutte le stampe).

Se vuoi solo carte uniche, filtra per `oracle_id` e prendi solo una stampa per carta.

---

## Rollback (se necessario)

Se qualcosa va storto:

```bash
# 1. Ripristina codice vecchio
cd /var/www/magicdeckgen
git checkout <commit-precedente>
sudo systemctl restart magicdeckgen-backend

# 2. Elimina di nuovo le colonne (se necessario)
python drop_unused_mtg_cards_columns.py
```

**Meglio fare backup del DB prima del deployment!**

```bash
pg_dump -U magicdeckgen magicdeckgen_prod > backup_pre_multilingua.sql
```
