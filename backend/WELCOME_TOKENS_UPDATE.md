# Aggiornamento Bonus di Benvenuto: 100 Token Gratuiti

## 🎁 Modifiche Implementate

### 1. Nuovi Utenti (Registrazione)
- **Prima:** 10 token gratuiti
- **Dopo:** **100 token gratuiti** 🎉

### 2. File Modificati

#### `app/models.py`
```python
# Token system
tokens = Column(Integer, default=100)  # Era: default=10
```

#### `app/routers/auth.py`
Aggiunto al processo di registrazione:
```python
# Regala 100 token di benvenuto al nuovo utente
new_user.tokens = 100
welcome_transaction = TokenTransaction(
    user_id=new_user.id,
    amount=100,
    action='welcome_bonus',
    description='🎉 Bonus di benvenuto - 100 token gratuiti!'
)
```

## 📋 Deployment in Produzione

### Passo 1: Aggiorna il Codice
```bash
cd /home/workstation/progetti/magicdeckgen/backend
git add .
git commit -m "feat: aumenta bonus benvenuto a 100 token"
git push
```

### Passo 2: Riavvia il Backend
```bash
# Riavvia il servizio backend in produzione
sudo systemctl restart magicdeckgen-backend
# oppure
docker-compose restart backend
```

### Passo 3: Aggiorna Utenti Esistenti (Opzionale)
Se vuoi dare 90 token extra agli utenti esistenti che hanno ancora solo 10 token:

```bash
cd /home/workstation/progetti/magicdeckgen/backend
source venv/bin/activate
python scripts/update_welcome_tokens.py
```

**Nota:** Lo script aggiorna solo gli utenti che:
- Hanno 10 token o meno
- Non hanno mai acquistato token
- Riceveranno abbastanza token per arrivare a 100

## 🧪 Test

### Test Registrazione Nuovo Utente
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Risposta attesa:**
```json
{
  "message": "Registration completed. Check your email to verify your account. You received 100 free tokens!",
  "user_id": 123,
  "welcome_tokens": 100
}
```

### Verifica Token in Database
```sql
SELECT email, tokens FROM users WHERE email = 'test@example.com';
-- Dovrebbe mostrare: tokens = 100

SELECT * FROM token_transactions 
WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com')
AND action = 'welcome_bonus';
-- Dovrebbe mostrare la transazione di benvenuto
```

## 💡 Vantaggi

1. **Più Generoso:** Gli utenti possono testare meglio la piattaforma
2. **Migliore Onboarding:** 100 token permettono di:
   - Caricare ~100 collezioni
   - Fare ~100 ricerche
   - Salvare ~100 mazzi
   - Usare AI Builder ~50 volte (2 token per analisi)
3. **Tracciabilità:** Ogni bonus è registrato in `token_transactions`

## 📊 Impatto

- **Nuovi utenti:** Ricevono automaticamente 100 token
- **Utenti esistenti:** Possono essere aggiornati con lo script (opzionale)
- **Costo:** $0 (i token sono virtuali)
- **Beneficio:** Maggiore engagement e retention

## 🔄 Rollback

Se necessario tornare a 10 token:

1. Modifica `app/models.py`: `tokens = Column(Integer, default=10)`
2. Modifica `app/routers/auth.py`: `new_user.tokens = 10` e `amount=10`
3. Riavvia il backend

**Nota:** Gli utenti già registrati manterranno i loro token attuali.
