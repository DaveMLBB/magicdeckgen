#!/usr/bin/env python3
"""
Script per eseguire il sync settimanale Scryfall.
Scarica il bulk data completo e aggiorna la tabella mtg_cards.

Uso manuale:
    python run_scryfall_sync.py

Uso cron (ogni domenica alle 3:00 AM):
    0 3 * * 0 cd /path/to/backend && /path/to/venv/bin/python run_scryfall_sync.py >> logs/scryfall_sync.log 2>&1
"""
import sys
import os
from pathlib import Path
from datetime import datetime

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Setup logging
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    logger.info("=" * 80)
    logger.info("🔄 Scryfall Weekly Sync - START")
    logger.info("=" * 80)
    
    try:
        from app.services.scryfall_sync import run_sync
        
        # Run full sync (no limit)
        stats = run_sync()
        
        logger.info("=" * 80)
        logger.info("✅ Sync completato con successo!")
        logger.info(f"   Carte inserite: {stats['inserted']:,}")
        logger.info(f"   Carte aggiornate: {stats['updated']:,}")
        logger.info(f"   Carte saltate: {stats['skipped']:,}")
        logger.info(f"   Errori: {stats['errors']:,}")
        logger.info(f"   Totale in DB: {stats['total_in_db']:,}")
        logger.info("=" * 80)
        
        return 0
        
    except Exception as e:
        logger.error("=" * 80)
        logger.error(f"❌ Sync fallito: {e}")
        logger.error("=" * 80)
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
