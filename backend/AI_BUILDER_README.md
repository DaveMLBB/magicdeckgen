# AI Builder Feature

## Overview

AI Builder è una funzionalità premium che utilizza l'intelligenza artificiale (Groq Llama 3.1 70B) per analizzare e ottimizzare mazzi Magic: The Gathering esistenti.

**🆓 COMPLETAMENTE GRATUITO** - Usa Groq invece di OpenAI (nessun costo, velocissimo!)

## Funzionalità

- **Analisi Mazzo Completa**: Valuta forza, debolezza, curva di mana e sinergie
- **Suggerimenti Carte**: Raccomanda carte da aggiungere, rimuovere o sostituire
- **Ottimizzazione Strategica**: Fornisce consigli strategici basati sull'archetipo del mazzo
- **Obiettivi Personalizzabili**: Ottimizza per bilanciamento, aggressività, difesa o budget

## Costo Token

- **2 token** per ogni analisi AI di un mazzo
- Fallback automatico a suggerimenti base se OpenAI non è disponibile

## Setup Backend

### 1. Installare OpenAI SDK (per compatibilità Groq)

```bash
cd backend
source venv/bin/activate
pip install openai
```

### 2. Ottenere API Key GRATUITA da Groq

1. Vai su https://console.groq.com
2. Registrati (gratis)
3. Vai su "API Keys"
4. Crea una nuova API key (gratis, nessuna carta richiesta)
5. Copia la key (inizia con `gsk_...`)

### 3. Configurare API Key

Aggiungi al file `.env`:

```bash
GROQ_API_KEY=gsk_your-groq-api-key-here
```

### 4. Verificare Installazione

```bash
python -c "from openai import AsyncOpenAI; print('SDK installed successfully')"
```

## API Endpoints

### POST /api/ai/optimize-deck

Analizza un mazzo e fornisce suggerimenti di ottimizzazione.

**Request Body:**
```json
{
  "deck_id": 123,
  "user_id": 456,
  "optimization_goal": "balanced"
}
```

**Optimization Goals:**
- `balanced`: Mazzo bilanciato e versatile
- `aggressive`: Ottimizzazione per strategia aggro
- `defensive`: Ottimizzazione per controllo/difesa
- `budget`: Suggerimenti economici

**Response:**
```json
{
  "deck_id": 123,
  "deck_name": "My Deck",
  "analysis": {
    "total_cards": 60,
    "mana_curve": { "0": 0, "1": 8, "2": 12, ... },
    "card_types": { "Creature": 24, "Instant": 8, ... }
  },
  "suggestions": {
    "overall_assessment": "...",
    "mana_curve_analysis": "...",
    "synergy_evaluation": "...",
    "card_suggestions": [
      {
        "action": "add|remove|replace",
        "card_name": "Lightning Bolt",
        "replace_with": "Shock",
        "reason": "...",
        "priority": "high|medium|low"
      }
    ],
    "strategic_recommendations": ["...", "..."]
  },
  "tokens_remaining": 98
}
```

### GET /api/ai/deck-stats/{deck_id}

Ottieni statistiche dettagliate del mazzo.

**Query Parameters:**
- `user_id`: ID dell'utente (required)

**Response:**
```json
{
  "deck_id": 123,
  "deck_name": "My Deck",
  "format": "standard",
  "colors": "R,G",
  "archetype": "aggro",
  "stats": {
    "total_cards": 60,
    "unique_cards": 45,
    "mana_curve": { ... },
    "color_distribution": { ... },
    "type_distribution": { ... },
    "rarity_distribution": { ... },
    "average_cmc": 2.5
  }
}
```

## Frontend Usage

Il componente `AIBuilder` è accessibile dalla navigazione principale:

```jsx
import AIBuilder from './components/AIBuilder'

<AIBuilder
  user={user}
  onBack={() => setCurrentView('main')}
  language={language}
/>
```

## Fallback Behavior

Se Groq non è configurato o non disponibile, il sistema fornisce automaticamente suggerimenti base usando euristiche:

- Analisi curva di mana
- Controllo dimensione mazzo
- Verifica proporzione terre
- Suggerimenti basati su archetipo

## Costi Groq

**Modello utilizzato:** `llama-3.1-70b-versatile`

**Costo per analisi:** **$0.00 (GRATIS!)** 🎉

**Rate Limits (Gratuiti):**
- 30 richieste/minuto
- 14,400 richieste/giorno
- Più che sufficiente per qualsiasi uso normale

**Vantaggi:**
- ✅ Completamente gratuito (nessuna carta richiesta)
- ✅ Velocissimo (10x più veloce di OpenAI)
- ✅ Ottima qualità (Llama 3.1 70B è eccellente)
- ✅ Generoso rate limit
- ✅ Con 2 token utente = €0.02, margine 100%

**Ottimizzazioni:**
- Temperature: 0.7 (bilanciamento creatività/coerenza)
- Max tokens: 2000 (sufficiente per analisi dettagliate)
- JSON response format (parsing affidabile)

## Sicurezza

- ✅ Verifica ownership del mazzo prima dell'analisi
- ✅ Consumo token prima dell'elaborazione
- ✅ Validazione input utente
- ✅ Rate limiting via sistema token
- ✅ Gestione errori con fallback

## Testing

### Test Locale

```bash
# Avvia backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# In un altro terminale, testa l'endpoint
curl -X POST http://localhost:8000/api/ai/optimize-deck \
  -H "Content-Type: application/json" \
  -d '{
    "deck_id": 1,
    "user_id": 1,
    "optimization_goal": "balanced"
  }'
```

### Test Frontend

1. Crea un mazzo salvato
2. Vai su "AI Builder" nella navigazione
3. Seleziona il mazzo
4. Scegli obiettivo di ottimizzazione
5. Clicca "Analizza Mazzo (2 🪙)"

## Troubleshooting

### "OpenAI library not installed"
```bash
pip install openai
```
(Necessaria per compatibilità con Groq)

### "Groq API key not configured"
1. Registrati su https://console.groq.com (gratis)
2. Crea una API key
3. Aggiungi `GROQ_API_KEY=gsk_...` al file `.env`

### "Insufficient tokens"
L'utente deve acquistare più token dal Token Shop (2 token per analisi)

### Analisi troppo lenta
- Groq è velocissimo (1-2 secondi di solito)
- Verifica connessione internet
- Controlla status Groq: https://status.groq.com/

## Future Enhancements

- [ ] Cache risultati analisi per 24h
- [ ] Supporto per analisi multi-mazzo (confronto)
- [ ] Suggerimenti basati su meta attuale
- [ ] Integrazione con prezzi carte per budget optimization
- [ ] Export suggerimenti in PDF
- [ ] Analisi sideboard
- [ ] Simulazione matchup vs archetipi popolari

## Monitoring

Traccia utilizzo AI nel database:

```sql
SELECT 
  action,
  COUNT(*) as count,
  SUM(ABS(amount)) as total_tokens
FROM token_transactions
WHERE action = 'ai_optimization'
GROUP BY action;
```

## Support

Per problemi o domande:
- Backend: `backend/app/routers/ai_builder.py`
- Frontend: `magic-deck-generator/src/components/AIBuilder.jsx`
- API Docs: http://localhost:8000/docs (quando backend è attivo)
