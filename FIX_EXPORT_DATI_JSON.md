# ✅ Fix Export Dati JSON

## Problema
Cliccando su "Scarica i Miei Dati" in Privacy Settings, veniva mostrato un errore:
```
SyntaxError: JSON.parse: unexpected character at line 1 column 1 of the JSON data
<!doctype html>...
```

## Causa
Il problema era che il frontend faceva una fetch dell'URL di download senza costruire correttamente l'URL assoluto. 

Quando l'endpoint backend restituiva:
```json
{
  "download_url": "/api/gdpr/download/abc123..."
}
```

Il frontend faceva:
```javascript
fetch(data.download_url)  // fetch("/api/gdpr/download/abc123...")
```

Ma il browser interpretava questo come una route relativa dell'app React (servita da Vite), non come una chiamata API al backend. Quindi restituiva l'HTML dell'app invece del JSON.

## Soluzione

### 1. PrivacySettings.jsx
Modificata la funzione `requestDataExport` per:
- Costruire l'URL assoluto: `${API_URL}${data.download_url}`
- Verificare che la risposta sia valida prima di creare il blob
- Migliorare la gestione errori con messaggi più dettagliati

```javascript
// Prima (SBAGLIATO)
const downloadRes = await fetch(data.download_url)

// Dopo (CORRETTO)
const downloadUrl = data.download_url.startsWith('http') 
  ? data.download_url 
  : `${API_URL}${data.download_url}`

const downloadRes = await fetch(downloadUrl)
```

### 2. DataExportButton.jsx
Applicata la stessa correzione per coerenza:
- Costruzione URL assoluto
- Verifica content-type della risposta
- Gestione errori migliorata

## File Modificati

1. **magic-deck-generator/src/components/PrivacySettings.jsx**
   - Funzione `requestDataExport()` corretta
   - URL assoluto per download
   - Verifica risposta valida
   - Messaggi errore dettagliati

2. **magic-deck-generator/src/components/DataExportButton.jsx**
   - Funzione `downloadFile()` corretta
   - URL assoluto per download
   - Verifica content-type
   - Gestione errori migliorata

## Come Funziona Ora

### Flusso Completo Export Dati

```
1. Utente clicca "Scarica i Miei Dati"
   ↓
2. Frontend: POST /api/gdpr/export
   Headers: Authorization: Bearer TOKEN
   ↓
3. Backend: 
   - Genera file JSON con tutti i dati utente
   - Salva in backend/data/exports/
   - Crea token sicuro (24h validità)
   - Salva in data_export_tokens
   ↓
4. Backend risponde:
   {
     "download_url": "/api/gdpr/download/abc123...",
     "expires_at": "2026-02-10T12:00:00",
     "file_size": 1234
   }
   ↓
5. Frontend:
   - Costruisce URL assoluto: 
     http://localhost:8000/api/gdpr/download/abc123...
   - Fa fetch dell'URL
   ↓
6. Backend: GET /api/gdpr/download/abc123...
   - Verifica token valido e non scaduto
   - Legge file JSON
   - Restituisce con headers:
     Content-Type: application/json
     Content-Disposition: attachment; filename="..."
   ↓
7. Frontend:
   - Riceve blob JSON
   - Crea URL temporaneo
   - Trigger download automatico
   - Cleanup URL
   ↓
8. ✅ File scaricato: user_data_11_1234567890.json
```

## Test

### Test 1: Export Dati da Privacy Settings
```
1. Login nell'app
2. Clicca "🔒 Privacy" nell'header
3. Scroll alla sezione "Gestione Dati"
4. Clicca "Scarica i Miei Dati"
5. ✅ Vedi "Generazione in corso..."
6. ✅ Dopo pochi secondi: "Download pronto"
7. ✅ File JSON scaricato automaticamente
8. ✅ Nome file: user_data_11_1234567890.json
```

### Test 2: Verifica Contenuto JSON
```
1. Apri il file JSON scaricato
2. ✅ Vedi struttura JSON valida:
{
  "user": {
    "id": 11,
    "email": "user@example.com",
    "created_at": "...",
    "is_verified": true
  },
  "collections": [...],
  "saved_decks": [...],
  "consent_history": [...],
  "policy_acceptances": [...]
}
```

### Test 3: Token Scaduto
```
1. Genera export
2. Aspetta 25 ore
3. Prova a scaricare di nuovo con lo stesso token
4. ✅ Errore: "Export token has expired"
5. ✅ Genera nuovo export per scaricare
```

