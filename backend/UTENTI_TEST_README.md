# 🧪 Utenti di Test - Guida Rapida

## 📋 Utenti Disponibili

### 1️⃣ Utente Free (test@example.com)
```bash
cd backend
source venv/bin/activate
python3 create_test_user.py
```
- **Password**: `test123`
- **Limiti**: 3 caricamenti, 5 collezioni, 20 carte uniche per collezione
- **Ideale per**: Testare limitazioni piano gratuito

### 2️⃣ Utente Premium (premium@example.com)
```bash
cd backend
source venv/bin/activate
python3 create_premium_test_user.py
```
- **Password**: `premium123`
- **Limiti**: 10 caricamenti/mese, 10 collezioni, carte illimitate
- **Scadenza**: 30 giorni dalla creazione
- **Ideale per**: Testare piano mensile base

### 3️⃣ Utente Lifetime (lifetime@example.com) ⭐
```bash
cd backend
source venv/bin/activate
python3 create_lifetime_test_user.py
```
- **Password**: `lifetime123`
- **Limiti**: NESSUNO - tutto illimitato
- **Scadenza**: Mai (per sempre)
- **Ideale per**: Testare tutte le funzionalità senza restrizioni

## 🚀 Quick Start

### Creare tutti gli utenti
```bash
cd backend
source venv/bin/activate
python3 create_test_user.py
python3 create_premium_test_user.py
python3 create_lifetime_test_user.py
```

### Reset completo database
```bash
cd backend
source venv/bin/activate
python3 recreate_db.py
python3 create_test_user.py
python3 create_premium_test_user.py
python3 create_lifetime_test_user.py
```

## 📊 Confronto Piani

| Caratteristica | Free | Premium | Lifetime ⭐ |
|----------------|------|---------|------------|
| Email | test@example.com | premium@example.com | lifetime@example.com |
| Password | test123 | premium123 | lifetime123 |
| Caricamenti | 3 | 10/mese | ∞ |
| Collezioni | 5 | 10 | ∞ |
| Carte/Collezione | 20 | ∞ | ∞ |
| Ricerche Mazzi | 10 | ∞ | ∞ |
| Scadenza | - | 30 giorni | Mai |

## 💡 Suggerimenti

- **Sviluppo**: Usa `lifetime@example.com` per testare senza limitazioni
- **Test Limiti**: Usa `test@example.com` per verificare le restrizioni
- **Test Scadenza**: Usa `premium@example.com` per testare la gestione abbonamenti

## ⚠️ Note Importanti

1. Gli utenti sono già verificati (`is_verified=True`)
2. Se un utente esiste già, viene eliminato e ricreato
3. Il piano Premium scade dopo 30 giorni e torna automaticamente a Free
4. Il piano Lifetime non scade mai
5. Tutti gli script usano il database in `backend/data/magic.db`

## 🔧 Troubleshooting

### Errore "ModuleNotFoundError"
```bash
# Assicurati di attivare l'ambiente virtuale
cd backend
source venv/bin/activate
```

### Database non trovato
```bash
# Ricrea il database
cd backend
source venv/bin/activate
python3 recreate_db.py
```

### Utente già esistente
Gli script eliminano automaticamente l'utente esistente e lo ricreano.
