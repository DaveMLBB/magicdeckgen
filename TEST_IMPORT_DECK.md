# Test - Importa Mazzo in Collezione

## Prerequisiti

1. Backend in esecuzione
2. Frontend in esecuzione
3. Utente registrato e loggato
4. Almeno un deck template nel database

## Test Manuale

### 1. Verifica Endpoint Backend

```bash
# Avvia il backend
cd backend
source venv/bin/activate
python run.py
```

Testa l'endpoint con curl:

```bash
# Sostituisci USER_ID e DECK_TEMPLATE_ID con valori reali
curl -X POST "http://localhost:8000/api/collections/import-deck/1/1" \
  -H "Content-Type: application/json"
```

Risposta attesa:
```json
{
  "id": 1,
  "name": "Dragon Stompy",
  "description": "Imported from Legacy deck: Dragon Stompy",
  "cards_added": 60,
  "created_at": "2026-02-08T..."
}
```

### 2. Test Frontend

1. **Avvia il frontend**:
   ```bash
   cd magic-deck-generator
   npm run dev
   ```

2. **Login**:
   - Vai su http://localhost:5173
   - Effettua login con le tue credenziali

3. **Carica collezione o file**:
   - Carica un file CSV/Excel con le tue carte
   - Oppure carica una collezione esistente

4. **Cerca mazzi**:
   - Clicca "🔍 Trova Mazzi Compatibili"
   - Seleziona un formato (es. Modern, Legacy)
   - Attendi i risultati

5. **Seleziona un mazzo**:
   - Clicca su uno dei mazzi trovati
   - Verifica che appaia la sezione dettagli

6. **Importa il mazzo**:
   - Clicca sul pulsante "📥 Importa in Collezione"
   - Verifica che appaia lo spinner "Importando..."
   - Attendi il messaggio di successo

7. **Verifica la collezione**:
   - Clicca su "📚 Collezione" nell'header
   - Verifica che la nuova collezione sia presente
   - Clicca sulla collezione per vedere le carte

### 3. Test Limiti Abbonamento

**Test con utente Free (limite 5 collezioni)**:

1. Crea 5 collezioni
2. Prova a importare un sesto mazzo
3. Verifica errore: "Collection limit reached (5)"

**Test con utente Premium**:

1. Verifica limiti aumentati o illimitati
2. Importa più mazzi senza problemi

### 4. Test Nomi Duplicati

1. Importa un mazzo (es. "Izzet Control")
2. Importa lo stesso mazzo di nuovo
3. Verifica che la seconda collezione si chiami "Izzet Control (1)"
4. Importa ancora
5. Verifica "Izzet Control (2)"

### 5. Test Errori

**Deck senza carte**:
- Dovrebbe mostrare: "Deck template has no cards"

**Utente non trovato**:
- Dovrebbe mostrare: "User not found"

**Limite raggiunto**:
- Dovrebbe mostrare: "Collection limit reached"

## Test Automatico con Browser DevTools

Apri la console del browser e esegui:

```javascript
// Test import deck
const testImport = async () => {
  const userId = 1; // Sostituisci con il tuo user ID
  const deckTemplateId = 1; // Sostituisci con un deck template ID valido
  
  const response = await fetch(
    `http://localhost:8000/api/collections/import-deck/${userId}/${deckTemplateId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  console.log('Response:', data);
  
  if (response.ok) {
    console.log('✅ Import successful!');
    console.log(`Collection: ${data.name}`);
    console.log(`Cards added: ${data.cards_added}`);
  } else {
    console.error('❌ Import failed:', data.detail);
  }
};

testImport();
```

## Checklist Completa

- [ ] Backend avviato senza errori
- [ ] Frontend avviato senza errori
- [ ] Login effettuato con successo
- [ ] Ricerca mazzi funzionante
- [ ] Pulsante "Importa in Collezione" visibile
- [ ] Click sul pulsante mostra spinner
- [ ] Messaggio di successo appare
- [ ] Collezione creata e visibile in lista
- [ ] Carte del mazzo presenti nella collezione
- [ ] Nomi duplicati gestiti correttamente
- [ ] Limiti abbonamento rispettati
- [ ] Errori gestiti correttamente
- [ ] Responsive su mobile

## Problemi Comuni

### Pulsante non appare
- Verifica che `deck.deck_template_id` sia presente nei dati
- Controlla la console per errori JavaScript

### Errore 404
- Verifica che il router sia registrato in `main.py`
- Controlla che l'URL sia corretto

### Errore 403 (Limite raggiunto)
- Verifica il piano di abbonamento dell'utente
- Elimina alcune collezioni per fare spazio

### Collezione creata ma senza carte
- Verifica che il deck template abbia carte nel database
- Controlla i log del backend per errori

## Log da Monitorare

Backend:
```
INFO:     POST /api/collections/import-deck/1/1
INFO:     Response: 200 OK
```

Frontend Console:
```
✅ Mazzo importato con successo! "Dragon Stompy" (60 carte)
```

## Cleanup dopo Test

```sql
-- Elimina collezioni di test
DELETE FROM card_collections WHERE name LIKE '%Test%';

-- Elimina carte delle collezioni di test
DELETE FROM cards WHERE collection_id IN (
  SELECT id FROM card_collections WHERE name LIKE '%Test%'
);
```
