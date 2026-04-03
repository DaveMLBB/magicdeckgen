# Scryfall Sync - Setup e Manutenzione

## Stato Attuale

⚠️ **Il sync settimanale Scryfall NON è configurato automaticamente.**

Il servizio di sync esiste (`app/services/scryfall_sync.py`) ma deve essere eseguito manualmente o tramite cron job.

## Setup Sync Settimanale

### 1. Esecuzione Manuale

```bash
cd /Users/dave/progetti/magicdeckgen/backend
source venv/bin/activate
python run_scryfall_sync.py
```

### 2. Setup Cron Job (Raccomandato)

Aggiungi al crontab per eseguire ogni domenica alle 3:00 AM:

```bash
crontab -e
```

Aggiungi questa riga:
```
0 3 * * 0 cd /Users/dave/progetti/magicdeckgen/backend && /Users/dave/progetti/magicdeckgen/backend/venv/bin/python /Users/dave/progetti/magicdeckgen/backend/run_scryfall_sync.py >> /Users/dave/progetti/magicdeckgen/backend/logs/scryfall_sync.log 2>&1
```

### 3. Creare Directory Logs

```bash
mkdir -p /Users/dave/progetti/magicdeckgen/backend/logs
```

## Cosa Fa il Sync

1. Scarica il bulk data "default_cards" da Scryfall (~500MB JSON)
2. Importa/aggiorna tutte le carte nella tabella `mtg_cards`
3. Aggiorna prezzi, immagini, legalità, keywords
4. Inserisce nuove carte non ancora presenti
5. Salta token, emblemi, carte digitali

## Monitoraggio

Controlla i log:
```bash
tail -f /Users/dave/progetti/magicdeckgen/backend/logs/scryfall_sync.log
```

Verifica ultima sincronizzazione:
```sql
SELECT COUNT(*) as total_cards, 
       MAX(last_synced_at) as last_sync 
FROM mtg_cards;
```

## Performance

- Tempo medio: 10-15 minuti
- Carte processate: ~80,000
- Spazio disco: ~500MB temporaneo + ~2GB database

## Troubleshooting

Se il sync fallisce:
1. Verifica connessione internet
2. Controlla spazio disco disponibile
3. Verifica permessi scrittura su database
4. Controlla logs per errori specifici
