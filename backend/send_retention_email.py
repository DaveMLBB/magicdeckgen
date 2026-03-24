"""
Script per inviare email di retention agli utenti che vogliono cancellarsi.
Uso: python send_retention_email.py email@esempio.com
"""
import sys
import os
import requests

sys.path.insert(0, '/var/www/magicdeckgen/backend')

from dotenv import load_dotenv
load_dotenv('/var/www/magicdeckgen/backend/.env')

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@magicdeckbuilder.app")
FROM_NAME = os.getenv("FROM_NAME", "Magic Deck Builder")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://mtgdecksbuilder.com")

def send_retention_email(to_email: str) -> bool:
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }

    payload = {
        "sender": {"name": FROM_NAME, "email": FROM_EMAIL},
        "to": [{"email": to_email, "name": to_email.split('@')[0]}],
        "subject": "Ci dispiace vederti andare 👋 — Magic Deck Builder",
        "htmlContent": f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px 35px; border-radius: 0 0 10px 10px; }}
                .highlight {{ background: #eff6ff; border-left: 4px solid #667eea; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
                .warning {{ background: #fef9ec; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
                .button {{ display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #999; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🃏 Magic Deck Builder</h1>
                </div>
                <div class="content">
                    <h2>Ci dispiace vederti andare 👋</h2>

                    <p>Abbiamo ricevuto la tua richiesta di cancellazione account e la rispetteremo.</p>

                    <p>Volevamo però dirti due cose prima che tu vada.</p>

                    <div class="highlight">
                        <strong>🚧 Il sito è ancora in fase beta.</strong><br/>
                        Magic Deck Builder è un progetto giovane e, come tutti i software nuovi, ha ancora dei bug e funzionalità incomplete. Ci stiamo lavorando ogni giorno. Da quando hai effettuato la tua richiesta di cancellazione, abbiamo già risolto diversi problemi segnalati dagli utenti e rilasciato nuovi aggiornamenti.
                    </div>

                    <p>Se in futuro vorrai riprovare, potrai <strong>reiscriverti quando vuoi</strong> — e i tuoi crediti di benvenuto verranno reinseriti.</p>

                    <div class="warning">
                        <strong>⏳ Attenzione: questa offerta non durerà per sempre.</strong><br/>
                        Durante la fase beta, ogni nuovo iscritto riceve <strong>100 token gratuiti</strong> alla registrazione, più eventuali bonus da coupon e codici referral. Dopo la fine della beta, questa offerta non sarà più disponibile. Ti consigliamo di tenere d'occhio gli aggiornamenti — potresti trovare il sito molto migliorato.
                    </div>

                    <p>Puoi seguire gli aggiornamenti delle funzionalità direttamente sul sito o reiscrivendoti quando vuoi:</p>

                    <div style="text-align: center;">
                        <a href="{FRONTEND_URL}" class="button">🔄 Torna su Magic Deck Builder</a>
                    </div>

                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        Grazie per aver fatto parte di questa fase iniziale. Il tuo feedback, anche indiretto, ci aiuta a migliorare.
                    </p>

                    <p style="color: #666; font-size: 14px;">
                        — Il team di Magic Deck Builder
                    </p>
                </div>
                <div class="footer">
                    <p>© 2026 Magic Deck Builder. Tutti i diritti riservati.</p>
                </div>
            </div>
        </body>
        </html>
        """
    }

    try:
        response = requests.post(BREVO_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        print(f"✅ Email di retention inviata a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Errore invio email a {to_email}: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Dettaglio: {e.response.text}")
        return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python send_retention_email.py email@esempio.com")
        sys.exit(1)

    email = sys.argv[1].strip()
    print(f"📧 Invio email di retention a: {email}")
    success = send_retention_email(email)
    sys.exit(0 if success else 1)
