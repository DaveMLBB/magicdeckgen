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


def send_deletion_confirmation_email(to_email: str, cancellation_token: str, scheduled_for) -> bool:
    """Invia email di conferma cancellazione account con link per annullare"""
    
    cancellation_link = f"{FRONTEND_URL}/cancel-deletion?token={cancellation_token}"
    scheduled_date = scheduled_for.strftime("%d/%m/%Y %H:%M UTC")
    
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
        "subject": "Conferma Cancellazione Account - Magic Deck Builder",
        "htmlContent": f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .warning {{ background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }}
                .button {{ display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ Cancellazione Account</h1>
                </div>
                <div class="content">
                    <h2>Richiesta di Cancellazione Account</h2>
                    <p>Hai richiesto la cancellazione del tuo account Magic Deck Builder.</p>
                    
                    <div class="warning">
                        <strong>⚠️ ATTENZIONE:</strong> Il tuo account e tutti i dati associati saranno eliminati permanentemente il <strong>{scheduled_date}</strong>.
                    </div>
                    
                    <p>Verranno eliminati:</p>
                    <ul>
                        <li>Il tuo account utente</li>
                        <li>Tutti i mazzi salvati</li>
                        <li>Tutte le collezioni di carte</li>
                        <li>Tutti i consensi e preferenze</li>
                        <li>Tutti i token di autenticazione</li>
                    </ul>
                    
                    <p><strong>Hai cambiato idea?</strong></p>
                    <p>Puoi annullare questa richiesta entro 7 giorni cliccando sul pulsante qui sotto:</p>
                    
                    <div style="text-align: center;">
                        <a href="{cancellation_link}" class="button">Annulla Cancellazione</a>
                    </div>
                    
                    <p>Oppure copia e incolla questo link nel tuo browser:</p>
                    <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px; font-size: 12px;">
                        {cancellation_link}
                    </p>
                    
                    <p style="margin-top: 30px; color: #666; font-size: 14px;">
                        Se non hai richiesto questa cancellazione, clicca immediatamente sul link di annullamento e cambia la tua password.
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
        print(f"✅ Email conferma cancellazione inviata a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Errore invio email a {to_email}: {e}")
        print(f"🔗 Link annullamento (dev): {cancellation_link}")
        return False


def send_deletion_complete_email(to_email: str) -> bool:
    """Invia email di conferma finale dopo la cancellazione dell'account"""
    
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
        "subject": "Account Cancellato - Magic Deck Builder",
        "htmlContent": """
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>👋 Arrivederci</h1>
                </div>
                <div class="content">
                    <h2>Account Cancellato</h2>
                    <p>Il tuo account Magic Deck Builder è stato cancellato con successo.</p>
                    <p>Tutti i tuoi dati personali sono stati eliminati permanentemente dai nostri sistemi in conformità con il GDPR.</p>
                    <p>Ci dispiace vederti andare. Se in futuro vorrai tornare, saremo felici di accoglierti di nuovo!</p>
                    <p style="margin-top: 30px; color: #666; font-size: 14px;">
                        Grazie per aver utilizzato Magic Deck Builder.
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
        print(f"✅ Email conferma cancellazione finale inviata a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Errore invio email a {to_email}: {e}")
        return False


def send_inactive_warning_email(to_email: str, last_login) -> bool:
    """Invia email di avviso per account inattivo da 3 anni"""
    
    last_login_date = last_login.strftime("%d/%m/%Y") if last_login else "mai"
    
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
        "subject": "Il tuo account sarà cancellato - Magic Deck Builder",
        "htmlContent": f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }}
                .button {{ display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ Account Inattivo</h1>
                </div>
                <div class="content">
                    <h2>Il tuo account Magic Deck Builder è inattivo</h2>
                    <p>Abbiamo notato che non accedi al tuo account da molto tempo (ultimo accesso: <strong>{last_login_date}</strong>).</p>
                    
                    <div class="warning">
                        <strong>⚠️ ATTENZIONE:</strong> In conformità con le nostre politiche di conservazione dei dati GDPR, il tuo account verrà automaticamente cancellato tra <strong>30 giorni</strong> se non effettui l'accesso.
                    </div>
                    
                    <p><strong>Vuoi mantenere il tuo account?</strong></p>
                    <p>È semplice! Basta effettuare l'accesso al tuo account entro i prossimi 30 giorni:</p>
                    
                    <div style="text-align: center;">
                        <a href="{FRONTEND_URL}/login" class="button">Accedi Ora</a>
                    </div>
                    
                    <p>Se non desideri più utilizzare Magic Deck Builder, non è necessario fare nulla. Il tuo account e tutti i dati associati verranno eliminati automaticamente.</p>
                    
                    <p style="margin-top: 30px; color: #666; font-size: 14px;">
                        Questa è una misura di sicurezza per proteggere i tuoi dati personali in conformità con il GDPR.
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
        print(f"✅ Email avviso inattività inviata a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Errore invio email a {to_email}: {e}")
        return False
