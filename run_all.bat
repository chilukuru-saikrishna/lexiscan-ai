@echo off
cd /d C:\Users\chilu\projects\spellbook-clone
call venv\Scripts\activate.bat

echo Starting FastAPI Backend on port 8000...
start "Spellbook Backend" cmd /k "venv\Scripts\activate.bat && python app.py"

timeout /t 3 /nobreak >nul

echo Starting Streamlit Frontend on port 8501...
streamlit run frontend.py --server.address=127.0.0.1