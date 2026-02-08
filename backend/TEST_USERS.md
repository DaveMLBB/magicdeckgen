# Utenti di Test

## Utenti Disponibili

### 1. Utente Free
- **Email**: `test@example.com`
- **Password**: `test123`
- **Piano**: Free
- **Caricamenti**: 0/3
- **Scadenza**: Nessuna
- **Script**: `python3 create_test_user.py`

### 2. Utente Premium (Monthly 10)
- **Email**: `premium@example.com`
- **Password**: `premium123`
- **Piano**: Monthly 10
- **Caricamenti**: 0/10
- **Scadenza**: 30 giorni dalla creazione
- **Script**: `python3 create_premium_test_user.py`

## Come Creare Utenti di Test

### Utente Free
```bash
cd backend
source venv/bin/activate
python3 create_test_user.py
```

### Utente Premium
```bash
cd backend
source venv/bin/activate
python3 create_premium_test_user.py
```

## Ricreare Database
Se hai bisogno di ricreare completamente il database:

```bash
cd backend
source venv/bin/activate
python3 recreate_db.py
python3 create_test_user.py
python3 create_premium_test_user.py
```

## Piani Disponibili

| Piano | Caricamenti | Collezioni | Carte per Collezione | Prezzo | Durata |
|-------|-------------|------------|---------------------|--------|--------|
| Free | 3 | 5 | 20 uniche | €0 | - |
| Monthly 10 | 10/mese | 10 | Illimitate | €5 | 30 giorni |
| Monthly 30 | 30/mese | 50 | Illimitate | €10 | 30 giorni |
| Yearly | Illimitati | Illimitate | Illimitate | €25 | 365 giorni |
| Lifetime | Illimitati | Illimitate | Illimitate | €60 | Per sempre |

## Note

- Gli utenti vengono creati con `is_verified=True` per facilitare i test
- L'utente premium ha una scadenza di 30 giorni dalla creazione
- Il sistema controlla automaticamente le scadenze ad ogni login/upload
- Quando un abbonamento scade, l'utente viene automaticamente riportato al piano Free con contatore reset
