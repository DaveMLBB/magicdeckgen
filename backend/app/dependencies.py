"""
FastAPI dependencies riutilizzabili.

Uso negli endpoint AI:

    @router.post("/build-deck")
    async def build_deck(
        input_data: BuildDeckInput,
        request: Request,
        _trial: None = Depends(anonymous_trial_guard("deck_ai")),
        db: Session = Depends(get_db),
    ):
        # Se user_id è presente → utente autenticato → trial bypassato
        # Se user_id è assente → utente anonimo → trial controllato
        ...
"""

from typing import Optional, Callable
import json as _json
from fastapi import Depends, Request
from app.anonymous_trial import check_and_increment_trial, _extract_ip


def anonymous_trial_guard(service: str) -> Callable:
    """
    Factory che restituisce una dependency FastAPI per il controllo del trial anonimo.

    Bypassa il controllo se nella request body è presente un user_id valido (> 0).
    Questo funziona perché tutti i tuoi endpoint AI ricevono user_id nel body.

    Parametri:
        service: nome del servizio (deve essere in ANONYMOUS_TRIAL_LIMITS)

    Uso:
        Depends(anonymous_trial_guard("deck_ai"))
    """
    async def _guard(request: Request) -> None:
        # Leggi il body raw (Starlette lo bufferizza, non viene consumato).
        # Usiamo request.body() invece di request.json() per evitare
        # problemi di double-read in alcune versioni di FastAPI.
        try:
            raw = await request.body()
            body = _json.loads(raw) if raw else {}
            user_id = body.get("user_id")
            if user_id and int(user_id) > 0:
                # Utente autenticato → nessun limite anonimo
                return
        except Exception:
            # Body non parsabile o assente → tratta come anonimo
            pass

        ip = _extract_ip(request)
        browser_id: Optional[str] = request.headers.get("X-Browser-Id")

        check_and_increment_trial(service, ip, browser_id)

    return _guard
