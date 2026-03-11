"""
Scheduler per task periodici (APScheduler).
Avviato all'avvio dell'app FastAPI via lifespan.
"""

import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


def _sync_scryfall_job():
    """Job sincrono wrappato per APScheduler."""
    from app.services.scryfall_sync import run_sync
    logger.info("⏰ Avvio sync settimanale Scryfall...")
    try:
        stats = run_sync()
        logger.info(f"✅ Sync Scryfall completato: {stats}")
    except Exception as e:
        logger.error(f"❌ Sync Scryfall fallito: {e}")


def start_scheduler():
    """Registra i job e avvia lo scheduler."""
    # Ogni domenica alle 03:00 UTC
    scheduler.add_job(
        _sync_scryfall_job,
        trigger=CronTrigger(day_of_week="sun", hour=3, minute=0, timezone="UTC"),
        id="scryfall_weekly_sync",
        replace_existing=True,
        misfire_grace_time=3600,  # tolleranza 1h se il server era down
    )
    scheduler.start()
    logger.info("✅ Scheduler avviato — sync Scryfall ogni domenica alle 03:00 UTC")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler fermato")
