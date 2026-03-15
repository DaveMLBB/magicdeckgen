"""
Sistema di free-trial per utenti anonimi.

Logica:
- Ogni servizio AI ha un limite di utilizzi gratuiti per utenti non autenticati.
- I limiti sono tracciati per IP (hashato) e browser_id (hashato), con reset mensile.
- Gli utenti autenticati (user_id presente) bypassano completamente questo sistema.
- I contatori vivono in Redis con TTL calcolato fino alla fine del mese corrente.

Chiavi Redis:
  anon:trial:{YYYY-MM}:ip:{sha256(ip)}:{service}   → contatore int
  anon:trial:{YYYY-MM}:bid:{sha256(browser_id)}:{service} → contatore int

Privacy:
- IP e browser_id vengono hashati con SHA-256 prima dello storage.
- Nessun dato in chiaro viene salvato in Redis.
- TTL automatico garantisce il reset mensile senza intervento manuale.
"""

import hashlib
import calendar
from datetime import datetime, timezone
from typing import Optional

from fastapi import Request, HTTPException
from app.redis_client import get_redis

# ── Configurazione limiti per servizio ──────────────────────────────────────
# Modifica qui per aggiungere/cambiare limiti senza toccare gli endpoint.
ANONYMOUS_TRIAL_LIMITS: dict[str, int] = {
    "deck_ai":          2,   # AI Deck Builder (build-deck)
    "deck_ai_full":     2,   # AI Deck Builder full collection
    "synergy_ai":       2,   # AI Synergy Finder
    "twins_ai":         2,   # AI Card Twins (Gemelli)
    "analyzer_ai":      2,   # AI Deck Analyzer (optimization)
    "boost_ai":         2,   # AI Deck Boost (chat) — utenti registrati
    "boost_ai_anon":    1,   # AI Deck Boost — utenti anonimi (1/mese)
    "chat_build_ai":    2,   # AI Chat Build
    "tournament_deck":  5,   # Tournament Deck Builder (confronta mazzi)
    "scanner_ai":       3,   # Scanner Carte AI
}

REDIS_KEY_PREFIX = "anon:trial"


def _hash(value: str) -> str:
    """SHA-256 hash troncato a 16 byte hex (128 bit). Sufficiente per unicità, minimizza storage."""
    return hashlib.sha256(value.encode()).hexdigest()[:32]


def _month_key() -> str:
    """Restituisce la chiave del mese corrente: YYYY-MM"""
    return datetime.now(timezone.utc).strftime("%Y-%m")


def _seconds_until_end_of_month() -> int:
    """Calcola i secondi rimanenti fino alla mezzanotte UTC del primo giorno del mese successivo."""
    now = datetime.now(timezone.utc)
    last_day = calendar.monthrange(now.year, now.month)[1]
    end_of_month = datetime(now.year, now.month, last_day, 23, 59, 59, tzinfo=timezone.utc)
    remaining = int((end_of_month - now).total_seconds()) + 1
    return max(remaining, 1)


def _extract_ip(request: Request) -> str:
    """
    Estrae l'IP reale del client.

    Sicurezza: X-Forwarded-For è spoofable se il reverse proxy non è configurato
    per sovrascriverlo. In produzione, assicurati che il tuo nginx/caddy/traefik
    imposti X-Forwarded-For in modo affidabile e che TRUSTED_PROXY_IPS sia configurato.

    Se non sei dietro un proxy fidato, usa solo request.client.host.
    """
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Prendi il primo IP della catena (il client originale)
        ip = forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    return ip


def _build_redis_key(dimension: str, identifier_hash: str, service: str) -> str:
    """
    Costruisce la chiave Redis.
    Formato: anon:trial:{YYYY-MM}:{dimension}:{hash}:{service}
    Esempio: anon:trial:2026-03:ip:a3f9...:{service}
    """
    month = _month_key()
    return f"{REDIS_KEY_PREFIX}:{month}:{dimension}:{identifier_hash}:{service}"


def check_and_increment_trial(
    service: str,
    ip: str,
    browser_id: Optional[str],
) -> None:
    """
    Controlla se l'utente anonimo ha ancora trial disponibili per il servizio.
    Se sì, incrementa i contatori. Se no, solleva HTTPException 429.

    Strategia: controlla ENTRAMBI ip e browser_id se disponibili.
    Basta che UNO dei due abbia raggiunto il limite per bloccare la richiesta.
    Questo rende più difficile aggirare il limite cambiando solo uno dei due.
    """
    limit = ANONYMOUS_TRIAL_LIMITS.get(service)
    if limit is None:
        # Servizio non configurato → non limitare (fail open per sicurezza del servizio)
        return

    r = get_redis()
    ttl = _seconds_until_end_of_month()

    ip_hash = _hash(ip)
    ip_key = _build_redis_key("ip", ip_hash, service)

    bid_hash = _hash(browser_id) if browser_id else None
    bid_key = _build_redis_key("bid", bid_hash, service) if bid_hash else None

    # Leggi i contatori attuali
    ip_count = int(r.get(ip_key) or 0)
    bid_count = int(r.get(bid_key) or 0) if bid_key else 0

    # Controlla se il limite è raggiunto
    if ip_count >= limit or bid_count >= limit:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "anonymous_trial_limit_reached",
                "service": service,
                "limit": limit,
                "message_it": (
                    f"Hai raggiunto il limite della prova gratuita per questo servizio "
                    f"({limit} utilizzi al mese). Registrati per continuare senza limiti."
                ),
                "message_en": (
                    f"You have reached the free trial limit for this service "
                    f"({limit} uses per month). Sign up to continue without limits."
                ),
            }
        )

    # Incrementa i contatori con pipeline atomica
    pipe = r.pipeline()
    pipe.incr(ip_key)
    pipe.expire(ip_key, ttl)
    if bid_key:
        pipe.incr(bid_key)
        pipe.expire(bid_key, ttl)
    pipe.execute()


def get_trial_status(service: str, ip: str, browser_id: Optional[str]) -> dict:
    """
    Restituisce lo stato del trial per un servizio (utile per il frontend).
    Non modifica i contatori.
    """
    limit = ANONYMOUS_TRIAL_LIMITS.get(service, 0)
    r = get_redis()

    ip_hash = _hash(ip)
    ip_key = _build_redis_key("ip", ip_hash, service)
    ip_count = int(r.get(ip_key) or 0)

    bid_count = 0
    if browser_id:
        bid_hash = _hash(browser_id)
        bid_key = _build_redis_key("bid", bid_hash, service)
        bid_count = int(r.get(bid_key) or 0)

    used = max(ip_count, bid_count)
    remaining = max(0, limit - used)

    return {
        "service": service,
        "limit": limit,
        "used": used,
        "remaining": remaining,
        "exhausted": remaining == 0,
    }
