"""
Endpoint pubblici per il sistema di free-trial anonimo.
"""
from fastapi import APIRouter, Request
from app.anonymous_trial import get_trial_status, ANONYMOUS_TRIAL_LIMITS, _extract_ip

router = APIRouter()


@router.get("/status")
def get_all_trial_status(request: Request):
    """
    Restituisce lo stato del trial per tutti i servizi per l'utente corrente.
    Usato dal frontend per mostrare quanti utilizzi rimangono prima della registrazione.
    """
    ip = _extract_ip(request)
    browser_id = request.headers.get("X-Browser-Id")

    statuses = {
        service: get_trial_status(service, ip, browser_id)
        for service in ANONYMOUS_TRIAL_LIMITS
    }
    return {"trials": statuses}


@router.get("/status/{service}")
def get_service_trial_status(service: str, request: Request):
    """Stato del trial per un singolo servizio."""
    ip = _extract_ip(request)
    browser_id = request.headers.get("X-Browser-Id")
    return get_trial_status(service, ip, browser_id)
