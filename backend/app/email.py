import os
import requests
from typing import Optional

# Configurazione Brevo
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "your-brevo-api-key-here")
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@magicdeckbuilder.app")
FROM_NAME = os.getenv("FROM_NAME", "Magic Deck Builder")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

def send_verification_email(to_email: str, verification_token: str) -> bool:
    """Invia email di verifica tramite Brevo"""
    
    verification_link = f"{FRONTEND_URL}/verify?token={verification_token}"
    
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    
    payload = {
        "sender": {
            "name": FROM_NAME,
            "email": FROM_EMAIL
        },
        "to": [
            {
                "email": to_email,
                "name": to_email.split('@')[0]
            }
        ],
        "subject": "Verifica il tuo account - Magic Deck Builder",
        "htmlContent": f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🃏 Magic Deck Builder</h1>
                </div>
                <div class="content">
                    <h2>Benvenuto!</h2>
                    <p>Grazie per esserti registrato a Magic Deck Builder.</p>
                    <p>Per completare la registrazione e iniziare a costruire i tuoi mazzi, clicca sul pulsante qui sotto per verificare il tuo indirizzo email:</p>
                    <div style="text-align: center;">
                        <a href="{verification_link}" class="button">Verifica Email</a>
                    </div>
                    <p>Oppure copia e incolla questo link nel tuo browser:</p>
                    <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px; font-size: 12px;">
                        {verification_link}
                    </p>
                    <p style="margin-top: 30px; color: #666; font-size: 14px;">
                        Se non hai richiesto questa registrazione, puoi ignorare questa email.
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
        print(f"✅ Email di verifica inviata a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Errore invio email a {to_email}: {e}")
        # In sviluppo, stampa il link
        print(f"🔗 Link di verifica (dev): {verification_link}")
        return False

def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    """Invia email per reset password tramite Brevo"""
    
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    
    payload = {
        "sender": {
            "name": FROM_NAME,
            "email": FROM_EMAIL
        },
        "to": [
            {
                "email": to_email,
                "name": to_email.split('@')[0]
            }
        ],
        "subject": "Reset Password - Magic Deck Builder",
        "htmlContent": f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🃏 Magic Deck Builder</h1>
                </div>
                <div class="content">
                    <h2>Reset Password</h2>
                    <p>Hai richiesto di reimpostare la tua password.</p>
                    <p>Clicca sul pulsante qui sotto per creare una nuova password:</p>
                    <div style="text-align: center;">
                        <a href="{reset_link}" class="button">Reset Password</a>
                    </div>
                    <p>Oppure copia e incolla questo link nel tuo browser:</p>
                    <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px; font-size: 12px;">
                        {reset_link}
                    </p>
                    <p style="margin-top: 30px; color: #666; font-size: 14px;">
                        Se non hai richiesto questo reset, puoi ignorare questa email. La tua password rimarrà invariata.
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
        print(f"✅ Email reset password inviata a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Errore invio email a {to_email}: {e}")
        print(f"🔗 Link reset (dev): {reset_link}")
        return False
