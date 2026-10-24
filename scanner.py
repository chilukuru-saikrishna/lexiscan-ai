import os
import traceback
from pypdf import PdfReader
from docx import Document
from google import genai
from google.genai import types
from models import ContractReport

def extract_text(file_path: str) -> str:
    text = ""
    if file_path.lower().endswith(".pdf"):
        reader = PdfReader(file_path)
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    elif file_path.lower().endswith(".docx"):
        doc = Document(file_path)
        text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
    
    if not text.strip():
        raise ValueError("Could not extract any readable text from the uploaded document.")
    return text

def analyze_contract(text: str, party: str = "Buyer", playbook: str = "") -> ContractReport:
    try:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set!")

        client = genai.Client(api_key=api_key)

        system_instruction = f"""
        You are an autonomous transactional legal assistant reviewing a commercial agreement.
        You are strictly protecting the interests of the: {party}.
        Playbook / Risk Guidelines:
        {playbook if playbook else "Cap liability to 12 months fees paid. Ensure mutual indemnification. Retain IP ownership."}

        Instructions:
        1. Scan the text for missing protections, liability traps, and non-standard terms.
        2. Suggest concrete replacement language (redlines) for every identified issue.
        3. Return your entire analysis conforming strictly to the provided JSON schema.
        """

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=f"Review this contract:\n\n{text}",
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ContractReport,
                temperature=0.1
            )
        )
        return ContractReport.model_validate_json(response.text)
    except Exception as e:
        print("\n" + "=" * 50)
        print("ERROR IN ANALYZE_CONTRACT:")
        traceback.print_exc()
        print("=" * 50 + "\n")
        raise e