# Esempio Pratico di Utilizzo

## Scenario: Costruire un Mazzo Modern

### Passo 1: Preparazione Collezione

**Hai una collezione di carte Magic e vuoi sapere quali mazzi competitivi puoi costruire.**

1. Esporta la tua collezione da un'app (es. Delver Lens, TCGPlayer)
2. Ottieni un file CSV o Excel con almeno:
   - Nome carta
   - Quantità posseduta

Esempio file `my_collection.csv`:
```csv
Nome,Quantità
Lightning Bolt,4
Counterspell,4
Snapcaster Mage,2
Scalding Tarn,4
Steam Vents,4
...
```

---

### Passo 2: Carica la Collezione

1. Vai su http://localhost:5173 (o il tuo URL)
2. Effettua login
3. Clicca "📁 Carica Collezione (Excel/CSV)"
4. Seleziona il file
5. Mappa le colonne:
   - Nome Carta → "Nome"
   - Quantità → "Quantità"
6. Clicca "✓ Conferma e Carica"

**Risultato**: "✓ 250 carte caricate"

---

### Passo 3: Cerca Mazzi Compatibili

1. Seleziona filtri:
   - **Formato**: Modern
   - **Colori**: U, R (Blu, Rosso)
   - **Completamento minimo**: 70%

2. Clicca "🔍 Trova Mazzi Compatibili"

**Risultato**: Lista di mazzi ordinati per compatibilità

```
🔵🔴 Izzet Control    [MODERN]
━━━━━━━━━━━━━━━━━━━━━━━━━━━
85% completo
✅ 51/60 carte
❌ Mancano 9

🔵🔴 UR Murktide      [MODERN]
━━━━━━━━━━━━━━━━━━━━━━━━━━━
78% completo
✅ 47/60 carte
❌ Mancano 13

🔵🔴 Izzet Prowess    [MODERN]
━━━━━━━━━━━━━━━━━━━━━━━━━━━
72% completo
✅ 43/60 carte
❌ Mancano 17
```

---

### Passo 4: Analizza un Mazzo

Clicca su "Izzet Control" per vedere i dettagli:

```
┌─────────────────────────────────────────────────────────┐
│ Izzet Control              [📥 Importa in Collezione]   │
├─────────────────────────────────────────────────────────┤
│ Formato: Modern                                         │
│ Match: 85%                                              │
│ Carte possedute: 51/60                                  │
│ ✅ Puoi costruire questo mazzo!                         │
└─────────────────────────────────────────────────────────┘

Lista Completa (60 carte uniche)

✅ 4x Lightning Bolt          Instant
✅ 4x Counterspell            Instant
✅ 2x Snapcaster Mage         Creature
❌ 2x Murktide Regent         Creature    (-2)
✅ 4x Scalding Tarn           Land
❌ 1x Otawara, Soaring City   Land        (-1)
...
```

---

### Passo 5: Importa il Mazzo

1. Clicca "📥 Importa in Collezione"
2. Attendi il messaggio: "✅ Mazzo importato con successo! 'Izzet Control' (60 carte)"
3. Vieni reindirizzato alla lista collezioni

---

### Passo 6: Gestisci la Collezione

Vai su "📚 Collezione" nell'header:

```
Le Mie Collezioni

┌─────────────────────────────────────┐
│ Izzet Control                       │
│ Imported from Modern deck           │
│ 60 carte uniche | 60 carte totali   │
│ Creata: 8 Feb 2026                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ My Main Collection                  │
│ La mia collezione principale        │
│ 250 carte uniche | 450 carte totali │
│ Creata: 1 Feb 2026                  │
└─────────────────────────────────────┘
```

---

### Passo 7: Usa la Collezione per Altre Ricerche

1. Torna alla schermata principale
2. Invece di caricare un file, clicca "📚 Carica Collezione Esistente"
3. Seleziona "Izzet Control"
4. Cerca altri mazzi compatibili con questo deck

**Utilità**: Scopri varianti o mazzi simili che puoi costruire con le stesse carte!

---

## Scenario 2: Completare un Mazzo

### Obiettivo: Capire quali carte ti mancano per completare un mazzo

