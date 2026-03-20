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
        "subject": "🃏 Conferma la tua email — hai 100 token che ti aspettano",
        "htmlContent": f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .token-box {{ background: #fef9ec; border: 2px solid #f9ca24; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }}
                .token-amount {{ font-size: 42px; font-weight: 800; color: #e67e22; }}
                .token-label {{ font-size: 14px; color: #666; margin-top: 4px; }}
                .button {{ display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                .feature-list {{ background: #fff; border-radius: 8px; padding: 15px 20px; margin: 15px 0; }}
                .feature-list li {{ margin: 6px 0; color: #555; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🃏 Magic Deck Builder</h1>
                    <p style="margin:0; opacity:0.85;">Un solo click per sbloccare tutto</p>
                </div>
                <div class="content">
                    <h2>Ciao! Sei quasi pronto.</h2>
                    <p>Hai creato il tuo account su Magic Deck Builder. Manca solo un passaggio: verificare la tua email.</p>

                    <div class="token-box">
                        <div class="token-amount">🪙 100</div>
                        <div class="token-label">token gratuiti ti aspettano dopo la verifica</div>
                    </div>

                    <p>Con i tuoi 100 token puoi subito:</p>
                    <ul class="feature-list">
                        <li>🔍 Caricare la tua collezione e trovare i mazzi che puoi costruire</li>
                        <li>🏗️ Generare mazzi completi con l'AI (Commander, Modern, Standard...)</li>
                        <li>✨ Scoprire sinergie tra le carte del tuo mazzo</li>
                        <li>🪞 Trovare alternative economiche alle carte costose</li>
                    </ul>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{verification_link}" class="button">✅ Verifica la mia email</a>
                    </div>

                    <p style="font-size: 13px; color: #888;">Oppure copia questo link nel browser:</p>
                    <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px; font-size: 12px; color: #555;">
                        {verification_link}
                    </p>
                    <p style="margin-top: 30px; color: #aaa; font-size: 12px;">
                        Se non hai richiesto questa registrazione, ignora questa email.
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


def send_subscription_activated_email(to_email: str, plan_name: str, expires_at=None) -> bool:
    """Invia email di conferma attivazione abbonamento"""
    
    expiry_text = ""
    if expires_at:
        expiry_date = expires_at.strftime("%d/%m/%Y") if hasattr(expires_at, 'strftime') else str(expires_at)
        expiry_text = f'<p>Il tuo abbonamento è valido fino al <strong>{expiry_date}</strong>.</p>'
    else:
        expiry_text = '<p>Il tuo abbonamento <strong>non ha scadenza</strong>. È tuo per sempre!</p>'
    
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
        "subject": f"Abbonamento Attivato: {plan_name} - Magic Deck Builder",
        "htmlContent": f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .plan-box {{ background: #ecfdf5; border: 2px solid #10b981; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }}
                .plan-name {{ font-size: 24px; font-weight: bold; color: #059669; }}
                .button {{ display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Abbonamento Attivato!</h1>
                </div>
                <div class="content">
                    <h2>Grazie per il tuo acquisto!</h2>
                    <p>Il tuo abbonamento a Magic Deck Builder è stato attivato con successo.</p>
                    
                    <div class="plan-box">
                        <div class="plan-name">{plan_name}</div>
                    </div>
                    
                    {expiry_text}
                    
                    <p>Ora puoi goderti tutte le funzionalità del tuo piano. Buon divertimento con i tuoi mazzi!</p>
                    
                    <div style="text-align: center;">
                        <a href="{FRONTEND_URL}" class="button">Vai a Magic Deck Builder</a>
                    </div>
                    
                    <p style="margin-top: 30px; color: #666; font-size: 14px;">
                        Se hai domande sul tuo abbonamento, non esitare a contattarci.
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
        print(f"✅ Email attivazione abbonamento inviata a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Errore invio email a {to_email}: {e}")
        return False


def send_subscription_renewed_email(to_email: str, plan_name: str, expires_at=None) -> bool:
    """Invia email di conferma rinnovo automatico abbonamento"""
    
    expiry_date = ""
    if expires_at:
        expiry_date = expires_at.strftime("%d/%m/%Y") if hasattr(expires_at, 'strftime') else str(expires_at)
    
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
        "subject": f"Abbonamento Rinnovato: {plan_name} - Magic Deck Builder",
        "htmlContent": f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .renewal-box {{ background: #eff6ff; border: 2px solid #3b82f6; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }}
                .plan-name {{ font-size: 20px; font-weight: bold; color: #2563eb; }}
                .expiry {{ font-size: 14px; color: #64748b; margin-top: 8px; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔄 Abbonamento Rinnovato</h1>
                </div>
                <div class="content">
                    <h2>Il tuo abbonamento è stato rinnovato</h2>
                    <p>Il pagamento per il rinnovo del tuo abbonamento è stato elaborato con successo.</p>
                    
                    <div class="renewal-box">
                        <div class="plan-name">{plan_name}</div>
                        {f'<div class="expiry">Prossima scadenza: {expiry_date}</div>' if expiry_date else ''}
                    </div>
                    
                    <p>I tuoi contatori di utilizzo (caricamenti, ricerche) sono stati resettati. Continua a goderti Magic Deck Builder!</p>
                    
                    <p style="margin-top: 20px; color: #666; font-size: 14px;">
                        Se desideri annullare il rinnovo automatico, puoi farlo dalla sezione Abbonamenti dell'app.
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
        print(f"✅ Email rinnovo abbonamento inviata a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Errore invio email a {to_email}: {e}")
        return False


def send_subscription_cancelled_email(to_email: str, plan_name: str, expires_at=None) -> bool:
    """Invia email di conferma annullamento abbonamento"""
    
    expiry_text = ""
    if expires_at:
        expiry_date = expires_at.strftime("%d/%m/%Y") if hasattr(expires_at, 'strftime') else str(expires_at)
        expiry_text = f'<p>Il tuo abbonamento <strong>{plan_name}</strong> rimarrà attivo fino al <strong>{expiry_date}</strong>. Dopo questa data, il tuo account tornerà al piano gratuito.</p>'
    else:
        expiry_text = f'<p>Il tuo abbonamento <strong>{plan_name}</strong> è stato annullato. Il tuo account è stato riportato al piano gratuito.</p>'
    
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
        "subject": f"Abbonamento Annullato - Magic Deck Builder",
        "htmlContent": f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .info-box {{ background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }}
                .button {{ display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📋 Abbonamento Annullato</h1>
                </div>
                <div class="content">
                    <h2>Il tuo abbonamento è stato annullato</h2>
                    
                    <div class="info-box">
                        {expiry_text}
                    </div>
                    
                    <p>Cosa succede con il piano gratuito:</p>
                    <ul>
                        <li>10 caricamenti</li>
                        <li>5 collezioni</li>
                        <li>3 mazzi salvati</li>
                        <li>20 carte uniche per collezione</li>
                        <li>10 risultati ricerca mazzi</li>
                    </ul>
                    
                    <p><strong>Hai cambiato idea?</strong> Puoi riattivare il tuo abbonamento in qualsiasi momento:</p>
                    
                    <div style="text-align: center;">
                        <a href="{FRONTEND_URL}" class="button">Riattiva Abbonamento</a>
                    </div>
                    
                    <p style="margin-top: 30px; color: #666; font-size: 14px;">
                        I tuoi dati e le tue collezioni rimarranno al sicuro. Solo i limiti di utilizzo cambieranno.
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
        print(f"✅ Email annullamento abbonamento inviata a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Errore invio email a {to_email}: {e}")
        return False


def send_token_purchase_email(to_email: str, package_name: str, tokens_added: int, total_tokens: int) -> bool:
    """Invia email di conferma acquisto token"""
    
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
        "subject": f"Token Acquistati: {package_name} - Magic Deck Builder",
        "htmlContent": f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .token-box {{ background: #ecfdf5; border: 2px solid #10b981; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }}
                .token-amount {{ font-size: 36px; font-weight: bold; color: #059669; }}
                .token-label {{ font-size: 14px; color: #64748b; margin-top: 4px; }}
                .balance {{ font-size: 18px; color: #333; margin-top: 10px; }}
                .button {{ display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Token Acquistati!</h1>
                </div>
                <div class="content">
                    <h2>Grazie per il tuo acquisto!</h2>
                    <p>I tuoi token sono stati accreditati con successo.</p>
                    
                    <div class="token-box">
                        <div class="token-amount">+{tokens_added} token</div>
                        <div class="token-label">Pacchetto {package_name}</div>
                        <div class="balance">Saldo attuale: <strong>{total_tokens} token</strong></div>
                    </div>
                    
                    <p>Ora puoi utilizzare i token per caricare carte, cercare mazzi e molto altro!</p>
                    
                    <div style="text-align: center;">
                        <a href="{FRONTEND_URL}" class="button">Vai a Magic Deck Builder</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; 2026 Magic Deck Builder. Tutti i diritti riservati.</p>
                </div>
            </div>
        </body>
        </html>
        """
    }
    
    try:
        response = requests.post(BREVO_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        print(f"✅ Email acquisto token inviata a {to_email}")
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


def send_onboarding_day1_email(to_email: str) -> bool:
    """Email onboarding giorno 1: guida al primo utilizzo"""
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    payload = {
        "sender": {"name": FROM_NAME, "email": FROM_EMAIL},
        "to": [{"email": to_email, "name": to_email.split('@')[0]}],
        "subject": "🃏 Come usare i tuoi 100 token — inizia da qui",
        "htmlContent": f"""
        <html><head><style>
            body {{ font-family: Arial, sans-serif; line-height: 1.7; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px 35px; border-radius: 0 0 10px 10px; }}
            .step {{ background: #fff; border-radius: 10px; padding: 18px 20px; margin: 14px 0; border-left: 4px solid #667eea; }}
            .step-num {{ font-size: 11px; font-weight: 700; color: #667eea; text-transform: uppercase; letter-spacing: 1px; }}
            .step-title {{ font-size: 16px; font-weight: 700; color: #222; margin: 4px 0; }}
            .step-desc {{ font-size: 14px; color: #666; }}
            .button {{ display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #999; font-size: 12px; }}
        </style></head><body>
        <div class="container">
            <div class="header"><h1>🃏 Magic Deck Builder</h1></div>
            <div class="content">
                <h2>Ciao! Hai 100 token pronti da usare.</h2>
                <p>Ecco il modo più veloce per ottenere valore dal sito in meno di 5 minuti:</p>

                <div class="step">
                    <div class="step-num">Passo 1 — Gratis, nessun token</div>
                    <div class="step-title">🏗️ Genera un mazzo con l'AI</div>
                    <div class="step-desc">Vai su <strong>AI Deck Builder</strong> e scrivi qualcosa come "Commander Atraxa proliferate" o "aggro rosso Modern". L'AI costruisce un mazzo completo in 30 secondi.</div>
                </div>

                <div class="step">
                    <div class="step-num">Passo 2 — 1 token</div>
                    <div class="step-title">🔍 Carica la tua collezione</div>
                    <div class="step-desc">Esporta le tue carte da Delver Lens, TCGPlayer o Dragon Shield come CSV/Excel. Caricale e scopri quali mazzi competitivi puoi già costruire con quello che hai.</div>
                </div>

                <div class="step">
                    <div class="step-num">Passo 3 — 1 token</div>
                    <div class="step-title">✨ Trova sinergie nel tuo mazzo</div>
                    <div class="step-desc">Usa <strong>AI Synergy</strong> per scoprire combinazioni nascoste tra le carte che già possiedi. Spesso si trovano combo che non si conoscevano.</div>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{FRONTEND_URL}" class="button">Inizia ora →</a>
                </div>

                <p style="color: #888; font-size: 13px;">Hai domande? Rispondi a questa email, siamo qui.</p>
            </div>
            <div class="footer"><p>© 2026 Magic Deck Builder. <a href="{FRONTEND_URL}/account" style="color:#999;">Gestisci preferenze email</a></p></div>
        </div>
        </body></html>
        """
    }
    try:
        response = requests.post(BREVO_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        print(f"✅ Email onboarding giorno 1 inviata a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Errore invio email onboarding day1 a {to_email}: {e}")
        return False


def send_onboarding_day3_email(to_email: str) -> bool:
    """Email onboarding giorno 3: focus su AI Deck Builder"""
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    payload = {
        "sender": {"name": FROM_NAME, "email": FROM_EMAIL},
        "to": [{"email": to_email, "name": to_email.split('@')[0]}],
        "subject": "Hai già provato l'AI Deck Builder? Ecco cosa può fare",
        "htmlContent": f"""
        <html><head><style>
            body {{ font-family: Arial, sans-serif; line-height: 1.7; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #00cec9 0%, #0984e3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px 35px; border-radius: 0 0 10px 10px; }}
            .example {{ background: #fff; border-radius: 10px; padding: 18px 20px; margin: 14px 0; border: 1px solid #e2e8f0; }}
            .example-prompt {{ font-family: monospace; background: #f1f5f9; padding: 8px 12px; border-radius: 6px; font-size: 14px; color: #334155; margin: 8px 0; }}
            .button {{ display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #999; font-size: 12px; }}
        </style></head><body>
        <div class="container">
            <div class="header"><h1>🏗️ AI Deck Builder</h1></div>
            <div class="content">
                <h2>Costruisci qualsiasi mazzo in 30 secondi.</h2>
                <p>L'AI Deck Builder è lo strumento più usato del sito. Basta descrivere il mazzo che vuoi in italiano o inglese, e l'AI genera una lista completa con strategia e upgrade path.</p>

                <p><strong>Esempi di prompt che funzionano bene:</strong></p>

                <div class="example">
                    <div class="example-prompt">"Commander Atraxa proliferate, budget 100€"</div>
                    <p style="margin:6px 0 0; font-size:13px; color:#666;">Genera un Commander da 100 carte ottimizzato per proliferate con budget limitato.</p>
                </div>
                <div class="example">
                    <div class="example-prompt">"aggro rosso Modern, veloce e competitivo"</div>
                    <p style="margin:6px 0 0; font-size:13px; color:#666;">Mazzo aggro da 60 carte per il formato Modern.</p>
                </div>
                <div class="example">
                    <div class="example-prompt">"control blu-bianco Standard, con counterspell e removal"</div>
                    <p style="margin:6px 0 0; font-size:13px; color:#666;">Control per il formato Standard attuale.</p>
                </div>

                <p>Il risultato include: lista completa, sideboard, spiegazione della strategia, e suggerimenti per migliorare il mazzo nel tempo.</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{FRONTEND_URL}" class="button">Prova AI Deck Builder →</a>
                </div>
            </div>
            <div class="footer"><p>© 2026 Magic Deck Builder. <a href="{FRONTEND_URL}/account" style="color:#999;">Gestisci preferenze email</a></p></div>
        </div>
        </body></html>
        """
    }
    try:
        response = requests.post(BREVO_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        print(f"✅ Email onboarding giorno 3 inviata a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Errore invio email onboarding day3 a {to_email}: {e}")
        return False


def send_onboarding_day7_email(to_email: str) -> bool:
    """Email onboarding giorno 7: re-engagement con valore concreto"""
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    payload = {
        "sender": {"name": FROM_NAME, "email": FROM_EMAIL},
        "to": [{"email": to_email, "name": to_email.split('@')[0]}],
        "subject": "Stai lasciando i tuoi token inutilizzati 🪙",
        "htmlContent": f"""
        <html><head><style>
            body {{ font-family: Arial, sans-serif; line-height: 1.7; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #f9ca24 0%, #e67e22 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px 35px; border-radius: 0 0 10px 10px; }}
            .highlight {{ background: #fef9ec; border-left: 4px solid #f9ca24; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
            .tool-row {{ display: flex; gap: 12px; margin: 10px 0; }}
            .button {{ display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #999; font-size: 12px; }}
        </style></head><body>
        <div class="container">
            <div class="header"><h1>🪙 I tuoi token ti aspettano</h1></div>
            <div class="content">
                <h2>Sono passati 7 giorni dalla tua registrazione.</h2>

                <div class="highlight">
                    <strong>Hai ancora i tuoi 100 token gratuiti.</strong><br/>
                    Ogni token vale un'azione: un caricamento, una ricerca, un mazzo generato dall'AI.
                </div>

                <p>Cosa puoi fare con i token che hai:</p>
                <ul>
                    <li>🔍 <strong>Confronta Mazzi</strong> — carica la tua collezione e scopri quali mazzi competitivi puoi costruire adesso</li>
                    <li>🏗️ <strong>AI Deck Builder</strong> — genera un mazzo Commander o Modern da zero in 30 secondi</li>
                    <li>🪞 <strong>AI Gemelli</strong> — trova alternative economiche alle carte costose del tuo mazzo</li>
                    <li>✨ <strong>AI Synergy</strong> — scopri combo nascoste tra le carte che già possiedi</li>
                </ul>

                <p>Il sito è gratuito da usare. I token non scadono. Non c'è nessun motivo per non provare.</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{FRONTEND_URL}" class="button">Torna su Magic Deck Builder →</a>
                </div>

                <p style="color: #888; font-size: 13px;">Se hai avuto problemi tecnici o non riesci ad accedere, rispondi a questa email.</p>
            </div>
            <div class="footer"><p>© 2026 Magic Deck Builder. <a href="{FRONTEND_URL}/account" style="color:#999;">Gestisci preferenze email</a></p></div>
        </div>
        </body></html>
        """
    }
    try:
        response = requests.post(BREVO_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        print(f"✅ Email onboarding giorno 7 inviata a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Errore invio email onboarding day7 a {to_email}: {e}")
        return False
