import traceback
from pathlib import Path
from dotenv import load_dotenv

# Load GEMINI_API_KEY from .env
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from scanner import extract_text, analyze_contract
from models import ContractReport

app = FastAPI(title="Lexiscan AI — Contract Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("./uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/scan", response_model=ContractReport)
def scan_endpoint(
    file: UploadFile = File(...),
    party: str = Form("Customer"),
    playbook: str = Form("Standard corporate protections. Cap liability to 12 months fees.")
):
    temp_path = UPLOAD_DIR / file.filename
    try:
        content = file.file.read()
        
        if file.filename.endswith(".txt"):
            text = content.decode("utf-8", errors="ignore")
        else:
            with temp_path.open("wb") as buf:
                buf.write(content)
            text = extract_text(str(temp_path))

        if not text.strip():
            raise HTTPException(status_code=400, detail="No readable text found")

        report = analyze_contract(text, party=party, playbook=playbook)
        return report

    except Exception as e:
        print("\n" + "="*50)
        print("LEXISCAN BACKEND EXECUTION ERROR:")
        traceback.print_exc()
        print("="*50 + "\n")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path.exists():
            temp_path.unlink()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)