# Configurazione Brevo (ex Sendinblue)

## Setup

1. **Crea un account Brevo**
   - Vai su https://www.brevo.com/
   - Registrati gratuitamente (300 email/giorno gratis)

2. **Ottieni la API Key**
   - Accedi al tuo account Brevo
   - Vai su Settings → SMTP & API → API Keys
   - Crea una nuova API key
   - Copia la chiave

3. **Configura le variabili d'ambiente**
   - Copia `.env.example` in `.env`
   - Inserisci la tua API key di Brevo:
   ```
   BREVO_API_KEY=xkeysib-your-api-key-here
   FROM_EMAIL=noreply@tuodominio.com
   FROM_NAME=Magic Deck Builder
   FRONTEND_URL=http://localhost:5173
   ```

4. **Verifica il dominio email (opzionale ma consigliato)**
   - Vai su Senders & IP → Domains
   - Aggiungi il tuo dominio
   - Configura i record DNS (SPF, DKIM)

## Utente di Test

È stato creato un utente di test già verificato:

- **Email**: test@example.com
- **Password**: test123

Puoi usarlo per testare l'applicazione senza dover verificare l'email.

## Test Email in Sviluppo

Se non configuri Brevo, le email non verranno inviate ma il link di verifica verrà stampato nei log del backend.

## Limiti Piano Gratuito

- 300 email/giorno
- Branding Brevo nelle email
- Supporto email

Per rimuovere il branding e aumentare i limiti, considera un upgrade al piano a pagamento.
