"""
Script one-shot: invia email di aggiornamento a tutti gli utenti verificati.
Esegui con: python send_newsletter.py
"""
import os, sys, time
import requests

# Carica .env manualmente senza dipendenze esterne
_env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(_env_path):
    with open(_env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
FROM_EMAIL    = os.getenv("FROM_EMAIL", "noreply@magicdeckbuilder.app")
FROM_NAME     = os.getenv("FROM_NAME", "Magic Deck Builder")
FRONTEND_URL  = os.getenv("FRONTEND_URL", "https://magicdeckbuilder.app")

if not BREVO_API_KEY or BREVO_API_KEY == "your-brevo-api-key-here":
    print("❌ BREVO_API_KEY non configurata nel .env")
    sys.exit(1)

# ── Carica utenti dal DB ──────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))
from app.database import SessionLocal
from app.models import User

db = SessionLocal()
users = db.query(User).filter(
    User.email.isnot(None),
    User.marketing_emails_enabled == True,
).all()
db.close()

print(f"📋 Utenti verificati trovati: {len(users)}")
if not users:
    print("Nessun utente da contattare.")
    sys.exit(0)

# ── Template email ────────────────────────────────────────────────────────────
SUBJECT = "🚀 Magic Deck Builder è pronto — aggiornamento importante"

HTML_BODY = """
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Magic Deck Builder — Aggiornamento</title>
</head>
<body style="margin:0;padding:0;background:#0f0c29;font-family:system-ui,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0c29;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e1b4b,#2d2a5e);border-radius:16px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                🃏 Magic Deck Builder
              </h1>
              <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">
                Il tuo strumento per costruire mazzi MTG
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <h2 style="margin:0 0 16px;font-size:22px;color:#a78bfa;">
                🚀 L'app è pronta — e continua a crescere
              </h2>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#cbd5e1;">
                Ciao! Volevamo aggiornarti su una notizia importante:
                <strong style="color:#e2e8f0;">Magic Deck Builder è stato aggiornato</strong>
                ed è ora pronto per un utilizzo reale, stabile e completo.
              </p>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#cbd5e1;">
                Abbiamo lavorato duramente per migliorare le performance, la stabilità
                e l'esperienza generale. Puoi già usare tutte le funzionalità principali
                con fiducia.
              </p>

              <!-- Beta notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#c4b5fd;">
                      🧪 Alcune feature sono ancora in beta
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#a5b4fc;">
                      Alcune funzionalità avanzate — come il Card Scanner e l'AI Builder —
                      sono ancora in fase di test. Grazie ai tuoi feedback riusciremo a
                      perfezionarle in fretta. Ogni segnalazione è preziosa!
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#cbd5e1;">
                Il progetto è in <strong style="color:#e2e8f0;">costante sviluppo</strong>:
                nuove funzionalità, miglioramenti e sorprese arrivano di giorno in giorno.
                Resta connesso — non vorrai perderti le novità.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 24px;">
                <tr>
                  <td align="center">
                    <a href="{frontend_url}"
                       style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                      Vai all'app →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;text-align:center;">
                Grazie per far parte di questa avventura. 🙏<br>
                <strong style="color:#94a3b8;">Il team di Magic Deck Builder</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:rgba(0,0,0,0.3);padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
                Hai ricevuto questa email perché sei registrato su Magic Deck Builder.<br>
                <a href="{frontend_url}" style="color:#6366f1;text-decoration:none;">magicdeckbuilder.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
""".replace("{frontend_url}", FRONTEND_URL)

TEXT_BODY = """Ciao!

Magic Deck Builder è stato aggiornato ed è ora pronto per un utilizzo reale.

Alcune funzionalità avanzate (Card Scanner, AI Builder) sono ancora in fase beta — i tuoi feedback ci aiuteranno a perfezionarle in fretta.

Il progetto è in costante sviluppo: nuove funzionalità arrivano di giorno in giorno.

Vai all'app: {frontend_url}

Grazie per far parte di questa avventura.
Il team di Magic Deck Builder
""".replace("{frontend_url}", FRONTEND_URL)

# ── Invio ─────────────────────────────────────────────────────────────────────
headers = {
    "accept": "application/json",
    "api-key": BREVO_API_KEY,
    "content-type": "application/json"
}

sent = 0
failed = 0

for user in users:
    payload = {
        "sender": {"name": FROM_NAME, "email": FROM_EMAIL},
        "to": [{"email": user.email, "name": user.email}],
        "subject": SUBJECT,
        "htmlContent": HTML_BODY,
        "textContent": TEXT_BODY,
    }
    try:
        res = requests.post(BREVO_API_URL, json=payload, headers=headers, timeout=10)
        if res.status_code in (200, 201):
            print(f"  ✅ {user.email}")
            sent += 1
        else:
            print(f"  ❌ {user.email} — {res.status_code}: {res.text[:100]}")
            failed += 1
    except Exception as e:
        print(f"  ❌ {user.email} — errore: {e}")
        failed += 1

    time.sleep(0.1)  # rate limit Brevo: max ~10 req/s

print(f"\n📊 Risultato: {sent} inviate, {failed} fallite su {len(users)} utenti")
