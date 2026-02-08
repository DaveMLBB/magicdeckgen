# Changelog - Importa Mazzo in Collezione

## Funzionalità Implementata

Ora è possibile importare un mazzo dalla ricerca direttamente come collezione. La collezione prenderà il nome del mazzo e conterrà tutte le carte del deck template.

## Modifiche Implementate

### Backend

#### `backend/app/routers/collections.py`
**Nuovo Endpoint**: `POST /api/collections/import-deck/{user_id}/{deck_template_id}`

Funzionalità:
- Verifica che l'utente esista
- Controlla i limiti di collezioni in base al piano di abbonamento
- Recupera il deck template e le sue carte
- Gestisce nomi duplicati aggiungendo un contatore (es. "Deck Name (1)")
- Crea una nuova collezione con descrizione automatica
- Importa tutte le carte del deck nella collezione
- Restituisce ID collezione, nome, descrizione e numero di carte aggiunte

Limiti collezioni per piano:
- Free: 5 collezioni
- Monthly 10: 10 collezioni
- Monthly 30: 50 collezioni
- Yearly: Illimitate
- Lifetime: Illimitate

#### `backend/app/routers/decks.py`
**Modifica**: Endpoint `/api/decks/match/{user_id}`

- Aggiunto campo `deck_template_id` nei risultati della ricerca
- Necessario per identificare il deck da importare

### Frontend

#### `magic-deck-generator/src/App.jsx`

**Nuovo Stato**:
```javascript
const [importing, setImporting] = useState(false)
```

**Nuova Funzione**: `importDeckAsCollection(deckIndex)`
- Recupera il deck selezionato
- Chiama l'endpoint di import
- Mostra messaggio di successo/errore
- Reindirizza automaticamente alla lista collezioni dopo 2 secondi

**Nuove Traduzioni**:
- `importToCollection`: "Importa in Collezione" / "Import to Collection"
- `importing`: "Importando..." / "Importing..."
- `deckImported`: "Mazzo importato con successo!" / "Deck imported successfully!"
- `errorImporting`: "Errore durante l'importazione del mazzo" / "Error importing deck"

**UI Modificata**:
- Aggiunto header con pulsante nella sezione dettagli deck
- Pulsante "📥 Importa in Collezione" accanto al titolo del mazzo
- Pulsante disabilitato durante l'importazione con spinner

#### `magic-deck-generator/src/App.css`

**Nuovi Stili**:
- `.deck-detail-header`: Layout flex per titolo e pulsante
- `.import-deck-btn`: Stile pulsante verde con gradiente
- Responsive: pulsante full-width su mobile

## Come Usare

1. **Cerca mazzi compatibili**:
   - Carica la tua collezione o file
   - Usa i filtri per trovare mazzi
   - Clicca su un mazzo per vedere i dettagli

2. **Importa il mazzo**:
   - Nella sezione dettagli, clicca "📥 Importa in Collezione"
   - Il sistema crea automaticamente una collezione con il nome del mazzo
   - Tutte le carte del mazzo vengono aggiunte alla collezione

3. **Gestisci la collezione**:
   - Vai su "📚 Collezione" per vedere tutte le tue collezioni
   - La nuova collezione apparirà con il nome del mazzo
   - Puoi modificare, eliminare o usare la collezione per altre ricerche

## Esempio di Flusso

```
1. Ricerca mazzi → Trova "Izzet Control" (85% match)
2. Clicca sul mazzo → Vedi dettagli
3. Clicca "📥 Importa in Collezione"
4. Sistema crea collezione "Izzet Control" con 60 carte
5. Messaggio: "✅ Mazzo importato con successo! 'Izzet Control' (60 carte)"
6. Reindirizzamento automatico a lista collezioni
```

## Gestione Nomi Duplicati

Se esiste già una collezione con lo stesso nome:
- Prima importazione: "Izzet Control"
- Seconda importazione: "Izzet Control (1)"
- Terza importazione: "Izzet Control (2)"
- E così via...

## Note Tecniche

- L'import rispetta i limiti di collezioni del piano di abbonamento
- Le carte vengono importate con le quantità esatte del deck template
- La descrizione della collezione include formato e nome originale
- L'operazione è atomica: o tutte le carte vengono importate o nessuna

## Errori Gestiti

- Utente non trovato
- Limite collezioni raggiunto
- Deck template non trovato
- Deck template senza carte
- Errori di rete

## Testing

Per testare la funzionalità:

1. Avvia backend e frontend
2. Effettua login
3. Cerca mazzi compatibili
4. Seleziona un mazzo
5. Clicca "Importa in Collezione"
6. Verifica che la collezione sia stata creata
7. Vai su "📚 Collezione" per confermare

## Screenshot Attesi

### Dettagli Mazzo con Pulsante
```
┌─────────────────────────────────────────────┐
│ Izzet Control        [📥 Importa in Collezione] │
├─────────────────────────────────────────────┤
│ Formato: Modern                             │
│ Match: 85%                                  │
│ Carte possedute: 51/60                      │
└─────────────────────────────────────────────┘
```

### Durante Import
```
┌─────────────────────────────────────────────┐
│ Izzet Control        [⏳ Importando...]      │
└─────────────────────────────────────────────┘
```

### Messaggio Successo
```
✅ Mazzo importato con successo! "Izzet Control" (60 carte)
```
