# Analisi Performance Frontend

## Problemi Identificati

### 1. **CardSearch - Caricamento Immagini Non Ottimizzato** 🔴 CRITICO
**Problema**: Ogni carta nella griglia crea un componente `CardImage` che:
- Fa una chiamata API a Scryfall per ogni immagine
- Non usa lazy loading efficace
- Carica tutte le 24 carte della pagina contemporaneamente

**Impatto**: 
- 24+ richieste HTTP simultanee
- Blocca il rendering
- Consuma banda inutilmente

**Soluzione**:
- ✅ Implementare Intersection Observer per lazy loading vero
- ✅ Limitare richieste simultanee (max 4-6 alla volta)
- ✅ Usare placeholder più leggeri
- ✅ Preload solo immagini visibili nel viewport

### 2. **App.jsx - useEffect con Dipendenze Problematiche** 🟡 MEDIO
**Problema**: 
```javascript
useEffect(() => {
  // Carica carte mazzi pubblici
}, [selectedDeck, user])
```
- `user` come dipendenza causa re-render inutili
- Manca memoizzazione delle funzioni

**Soluzione**:
- ✅ Usare `useCallback` per funzioni
- ✅ Usare `useMemo` per valori calcolati
- ✅ Ottimizzare dipendenze useEffect

### 3. **CardSearch - Autocomplete Troppo Aggressivo** 🟡 MEDIO
**Problema**:
- Debounce di 300ms potrebbe essere troppo breve
- Fetch suggerimenti anche quando non necessario

**Soluzione**:
- ✅ Aumentare debounce a 500ms
- ✅ Cancellare richieste precedenti (AbortController)

### 4. **Mancanza di React.memo** 🟡 MEDIO
**Problema**: Componenti si ri-renderizzano anche quando props non cambiano

**Componenti da ottimizzare**:
- CardImage
- CardDetailImage
- Card items nelle liste

**Soluzione**:
- ✅ Wrappare con React.memo
- ✅ Usare useCallback per event handlers

### 5. **Bundle Size** 🟢 BASSO
**Da verificare**:
- Dimensione bundle JavaScript
- Code splitting per route
- Tree shaking

## Piano di Ottimizzazione

### Fase 1: Quick Wins (Impatto Alto, Sforzo Basso)
1. ✅ Lazy loading immagini con Intersection Observer
2. ✅ React.memo sui componenti immagine
3. ✅ Aumentare debounce autocomplete
4. ✅ useCallback per event handlers

### Fase 2: Ottimizzazioni Medie (Impatto Medio, Sforzo Medio)
1. ✅ Limitare richieste simultanee immagini
2. ✅ Memoizzare funzioni in App.jsx
3. ✅ Ottimizzare dipendenze useEffect
4. ✅ Virtual scrolling per liste lunghe (opzionale)

### Fase 3: Ottimizzazioni Avanzate (Impatto Basso, Sforzo Alto)
1. Code splitting per route
2. Service Worker per cache immagini
3. Prefetch immagini pagina successiva
4. Web Workers per operazioni pesanti

## Metriche da Monitorare

- **Time to Interactive (TTI)**: Tempo prima che l'app sia interattiva
- **First Contentful Paint (FCP)**: Primo contenuto visibile
- **Largest Contentful Paint (LCP)**: Contenuto principale caricato
- **Network requests**: Numero richieste HTTP
- **Bundle size**: Dimensione JavaScript scaricato

## Strumenti di Analisi

1. Chrome DevTools Performance tab
2. React DevTools Profiler
3. Lighthouse audit
4. Network tab per waterfall requests
