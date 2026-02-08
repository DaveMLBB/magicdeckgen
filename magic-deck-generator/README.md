# Magic Deck Generator

Genera deck di Magic: The Gathering basandosi sulle carte che possiedi.

## Setup

### Backend (Python)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
Backend disponibile su http://localhost:8000

### Frontend (React)
```bash
npm install
npm run dev
```
Frontend disponibile su http://localhost:5173

## Formato file Excel

Il file .xlsx deve avere queste colonne:
| name | mana_cost | type | colors | rarity | quantity |
|------|-----------|------|--------|--------|----------|
| Lightning Bolt | R | instant | R | common | 4 |
| Llanowar Elves | G | creature | G | common | 4 |

Colonne supportate (italiano o inglese):
- name / nome
- mana_cost / costo_mana
- type / tipo
- colors / colori
- rarity / rarita
- quantity / quantita

## API Endpoints

- `POST /api/cards/upload/{user_id}` - Carica carte da Excel
- `GET /api/cards/{user_id}` - Lista carte utente
- `GET /api/decks/generate/{user_id}` - Genera deck possibili
