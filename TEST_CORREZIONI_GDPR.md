# 🧪 Test Correzioni GDPR

## ✅ Problemi Risolti

1. ✅ Link "Informativa Privacy" nel cookie banner ora funziona
2. ✅ Checkbox accettazione policy nel form di registrazione
3. ✅ Registrazione accettazione policy nel database

---

## 🎯 Test da Eseguire

### Test 1: Cookie Banner → Privacy Policy

**Passi**:
1. Apri browser in modalità incognito
2. Vai su http://localhost:5174/
3. Vedi il cookie banner in basso
4. Clicca su "Informativa Privacy" (link in basso nel banner)

**Risultato Atteso**:
✅ Si apre la pagina Privacy Policy nell'app (NON torna alla home)
✅ Vedi il contenuto completo della Privacy Policy
✅ Puoi tornare indietro con il pulsante "← Indietro"

**Risultato Precedente**:
❌ Tornava alla home page

---

### Test 2: Form Registrazione - Checkbox Policy

**Passi**:
1. Vai su http://localhost:5174/
2. Clicca su "Registrati" (o "🚀 Inizia Gratis")
3. Clicca su "Non hai un account? Registrati"
4. Inserisci email: `test-gdpr@example.com`
5. Inserisci password: `test123`
6. **NON spuntare** la checkbox
7. Clicca su "Registrati"

**Risultato Atteso**:
✅ Vedi messaggio di errore: "Devi accettare i Termini di Servizio e la Privacy Policy per registrarti"
✅ La registrazione NON procede

**Risultato Precedente**:
❌ Mancava completamente la checkbox

---

### Test 3: Link Privacy Policy nel Form

**Passi**:
1. Nel form di registrazione
2. Trova la checkbox con il testo: "Accetto i Termini di Servizio e la Privacy Policy"
3. Clicca sul link "Privacy Policy" (blu, sottolineato)

**Risultato Atteso**:
✅ Si apre un modale (overlay scuro) con la Privacy Policy
✅ Vedi il contenuto completo in un iframe
✅ Puoi chiudere cliccando sulla X o fuori dal modale
✅ Torni al form di registrazione

---

### Test 4: Link Terms of Service nel Form

**Passi**:
1. Nel form di registrazione
2. Clicca sul link "Termini di Servizio" (blu, sottolineato)

**Risultato Atteso**:
✅ Si apre un modale con i Terms of Service
✅ Vedi il contenuto completo
✅ Puoi chiudere e tornare al form

---

### Test 5: Registrazione Completa con Policy

**Passi**:
1. Nel form di registrazione
2. Inserisci email: `test-gdpr-ok@example.com`
3. Inserisci password: `test123`
4. **Spunta la checkbox** "Accetto i Termini..."
5. Clicca su "Registrati"

**Risultato Atteso**:
✅ Registrazione completata con successo
✅ Messaggio: "Registrazione completata! Controlla la tua email..."
✅ Nel database vengono creati:
   - Record utente con `privacy_policy_version = "1.0"` e `terms_version = "1.0"`
   - 2 record in `policy_acceptances` (uno per Privacy, uno per Terms)

---

### Test 6: Verifica Database (Backend)

**Passi**:
```bash
cd backend
python3 << 'EOF'
from app.database import SessionLocal
from app.models import User, PolicyAcceptance

db = SessionLocal()

# Trova l'utente appena registrato
user = db.query(User).filter(User.email == "test-gdpr-ok@example.com").first()

if user:
    print(f"✅ Utente trovato: {user.email}")
    print(f"   Privacy Policy Version: {user.privacy_policy_version}")
    print(f"   Terms Version: {user.terms_version}")
    
    # Trova le accettazioni policy
    acceptances = db.query(PolicyAcceptance).filter(
        PolicyAcceptance.user_id == user.id
    ).all()
    
    print(f"\n✅ Policy Acceptances: {len(acceptances)}")
    for acc in acceptances:
        print(f"   - {acc.policy_type} v{acc.policy_version}")
        print(f"     Accepted at: {acc.accepted_at}")
else:
    print("❌ Utente non trovato")

db.close()
EOF
```

**Risultato Atteso**:
```
✅ Utente trovato: test-gdpr-ok@example.com
   Privacy Policy Version: 1.0
   Terms Version: 1.0

✅ Policy Acceptances: 2
   - privacy_policy v1.0
     Accepted at: 2026-02-09 12:34:56
   - terms_of_service v1.0
     Accepted at: 2026-02-09 12:34:56
```

---

### Test 7: Footer Links (Verifica che funzionino ancora)

**Passi**:
1. Fai login nell'app
2. Scorri in fondo alla pagina
3. Clicca su "Privacy" nel footer

**Risultato Atteso**:
✅ Si apre la pagina Privacy Policy nell'app
✅ NON torna alla home

**Passi**:
1. Clicca su "Termini" nel footer

