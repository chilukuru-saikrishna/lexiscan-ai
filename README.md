# Lexiscan AI — Contract Intelligence & Policy Benchmarking Engine

**Lexiscan AI** is a lightweight, privacy-focused legal engineering tool designed to automate commercial contract review and compliance auditing. It combines a Chrome Extension (Manifest V3), a high-performance FastAPI backend, and Google Gemini to benchmark contract clauses against operational legal playbooks in real time.

---

## How the Comparison Engine Works

Lexiscan AI executes a structured, 3-tier policy validation pipeline:

```
[Contract / PDF Text Selection]
              │
              ▼
[Chrome Extension Service Worker] ──► Inject Reviewer Perspective + Playbook Rules
              │
              ▼
[FastAPI /scan Endpoint] ──────────► Ingests payload & enforces validation
              │
              ▼
[Gemini Structured Inference] ─────► Compares Obligations vs. Policy Rules
              │
              ▼
[Pydantic JSON Model Output] ──────► Strict schema validation (Risk, Redline, Rationale)
              │
              ▼
[Interactive UI & Export] ─────────► One-click clipboard replace & Word (.doc) export
```

### 1. Context & Rule Injection (`popup.js`)
When a clause is selected, the client transmits the raw contract text alongside two governing policy parameters:
* **Reviewer Perspective (`party`)**: Sets the defensive posture (e.g., `Customer / Buyer` vs. `Vendor / Supplier`).
* **Governance Playbook (`playbook`)**: Explicit corporate policy baselines that cannot be breached (e.g., liability caps, indemnification parity, IP retention, termination rights).

### 2. Analytical Comparison Prompt (`scanner.py`)
The backend orchestrates Gemini as an institutional risk auditor. Gemini compares each obligation in the clause against the defined playbook parameters:
* **Identification**: Detects missing protections, one-sided provisions, or unbudgeted liabilities.
* **Risk Categorization**: Assigns a definitive severity rating (`Low`, `Medium`, `High`, `Critical`).
* **Deterministic Redlining**: Rewrites the exact text to maintain operational intent while bringing the clause into strict compliance with the playbook.

### 3. Strict Schema Enforcement (`models.py`)
To prevent unstructured outputs, responses satisfy a type-enforced Pydantic schema:

```python
class Issue(BaseModel):
    section_reference: str    # Section heading or numeric tag
    risk_level: str           # Low | Medium | High | Critical
    problem_summary: str      # Legal/business rationale for deviation
    original_text: str        # Exact text flagged from agreement
    suggested_revision: str   # Playbook-compliant revision

class ContractReport(BaseModel):
    overall_risk_score: int   # Aggregated risk index (1 - 10)
    issues: list[Issue]       # Itemized deviation cards
```

---

## Project Structure

```text
lexiscan-ai/
│
├── app.py                 # FastAPI service, CORS, and endpoint definitions
├── scanner.py             # LLM orchestration & prompt construction
├── models.py              # Pydantic schemas (ContractReport, Issue)
├── requirements.txt       # Backend dependencies
├── .env.example           # Environment template (API keys)
├── run_all.bat            # One-click startup script
│
├── extension/
│   ├── manifest.json      # Chrome Manifest V3 configuration
│   ├── background.js      # Service worker & native context menu handling
│   ├── popup.html         # Analysis view & export triggers
│   └── popup.js           # Event coordination & Word MIME export logic
│
├── .gitignore             # Enforces security exclusions (.env, virtualenvs)
└── README.md
```

---

## Setup & Installation

### 1. Backend Setup

1. **Create and activate a virtual environment**:
   * **Windows**:
     ```cmd
     python -m venv venv
     venv\Scripts\activate
     ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

4. **Start the API Server**:
   ```bash
   python app.py
   ```
   *The server runs on `http://127.0.0.1:8000`.*

---

### 2. Chrome Extension Setup

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** via the toggle in the top-right corner.
3. Click **Load unpacked** and select the `extension/` folder.
4. *(Required for local PDFs)*: Click **Details** on the Lexiscan AI card and enable **Allow access to file URLs**.

---

## Operational Workflow

1. Open any commercial agreement or PDF in Google Chrome.
2. Highlight a clause.
3. Right-click and select **🔍 Analyze Clause with Lexiscan AI**.
4. Review the analysis in the popup:
   * **Risk Tag**: Severity classification based on company policy.
   * **Deviation Summary**: Plain-English rationale detailing the business risk.
   * **Accept Edit**: Copies the negotiated redline directly to the clipboard.
   * **Export Redline Review**: Generates and downloads a Word memo (`.doc`) containing full audit trails.

---

## Security & Data Hygiene

* **No Secret Leakage**: API credentials reside exclusively within the local `.env` runtime and are excluded via `.gitignore`.
* **Zero Persistence**: Uploaded temporary files and plain text buffers are unlinked from the server filesystem immediately following inference.
* **Isolated Processing**: Document processing executes on local loopback (`localhost:8000`) before contacting the authenticated model endpoint.