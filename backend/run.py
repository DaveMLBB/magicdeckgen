import uvicorn
import os

# Crea cartella data se non esiste
os.makedirs("data", exist_ok=True)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
