import sys
import os

# Ensure venv site-packages are on the path (needed for websockets/uvicorn[standard])
_venv_site = os.path.join(os.path.dirname(__file__), "venv", "lib", "python3.14", "site-packages")
if os.path.isdir(_venv_site) and _venv_site not in sys.path:
    sys.path.insert(0, _venv_site)

import uvicorn
from dotenv import load_dotenv

# Carica variabili d'ambiente da .env
load_dotenv()

# Crea cartella data se non esiste
os.makedirs("data", exist_ok=True)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
