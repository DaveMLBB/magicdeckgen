"""
Scryfall Weekly Sync Service
Scarica il bulk data "default_cards" di Scryfall e fa upsert nella tabella mtg_cards.
- default_cards: una stampa per carta (la più recente/rilevante), tutte le lingue EN
- Aggiorna prezzi, immagini, legalità, tutti i campi
- Inserisce nuove carte non ancora presenti
"""

import os, json, logging, requests, tempfile
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import MTGCard

logger = logging.getLogger(__name__)

SCRYFALL_BULK_API = "https://api.scryfall.com/bulk-data/default-cards"
BATCH_SIZE = 500

SKIP_LAYOUTS = {"token", "art_series", "emblem", "double_faced_token", "reversible_card"}


def _get_bulk_url() -> str:
    resp = requests.get(SCRYFALL_BULK_API, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    url = data["download_uri"]
    logger.info(f"Scryfall bulk URL: {url}  updated_at={data.get('updated_at')}")
    return url


def _download(url: str) -> str:
    logger.info("Download bulk Scryfall...")
    with requests.get(url, stream=True, timeout=300) as r:
        r.raise_for_status()
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".json", mode="wb")
        total = 0
        for chunk in r.iter_content(chunk_size=512 * 1024):
            tmp.write(chunk)
            total += len(chunk)
        tmp.close()
    logger.info(f"Download OK: {total/1024/1024:.1f} MB -> {tmp.name}")
    return tmp.name


def _f(v):
    """Converte stringa in float o None."""
    try:
        return float(v) if v else None
    except (TypeError, ValueError):
        return None


def _join(lst):
    """Lista -> stringa CSV o None."""
    if not lst:
        return None
    return ",".join(str(x) for x in lst)


def _img(raw: dict) -> dict:
    """Estrae tutti gli URL immagine, gestendo double-faced."""
    uris = raw.get("image_uris") or {}
    if not uris and raw.get("card_faces"):
        uris = raw["card_faces"][0].get("image_uris") or {}
    return {
        "image_url":           uris.get("normal"),
        "image_url_small":     uris.get("small"),
        "image_url_large":     uris.get("large"),
        "image_url_art_crop":  uris.get("art_crop"),
        "image_url_border_crop": uris.get("border_crop"),
    }


def _types(type_line: str):
    """Estrae types, subtypes, supertypes dalla type_line."""
    if not type_line:
        return None, None, None
    SUPERS = {"Legendary", "Basic", "Snow", "World", "Ongoing"}
    main, _, sub = type_line.partition("—")
    words = main.strip().split()
    supertypes = [w for w in words if w in SUPERS]
    types      = [w for w in words if w not in SUPERS]
    subtypes   = sub.strip().split() if sub.strip() else []
    return (
        ",".join(types) or None,
        ",".join(subtypes) or None,
        ",".join(supertypes) or None,
    )


def _map(raw: dict) -> dict:
    """Mappa un oggetto carta Scryfall -> dict colonne MTGCard."""
    prices   = raw.get("prices") or {}
    imgs     = _img(raw)
    types, subtypes, supertypes = _types(raw.get("type_line", ""))

    return {
        # Identificatori
        "uuid":           raw["id"],
        "scryfall_id":    raw["id"],
        "oracle_id":      raw.get("oracle_id"),
        # Nomi
        "name":           raw.get("name", ""),
        "name_it":        None,   # popolato da sync lingue separate
        "lang":           raw.get("lang", "en"),
        # Mana
        "mana_cost":      raw.get("mana_cost"),
        "mana_value":     raw.get("cmc"),
        # Colori
        "colors":         _join(raw.get("colors")),
        "color_identity": _join(raw.get("color_identity")),
        # Tipo
        "type_line":      raw.get("type_line"),
        "types":          types,
        "subtypes":       subtypes,
        "supertypes":     supertypes,
        # Testo
        "text":           raw.get("oracle_text"),
        # Stats
        "power":          raw.get("power"),
        "toughness":      raw.get("toughness"),
        "loyalty":        raw.get("loyalty"),
        # Set
        "set_code":       raw.get("set"),
        "set_name":       raw.get("set_name"),
        "collector_number": raw.get("collector_number"),
        "rarity":         raw.get("rarity"),
        "released_at":    raw.get("released_at"),
        # Flags
        "promo":          raw.get("promo"),
        "reprint":        raw.get("reprint"),
        # Keywords
        "keywords":       _join(raw.get("keywords")),
        # Immagini
        **imgs,
        # Legalità
        "legalities":     json.dumps(raw.get("legalities")) if raw.get("legalities") else None,
        # Prezzi
        "price_usd":          _f(prices.get("usd")),
        "price_usd_foil":     _f(prices.get("usd_foil")),
        "price_eur":          _f(prices.get("eur")),
        "price_eur_foil":     _f(prices.get("eur_foil")),
        # Sync
        "last_synced_at":     datetime.now(timezone.utc),
    }


# Campi che vengono aggiornati ad ogni sync (prezzi + immagini + legalità)
UPDATE_FIELDS = [
    "price_usd", "price_usd_foil",
    "price_eur", "price_eur_foil",
    "image_url", "image_url_small", "image_url_large",
    "image_url_art_crop", "image_url_border_crop",
    "legalities", "keywords", "text", "type_line",
    "types", "subtypes", "supertypes",
    "set_name", "released_at", "reprint", "promo",
    "last_synced_at",
]


def run_sync(db: Session | None = None, limit: int | None = None) -> dict:
    """
    Esegue il sync completo. limit=N per test (importa solo N carte).
    """
    close_db = db is None
    if db is None:
        db = SessionLocal()

    stats = {"inserted": 0, "updated": 0, "skipped": 0, "errors": 0}
    tmp_path = None

    try:
        url = _get_bulk_url()
        tmp_path = _download(url)

        logger.info("Import nel DB...")
        with open(tmp_path, "r", encoding="utf-8") as f:
            cards = json.load(f)

        logger.info(f"Carte nel bulk: {len(cards)}")
        if limit:
            cards = cards[:limit]
            logger.info(f"Limitato a {limit} carte per test")

        batch = []
        for raw in cards:
            if raw.get("layout") in SKIP_LAYOUTS or raw.get("digital"):
                stats["skipped"] += 1
                continue
            try:
                batch.append(_map(raw))
            except Exception as e:
                logger.warning(f"Errore parsing {raw.get('name','?')}: {e}")
                stats["errors"] += 1
                continue

            if len(batch) >= BATCH_SIZE:
                _upsert(db, batch, stats)
                batch = []
                logger.info(f"  ...{stats['inserted']} inserite, {stats['updated']} aggiornate")

        if batch:
            _upsert(db, batch, stats)

        db.commit()
        stats["total_in_db"] = db.query(MTGCard).count()
        logger.info(f"Sync completato: {stats}")

    except Exception as e:
        logger.error(f"Sync fallito: {e}")
        db.rollback()
        raise
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        if close_db:
            db.close()

    return stats


def _upsert(db: Session, batch: list[dict], stats: dict):
    for data in batch:
        existing = db.query(MTGCard).filter(MTGCard.uuid == data["uuid"]).first()
        if existing:
            for f in UPDATE_FIELDS:
                setattr(existing, f, data.get(f))
            stats["updated"] += 1
        else:
            db.add(MTGCard(**data))
            stats["inserted"] += 1
    db.flush()
