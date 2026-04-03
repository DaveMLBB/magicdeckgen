# Analisi Colonne mtg_cards

## Riepilogo

**Totale colonne attuali:** ~70
**Colonne da eliminare:** 38
**Colonne da mantenere:** ~32

## Colonne MANTENUTE (usate nel codice)

### Identificatori (3)
- ✅ `uuid` - Primary key, usato ovunque
- ✅ `scryfall_id` - Usato per API Scryfall
- ✅ `oracle_id` - Identificatore carta unica

### Nomi e Lingua (3)
- ✅ `name` - Nome carta (EN), usato ovunque
- ✅ `name_it` - Nome italiano, usato nel frontend
- ✅ `lang` - Lingua carta

### Mana (2)
- ✅ `mana_cost` - Costo mana, mostrato ovunque
- ✅ `mana_value` - CMC, usato per filtri e statistiche

### Colori (2)
- ✅ `colors` - Colori carta, usato per filtri
- ✅ `color_identity` - Identità colore, usato per Commander

### Tipo (4)
- ✅ `type_line` - Tipo completo, usato come fallback
- ✅ `types` - Tipo principale (Creature, Instant, ecc.), usato ovunque
- ✅ `subtypes` - Sottotipi (Elf, Wizard, ecc.), usato per filtri
- ✅ `supertypes` - Supertipi (Legendary, Basic, ecc.), usato per filtri

### Testo (1)
- ✅ `text` - Oracle text, usato per ricerca e display

### Statistiche (3)
- ✅ `power` - Forza creatura
- ✅ `toughness` - Costituzione creatura
- ✅ `loyalty` - Fedeltà planeswalker

### Set (5)
- ✅ `set_code` - Codice set (MOM, LTR, ecc.), usato ovunque
- ✅ `set_name` - Nome set completo
- ✅ `collector_number` - Numero collezionista
- ✅ `rarity` - Rarità, usato per filtri e statistiche
- ✅ `released_at` - Data rilascio, usato per ordinamento

### Immagini (5)
- ✅ `image_url` - Immagine normale, usato ovunque
- ✅ `image_url_small` - Immagine piccola
- ✅ `image_url_large` - Immagine grande
- ✅ `image_url_art_crop` - Solo artwork
- ✅ `image_url_border_crop` - Crop con bordo

### Prezzi (4)
- ✅ `price_eur` - Prezzo EUR, mostrato nella collection
- ✅ `price_usd` - Prezzo USD, mostrato nella collection
- ✅ `price_eur_foil` - Prezzo EUR foil
- ✅ `price_usd_foil` - Prezzo USD foil

### Altro (3)
- ✅ `keywords` - Keywords meccaniche, usato per analisi
- ✅ `legalities` - Legalità formati (JSON), usato per filtri
- ✅ `promo` - Flag promo, usato in sync
- ✅ `reprint` - Flag ristampa, usato in sync

### Sync (1)
- ✅ `last_synced_at` - Timestamp ultimo sync

---

## Colonne da ELIMINARE (mai usate)

### ID Esterni (5) - NON USATI
- ❌ `arena_id` - ID Arena
- ❌ `mtgo_id` - ID MTGO
- ❌ `mtgo_foil_id` - ID MTGO foil
- ❌ `tcgplayer_id` - ID TCGPlayer
- ❌ `cardmarket_id` - ID Cardmarket

**Motivo:** Non usiamo queste piattaforme nel tool

### Traduzioni Non Usate (2)
- ❌ `text_it` - Testo italiano (non popolato da Scryfall EN)
- ❌ `type_it` - Tipo italiano (non popolato da Scryfall EN)

**Motivo:** Scryfall bulk "default_cards" è solo EN, queste restano sempre NULL

### Flavor (2)
- ❌ `flavor_text` - Testo flavor
- ❌ `flavor_name` - Nome flavor

**Motivo:** Non mostrati nel tool

### Statistiche Rare (3)
- ❌ `defense` - Difesa (solo Battle cards)
- ❌ `hand_modifier` - Modificatore mano (solo Vanguard)
- ❌ `life_modifier` - Modificatore vita (solo Vanguard)

**Motivo:** Carte rarissime, non supportate dal tool

### Set Metadata (2)
- ❌ `set_type` - Tipo set (expansion, core, ecc.)
- ❌ `set_uri` - URI set Scryfall

**Motivo:** Non usati, abbiamo già set_code e set_name

### Layout/Frame (5)
- ❌ `layout` - Layout carta (normal, split, ecc.)
- ❌ `border_color` - Colore bordo
- ❌ `frame` - Frame version
- ❌ `frame_effects` - Effetti frame
- ❌ `finishes` - Finiture disponibili

**Motivo:** Informazioni estetiche non usate

### Flags (5)
- ❌ `oversized` - Carta oversize
- ❌ `digital` - Solo digitale (già filtrato in sync)
- ❌ `full_art` - Full art
- ❌ `textless` - Senza testo
- ❌ `story_spotlight` - Spotlight storia

**Motivo:** Informazioni non rilevanti per il tool

### Artista (4)
- ❌ `artist` - Nome artista
- ❌ `artist_ids` - ID artisti
- ❌ `illustration_id` - ID illustrazione
- ❌ `watermark` - Watermark

**Motivo:** Non mostrati nel tool

### Altro (4)
- ❌ `color_indicator` - Indicatore colore (raro)
- ❌ `produced_mana` - Mana prodotto
- ❌ `games` - Giochi disponibili (paper, arena, ecc.)
- ❌ `image_status` - Status immagine

**Motivo:** Non usati

### Prezzi Rari (2)
- ❌ `price_usd_etched` - Prezzo USD etched
- ❌ `price_tix` - Prezzo MTGO tix

**Motivo:** Formati non supportati

### URI (3)
- ❌ `scryfall_uri` - URI pagina Scryfall
- ❌ `rulings_uri` - URI rulings
- ❌ `prints_search_uri` - URI ricerca stampe

**Motivo:** Non usati, abbiamo scryfall_id se serve

### JSON (1)
- ❌ `card_faces` - Facce carta (JSON) per double-faced

**Motivo:** Non usato, gestiamo double-faced con image_uris

---

## Impatto Eliminazione

**Spazio risparmiato stimato:** ~100-200 MB (dipende da numero carte)
**Performance query:** Migliorate (meno colonne da scansionare)
**Manutenzione:** Semplificata (meno campi da gestire)

## Prossimi Passi

1. ✅ Eseguire `drop_unused_mtg_cards_columns.py`
2. ⏳ Aggiornare `app/models.py` - rimuovere campi dal modello MTGCard
3. ⏳ Aggiornare `app/services/scryfall_sync.py` - rimuovere mapping campi eliminati
4. ⏳ Eseguire `VACUUM FULL` su PostgreSQL per recuperare spazio
