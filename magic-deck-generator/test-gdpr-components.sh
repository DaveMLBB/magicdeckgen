#!/bin/bash

echo "🔍 Verifica Componenti GDPR Frontend"
echo "===================================="
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contatori
TOTAL=0
FOUND=0

check_file() {
    TOTAL=$((TOTAL + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        FOUND=$((FOUND + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $2 - FILE MANCANTE: $1"
        return 1
    fi
}

check_in_file() {
    TOTAL=$((TOTAL + 1))
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $3"
        FOUND=$((FOUND + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $3 - NON TROVATO IN: $1"
        return 1
    fi
}

echo "📁 Componenti React:"
echo "-------------------"
check_file "src/components/CookieConsentBanner.jsx" "CookieConsentBanner.jsx"
check_file "src/components/CookieConsentBanner.css" "CookieConsentBanner.css"
check_file "src/components/PrivacySettings.jsx" "PrivacySettings.jsx"
check_file "src/components/PrivacySettings.css" "PrivacySettings.css"
check_file "src/components/LegalPages.jsx" "LegalPages.jsx"
check_file "src/components/LegalPages.css" "LegalPages.css"
check_file "src/components/CookieSettings.jsx" "CookieSettings.jsx"
check_file "src/components/CookieSettings.css" "CookieSettings.css"
check_file "src/components/EmailPreferences.jsx" "EmailPreferences.jsx"
check_file "src/components/EmailPreferences.css" "EmailPreferences.css"
check_file "src/components/DataExportButton.jsx" "DataExportButton.jsx"
check_file "src/components/DataExportButton.css" "DataExportButton.css"
check_file "src/components/AccountDeletionFlow.jsx" "AccountDeletionFlow.jsx"
check_file "src/components/AccountDeletionFlow.css" "AccountDeletionFlow.css"

echo ""
echo "🔗 Integrazione in App.jsx:"
echo "---------------------------"
check_in_file "src/App.jsx" "import CookieConsentBanner" "Import CookieConsentBanner"
check_in_file "src/App.jsx" "import PrivacySettings" "Import PrivacySettings"
check_in_file "src/App.jsx" "import LegalPages" "Import LegalPages"
check_in_file "src/App.jsx" "import CookieSettings" "Import CookieSettings"
check_in_file "src/App.jsx" "import EmailPreferences" "Import EmailPreferences"
check_in_file "src/App.jsx" "<CookieConsentBanner" "Render CookieConsentBanner"
check_in_file "src/App.jsx" "privacy-settings" "Route Privacy Settings"
check_in_file "src/App.jsx" "privacy-policy" "Route Privacy Policy"
check_in_file "src/App.jsx" "terms-of-service" "Route Terms of Service"
check_in_file "src/App.jsx" "cookie-settings" "Route Cookie Settings"
check_in_file "src/App.jsx" "email-preferences" "Route Email Preferences"

echo ""
echo "📊 Risultato:"
echo "-------------"
echo -e "Trovati: ${GREEN}${FOUND}${NC}/${TOTAL}"

if [ $FOUND -eq $TOTAL ]; then
    echo -e "${GREEN}✅ TUTTI I COMPONENTI GDPR SONO PRESENTI E INTEGRATI!${NC}"
    echo ""
    echo "🎯 Come verificare nel browser:"
    echo "1. Apri http://localhost:5174/ in modalità incognito"
    echo "2. Dovresti vedere il cookie banner in basso"
    echo "3. Dopo il login, clicca '🔒 Privacy' nell'header"
    echo "4. Scorri in fondo per vedere i link Privacy/Termini/Cookie"
    exit 0
else
    echo -e "${RED}❌ ALCUNI COMPONENTI MANCANO!${NC}"
    exit 1
fi