1. **Cerca mazzi** con filtro "Solo mazzi costruibili (≥90%)"
2. **Trova un mazzo** al 92% di completamento
3. **Guarda le carte mancanti**:

```
Carte Mancanti (5 carte)

❌ 2x Murktide Regent
❌ 1x Otawara, Soaring City
❌ 1x Subtlety
❌ 1x Spell Pierce
```

4. **Acquista le carte mancanti**
5. **Aggiorna la collezione** caricando un nuovo file
6. **Verifica** che il mazzo sia ora al 100%

---

## Scenario 3: Costruire una Wishlist

### Obiettivo: Creare una collezione "wishlist" con le carte che vuoi

1. **Cerca un mazzo** che ti piace ma non puoi costruire (es. 45% match)
2. **Importa il mazzo** come collezione
3. **Rinomina la collezione** in "Wishlist - Izzet Control"
4. **Usa questa collezione** come riferimento per acquisti futuri

---

## Scenario 4: Gestire Più Formati

### Obiettivo: Avere collezioni separate per formato

1. **Importa mazzi** da formati diversi:
   - "Modern - Izzet Control"
   - "Legacy - Dragon Stompy"
   - "Pauper - Mono Blue Delver"
   - "Commander - Atraxa"

2. **Organizza** le tue collezioni per formato
3. **Cerca mazzi** specifici per ogni formato

---

## Scenario 5: Condividere con Amici

### Obiettivo: Mostrare a un amico quali mazzi puoi costruire

1. **Esporta la collezione** (funzionalità futura)
2. **Condividi il link** al mazzo importato
3. **L'amico può vedere** le carte e il match percentage

---

## Tips & Tricks

### 🎯 Massimizza i Match
- Usa filtri colori per restringere la ricerca
- Imposta "Completamento minimo" a 80% per mazzi quasi completi
- Seleziona un formato specifico per risultati più veloci

### 📊 Analizza le Statistiche
- Guarda quali formati hai più carte per
- Identifica pattern nelle carte mancanti
- Pianifica acquisti basati su più mazzi

### 🔄 Aggiorna Regolarmente
- Carica nuovi file quando acquisti carte
- Mantieni le collezioni aggiornate
- Elimina collezioni vecchie per liberare spazio

### 💡 Usa le Collezioni Strategicamente
- Collezione principale: Tutte le tue carte
- Collezioni mazzi: Mazzi specifici che vuoi costruire
- Collezioni wishlist: Carte che vuoi acquistare

---

## Limiti e Piani

### Piano Free (Gratuito)
- ✅ 3 caricamenti file
- ✅ 10 ricerche mazzi
- ✅ 5 collezioni
- ✅ Tutti i formati

### Piano Monthly 10 (€10/mese)
- ✅ 10 caricamenti file
- ✅ 50 ricerche mazzi
- ✅ 10 collezioni
- ✅ Supporto prioritario

### Piano Monthly 30 (€30/mese)
- ✅ 30 caricamenti file
- ✅ 200 ricerche mazzi
- ✅ 50 collezioni
- ✅ Supporto prioritario

### Piano Yearly (€100/anno)
- ✅ Caricamenti illimitati
- ✅ Ricerche illimitate
- ✅ Collezioni illimitate
- ✅ Supporto prioritario

### Piano Lifetime (€300 una tantum)
- ✅ Tutto illimitato per sempre
- ✅ Accesso anticipato a nuove funzionalità
- ✅ Supporto VIP

---

## FAQ

**Q: Posso importare lo stesso mazzo più volte?**  
A: Sì, il sistema aggiunge automaticamente un numero (es. "Izzet Control (1)")

**Q: Le collezioni importate contano nel limite?**  
A: Sì, ogni collezione importata conta nel limite del tuo piano

**Q: Posso modificare una collezione importata?**  
A: Sì, puoi aggiungere/rimuovere carte come qualsiasi altra collezione

**Q: Cosa succede se elimino una collezione importata?**  
A: Viene eliminata definitivamente con tutte le sue carte

**Q: Posso esportare una collezione?**  
A: Funzionalità in arrivo! Per ora puoi visualizzare e copiare manualmente

---

## Supporto

Hai problemi o domande? Usa il pulsante "🐛 Report Bug" nell'app!