**Risultato Atteso**:
✅ Si apre la pagina Terms of Service nell'app

**Passi**:
1. Clicca su "Cookie" nel footer

**Risultato Atteso**:
✅ Si apre la pagina Cookie Settings

---

## 📸 Screenshot Attesi

### 1. Cookie Banner con Link Privacy
```
┌─────────────────────────────────────────────────────────┐
│  🍪 Gestione Cookie                                     │
│  Utilizziamo i cookie per migliorare la tua esperienza  │
│                                                          │
│  [Personalizza] [Solo Essenziali] [Accetta Tutti]      │
│                                                          │
│  Informativa Privacy  ← QUESTO LINK ORA FUNZIONA!      │
└─────────────────────────────────────────────────────────┘
```

### 2. Form Registrazione con Checkbox
```
┌─────────────────────────────────────────────────────────┐
│  Email: [test@example.com                            ]  │
│  Password: [••••••••                                 ]  │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ ☑ Accetto i Termini di Servizio e la          │    │
│  │   Privacy Policy                                │    │
│  │   ↑↑↑ NUOVA CHECKBOX OBBLIGATORIA ↑↑↑         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [Registrati]                                           │
└─────────────────────────────────────────────────────────┘
```

### 3. Modale Privacy Policy
```
┌═════════════════════════════════════════════════════════┐
║ 🔒 Privacy Policy                              [✕]     ║
╠═════════════════════════════════════════════════════════╣
║                                                         ║
║  [Contenuto Privacy Policy in iframe]                  ║
║                                                         ║
║  1. Introduzione                                        ║
║  Magic Deck Builder rispetta la tua privacy...         ║
║                                                         ║
║  2. Dati che Raccogliamo                               ║
║  ...                                                    ║
║                                                         ║
└═════════════════════════════════════════════════════════┘
```

---

## ✅ Checklist Completa

- [ ] Cookie banner mostra link "Informativa Privacy"
- [ ] Cliccando su "Informativa Privacy" si apre la pagina (non torna home)
- [ ] Form registrazione mostra checkbox policy
- [ ] Checkbox è obbligatoria (errore se non spuntata)
- [ ] Link "Privacy Policy" apre modale
- [ ] Link "Termini di Servizio" apre modale
- [ ] Modali mostrano contenuto completo
- [ ] Modali si chiudono con X o click fuori
- [ ] Registrazione con checkbox spuntata funziona
- [ ] Database registra accettazione policy (2 record)
- [ ] User ha `privacy_policy_version` e `terms_version` impostati
- [ ] Footer links funzionano ancora correttamente

---

## 🚨 Se Qualcosa Non Funziona

### Problema: Cookie banner non appare
**Soluzione**: Cancella localStorage
```javascript
// Console browser (F12)
localStorage.removeItem('cookieConsent')
// Ricarica pagina (F5)
```

### Problema: Modali non si aprono
**Verifica**: Console browser per errori
```javascript
// F12 → Console
// Cerca errori in rosso
```

### Problema: Checkbox non appare
**Verifica**: Sei nella schermata di registrazione (non login)
- Clicca su "Non hai un account? Registrati"

### Problema: Database non registra policy
**Verifica**: Backend in esecuzione
```bash
cd backend
python run.py
# Dovrebbe mostrare: Uvicorn running on http://0.0.0.0:8000
```

---

## 📊 Riepilogo Modifiche

### File Modificati
1. `magic-deck-generator/src/components/CookieConsentBanner.jsx`
   - Aggiunto prop `onPrivacyClick`
   - Link Privacy ora chiama callback

2. `magic-deck-generator/src/App.jsx`
   - Passato callback `onPrivacyClick` al banner
   - Callback imposta `currentView` a `'privacy-policy'`

3. `magic-deck-generator/src/components/Auth.jsx`
   - Aggiunti stati per checkbox e modali
   - Aggiunta checkbox obbligatoria nel form registrazione
   - Aggiunti link per aprire Privacy e Terms
   - Aggiunti modali per visualizzare documenti
   - Validazione: errore se checkbox non spuntata

4. `magic-deck-generator/src/components/Auth.css`
   - Stili per checkbox policy
   - Stili per modali overlay
   - Animazioni fade-in e slide-up

5. `backend/app/routers/auth.py`
   - Import `PolicyAcceptance`
   - Registrazione automatica accettazione policy
   - Creazione 2 record in `policy_acceptances`
   - Impostazione versioni policy nell'utente

### File Creati
1. `magic-deck-generator/public/privacy.html`
   - Pagina HTML standalone per Privacy Policy
   - Carica contenuto da backend API
   - Fallback con contenuto completo

2. `magic-deck-generator/public/terms.html`
   - Pagina HTML standalone per Terms of Service
   - Carica contenuto da backend API
   - Fallback con contenuto completo

---

**Tutto pronto per il test! 🚀**

Apri http://localhost:5174/ e segui i test sopra.
