"""
Script cron per inviare email di onboarding agli utenti.
Invia email giorno 3 e giorno 7 dopo la registrazione.

Uso: python send_onboarding_emails.py
Cron suggerito: 0 10 * * * /path/to/venv/bin/python /var/www/magicdeckgen/backend/send_onboarding_emails.py

Logica:
- Giorno 3: utenti registrati 3 giorni fa, non hanno ancora usato il sito (tokens >= 95)
- Giorno 7: utenti registrati 7 giorni fa, non hanno ancora usato il sito (tokens >= 90)
"""
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, '/var/www/magicdeckgen/backend')

from dotenv import load_dotenv
load_dotenv('/var/www/magicdeckgen/backend/.env')

from app.database import SessionLocal
from app.models import User
from app.email import send_onboarding_day3_email, send_onboarding_day7_email


def send_day3_emails(db):
    """Invia email giorno 3 agli utenti inattivi registrati 3 giorni fa"""
    now = datetime.utcnow()
    day3_start = now - timedelta(days=3, hours=1)
    day3_end = now - timedelta(days=2, hours=23)

    users = db.query(User).filter(
        User.created_at >= day3_start,
        User.created_at <= day3_end,
        User.tokens >= 95,  # non hanno quasi usato nulla
        User.is_active == True
    ).all()

    print(f"📧 Giorno 3: trovati {len(users)} utenti da contattare")
    sent = 0
    for user in users:
        if send_onboarding_day3_email(user.email):
            sent += 1
    print(f"✅ Giorno 3: inviate {sent}/{len(users)} email")
    return sent


def send_day7_emails(db):
    """Invia email giorno 7 agli utenti inattivi registrati 7 giorni fa"""
    now = datetime.utcnow()
    day7_start = now - timedelta(days=7, hours=1)
    day7_end = now - timedelta(days=6, hours=23)

    users = db.query(User).filter(
        User.created_at >= day7_start,
        User.created_at <= day7_end,
        User.tokens >= 90,  # non hanno quasi usato nulla
        User.is_active == True
    ).all()

    print(f"📧 Giorno 7: trovati {len(users)} utenti da contattare")
    sent = 0
    for user in users:
        if send_onboarding_day7_email(user.email):
            sent += 1
    print(f"✅ Giorno 7: inviate {sent}/{len(users)} email")
    return sent


if __name__ == "__main__":
    print(f"🕐 Avvio onboarding email — {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
    db = SessionLocal()
    try:
        send_day3_emails(db)
        send_day7_emails(db)
    finally:
        db.close()
    print("✅ Done")
