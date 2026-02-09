# 🎯 Dove Trovare le Funzionalità GDPR

## ⚠️ PROBLEMA: "Non vedo nulla sul frontend"

**SOLUZIONE**: Le funzionalità GDPR ci sono tutte! Ecco dove trovarle:

---

## 1. 🍪 COOKIE BANNER

### Dove appare?
**In basso nella pagina, al primo accesso**

### Perché non lo vedo?
✅ **Hai già dato il consenso!** Il banner appare solo:
- Al primo accesso
- Se il consenso è scaduto (dopo 12 mesi)
- Se cancelli il localStorage

### Come vederlo di nuovo?
```javascript
// Apri la Console del Browser (F12) e digita:
localStorage.removeItem('cookieConsent')
// Poi ricarica la pagina (F5)
```

### Oppure:
1. Apri il browser in **modalità incognito** (Ctrl+Shift+N / Cmd+Shift+N)
2. Vai su `http://localhost:5174/`
3. **VEDRAI IL BANNER** in basso!

---

## 2. 🔒 PRIVACY SETTINGS

### Dove si trova?
**Nell'HEADER, dopo aver fatto login**

```
┌─────────────────────────────────────────────────────────┐
│  🇮🇹 IT  🇬🇧 EN    user@email.com  [📚 Collezione]     │
│                    [🔍 Cerca Carte]  [🃏 Mazzi Salvati] │
│                    [💎 Uploads]  [🔒 Privacy]  [🚪 Esci]│
└─────────────────────────────────────────────────────────┘
                                      ↑↑↑↑↑↑↑↑↑
                                   CLICCA QUI!
```

### Cosa contiene?
- ✅ Gestione preferenze cookie
- ✅ Esportazione dati (JSON)
- ✅ Richiesta cancellazione account
- ✅ Preferenze email marketing

---

## 3. 📄 PRIVACY POLICY & TERMS

### Dove si trovano?
**Nel FOOTER, in fondo alla pagina**

```
┌─────────────────────────────────────────────────────────┐
│                    [Contenuto pagina]                    │
│                                                          │
│                    ↓ Scorri in basso ↓                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│              Magic Deck Builder © 2026                   │
│         [Privacy] • [Termini] • [Cookie]                │
│            ↑↑↑↑↑↑↑   ↑↑↑↑↑↑↑↑   ↑↑↑↑↑↑                  │
│         CLICCA QUI PER VEDERE LE POLICY                 │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 🍪 COOKIE SETTINGS

### Dove si trova?
**Nel FOOTER → Link "Cookie"**

### Cosa fa?
- Mostra tutte le categorie di cookie
- Permette di modificare le preferenze
- Spiega cosa fa ogni tipo di cookie

---

## 5. 📧 EMAIL PREFERENCES

### Dove si trova?
**Privacy Settings → Sezione Email**

### Cosa fa?
- Opt-in/opt-out email marketing
- Gestione comunicazioni

---

## 🧪 TEST RAPIDO

### Apri questo file nel browser:
```
TEST_GDPR_FRONTEND.html
```

Questo file HTML ti permette di:
- ✅ Verificare lo stato del consenso cookie
- ✅ Cancellare il consenso per vedere il banner
- ✅ Testare il backend GDPR
- ✅ Vedere tutti i componenti implementati

---

## 📸 SCREENSHOT DELLE POSIZIONI

### 1. Cookie Banner (primo accesso)
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                    [Contenuto App]                       │
│                                                          │
├══════════════════════════════════════════════════════════┤
│  🍪 Gestione Cookie                                     │
│  Utilizziamo i cookie per migliorare la tua esperienza  │
│                                                          │
│  [Personalizza] [Solo Essenziali] [Accetta Tutti]      │
└─────────────────────────────────────────────────────────┘
```

### 2. Header con Privacy Button
```
┌─────────────────────────────────────────────────────────┐
│  🇮🇹 IT  🇬🇧 EN                                         │
│                                                          │
│  user@email.com  ⚠️ Non verificato                      │
│  [📚 Collezione] [🔍 Cerca Carte] [🃏 Mazzi Salvati]   │
│  [💎 5 uploads] [🔒 Privacy] [🚪 Esci]                 │
│                      ↑↑↑↑↑↑↑↑↑↑↑↑                       │
└─────────────────────────────────────────────────────────┘
```

### 3. Privacy Settings Panel
```
┌─────────────────────────────────────────────────────────┐
│  🔒 Impostazioni Privacy                                │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🍪 Preferenze Cookie                            │   │
│  │ [✓] Essenziali  [✓] Analytics  [ ] Marketing   │   │
│  │ [Aggiorna Preferenze]                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📥 Esporta Dati                                 │   │
│  │ [Scarica i Tuoi Dati]                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🗑️ Elimina Account                              │   │
│  │ [Richiedi Cancellazione]                        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 4. Footer Links
```
┌─────────────────────────────────────────────────────────┐
│              Magic Deck Builder © 2026                   │
│                                                          │
│         [Privacy] • [Termini] • [Cookie]                │
│            ↑          ↑           ↑                      │
│         Clicca    Clicca      Clicca                    │
│          qui       qui         qui                       │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST VERIFICA

Segui questi passi per verificare che tutto funzioni:

### Passo 1: Cookie Banner
- [ ] Apri browser in modalità incognito
- [ ] Vai su http://localhost:5174/
- [ ] Vedi il banner cookie in basso? ✅

### Passo 2: Privacy Button
- [ ] Fai login nell'app
- [ ] Guarda l'header in alto
- [ ] Vedi il pulsante "🔒 Privacy"? ✅

### Passo 3: Privacy Settings
- [ ] Clicca su "🔒 Privacy"
- [ ] Vedi il pannello con le impostazioni? ✅
- [ ] Vedi i pulsanti per esportare/eliminare? ✅

### Passo 4: Footer
- [ ] Scorri in fondo alla pagina
- [ ] Vedi i link Privacy/Termini/Cookie? ✅
- [ ] Cliccando si aprono le pagine? ✅

---

## 🚨 SE NON VEDI ANCORA NULLA

### 1. Verifica che il dev server sia avviato
```bash
cd magic-deck-generator
npm run dev
```
Dovrebbe mostrare: `Local: http://localhost:5174/`

### 2. Verifica che il backend sia avviato
```bash
cd backend
python run.py
```
Dovrebbe mostrare: `Uvicorn running on http://0.0.0.0:8000`

### 3. Cancella la cache del browser
- Chrome/Edge: Ctrl+Shift+Delete
- Firefox: Ctrl+Shift+Delete
- Safari: Cmd+Option+E

### 4. Controlla la console del browser
- Premi F12
- Vai su "Console"
- Ci sono errori in rosso? Segnalali!

---

## 📞 SUPPORTO

Se dopo aver seguito questa guida NON vedi ancora le funzionalità GDPR:

1. Apri `TEST_GDPR_FRONTEND.html` nel browser
2. Fai screenshot di cosa vedi
3. Controlla la console del browser (F12) per errori
4. Verifica che entrambi i server (frontend + backend) siano avviati

---

**Ricorda**: Il cookie banner appare SOLO se non hai già dato il consenso!
Se l'hai già dato, è normale che non lo vedi. Usa la modalità incognito per testarlo.