## Struttura File Export

```json
{
  "export_info": {
    "generated_at": "2026-02-09T12:00:00Z",
    "user_id": 11,
    "format_version": "1.0"
  },
  "user": {
    "id": 11,
    "email": "user@example.com",
    "created_at": "2026-01-01T10:00:00Z",
    "is_verified": true,
    "last_login_at": "2026-02-09T11:00:00Z",
    "privacy_policy_version": "1.0",
    "terms_version": "1.0",
    "marketing_emails_enabled": true
  },
  "collections": [
    {
      "id": 1,
      "name": "Main Collection",
      "created_at": "2026-01-05T14:00:00Z",
      "card_count": 150,
      "total_cards": 450
    }
  ],
  "cards": [
    {
      "name": "Lightning Bolt",
      "quantity": 4,
      "type": "Instant",
      "colors": "R",
      "mana_cost": "{R}",
      "rarity": "Common"
    }
  ],
  "saved_decks": [
    {
      "id": 1,
      "name": "My Deck",
      "format": "Modern",
      "created_at": "2026-01-10T16:00:00Z",
      "is_public": false,
      "cards": [...]
    }
  ],
  "consent_history": [
    {
      "timestamp": "2026-02-09T10:00:00Z",
      "essential": true,
      "analytics": true,
      "marketing": false,
      "ip_address": "192.168.1.1",
      "banner_version": "1.0"
    }
  ],
  "policy_acceptances": [
    {
      "policy_type": "privacy_policy",
      "policy_version": "1.0",
      "accepted_at": "2026-01-01T10:00:00Z"
    },
    {
      "policy_type": "terms_of_service",
      "policy_version": "1.0",
      "accepted_at": "2026-01-01T10:00:00Z"
    }
  ]
}
```

## Sicurezza

### Token Export
- ✅ Generato con `secrets.token_urlsafe(32)` (256 bit)
- ✅ Validità 24 ore
- ✅ Uso singolo (può essere scaricato più volte ma scade)
- ✅ Cleanup automatico token scaduti

### File Export
- ✅ Salvati in `backend/data/exports/` (fuori da public)
- ✅ Nome file con user_id e timestamp
- ✅ Cleanup automatico file vecchi
- ✅ Nessun dato sensibile in URL (solo token)

### Headers Risposta
```
Content-Type: application/json
Content-Disposition: attachment; filename="user_data_11_1234567890.json"
Cache-Control: no-store, no-cache, must-revalidate, private
Pragma: no-cache
```

## Conformità GDPR

### Diritto di Accesso (Art. 15 GDPR)
✅ L'utente può scaricare tutti i suoi dati in formato leggibile (JSON)

### Portabilità Dati (Art. 20 GDPR)
✅ Formato strutturato e machine-readable (JSON)
✅ Include tutti i dati personali

### Dati Inclusi
- ✅ Informazioni account
- ✅ Collezioni carte
- ✅ Mazzi salvati
- ✅ Cronologia consensi
- ✅ Accettazioni policy
- ✅ Preferenze email

## Troubleshooting

### Problema: "Export failed"
**Causa**: Backend non raggiungibile o token non valido
**Soluzione**: 
- Verifica che backend sia in esecuzione
- Verifica che sei loggato (token valido)
- Controlla console browser per errori

### Problema: "Download failed: 404"
**Causa**: Token non trovato o già scaduto
**Soluzione**: Genera nuovo export

### Problema: "Download failed: 410"
**Causa**: Token scaduto (>24h)
**Soluzione**: Genera nuovo export

### Problema: File scaricato è HTML invece di JSON
**Causa**: URL non costruito correttamente (RISOLTO)
**Soluzione**: Aggiornamento già applicato

## Note Implementazione

### API_URL
```javascript
const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'
```

### Costruzione URL
```javascript
// Gestisce sia URL relativi che assoluti
const downloadUrl = data.download_url.startsWith('http') 
  ? data.download_url 
  : `${API_URL}${data.download_url}`
```

### Download Automatico
```javascript
const blob = await downloadRes.blob()
const url = window.URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `user_data_${user.userId}_${Date.now()}.json`
document.body.appendChild(a)
a.click()
window.URL.revokeObjectURL(url)
document.body.removeChild(a)
```

---

**Fix applicato e testato! ✅**

Ora l'export dati funziona correttamente e scarica un file JSON valido.
