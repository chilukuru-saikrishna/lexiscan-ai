let currentIssues = [];
let acceptedEdits = [];

async function runScan(text) {
  const statusEl = document.getElementById('status');
  const resultsEl = document.getElementById('results');
  const downloadBtn = document.getElementById('downloadBtn');
  
  statusEl.innerText = "Lexiscan analyzing highlighted clause...";
  resultsEl.innerHTML = "";
  if (downloadBtn) downloadBtn.style.display = "none";
  currentIssues = [];
  acceptedEdits = [];

  const formData = new FormData();
  const blob = new Blob([text], { type: 'text/plain' });
  formData.append('file', blob, 'selection.txt');
  formData.append('party', 'Customer');
  formData.append('playbook', 'Cap liability to 12 months fees paid. Bilateral termination rights. Retain custom IP.');

  let response;
  try {
    response = await fetch('http://127.0.0.1:8000/scan', {
      method: 'POST',
      body: formData
    });
  } catch (err1) {
    try {
      response = await fetch('http://localhost:8000/scan', {
        method: 'POST',
        body: formData
      });
    } catch (err2) {
      statusEl.innerText = "Connection failed: " + err2.message;
      return;
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    statusEl.innerText = `Server error: ${errData.detail || response.statusText || response.status}`;
    return;
  }

  const data = await response.json();
  currentIssues = data.issues || [];
  statusEl.innerText = `Risk Index: ${data.overall_risk_score}/10 | Found ${currentIssues.length} risk factor(s)`;

  if (currentIssues.length > 0 && downloadBtn) {
    downloadBtn.style.display = "block";
  }

  currentIssues.forEach((issue, index) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <div><span class="risk-tag">${issue.risk_level}</span> <b>${issue.section_reference}</b></div>
      <p style="margin: 6px 0;">${issue.problem_summary}</p>
      <div class="orig-box"><b>Original:</b><br>${issue.original_text}</div>
      <div class="rev-box"><b>Lexiscan Revision:</b><br>${issue.suggested_revision}</div>
      <button class="btn-accept" id="acceptBtn-${index}">✅ Accept Edit</button>
    `;
    resultsEl.appendChild(div);

    const acceptBtn = div.querySelector(`#acceptBtn-${index}`);
    acceptBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(issue.suggested_revision);
      acceptBtn.innerText = "✓ Accepted & Copied";
      acceptBtn.classList.add('accepted');
      acceptedEdits.push({
        section: issue.section_reference,
        risk: issue.risk_level,
        problem: issue.problem_summary,
        original: issue.original_text,
        revised: issue.suggested_revision
      });
    });
  });
}

// Export Document Handler
const downloadBtn = document.getElementById('downloadBtn');
if (downloadBtn) {
  downloadBtn.addEventListener('click', () => {
    const payloadToExport = acceptedEdits.length > 0 ? acceptedEdits : currentIssues.map(i => ({
      section: i.section_reference,
      risk: i.risk_level,
      problem: i.problem_summary,
      original: i.original_text,
      revised: i.suggested_revision
    }));

    if (payloadToExport.length === 0) {
      alert("No reviewed clauses to export.");
      return;
    }

    let docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Lexiscan AI — Contract Review Memorandum</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #111827; }
          h1 { color: #0f172a; font-size: 18pt; border-bottom: 2pt solid #0284c7; padding-bottom: 4pt; }
          h2 { color: #1e293b; font-size: 12pt; margin-top: 16pt; margin-bottom: 4pt; }
          .risk-badge { font-weight: bold; color: #dc2626; font-size: 10pt; text-transform: uppercase; }
          .problem-note { font-style: italic; color: #475569; margin-bottom: 6pt; }
          .original-text { background-color: #fee2e2; color: #991b1b; text-decoration: line-through; padding: 4pt; margin-bottom: 6pt; }
          .redline-text { background-color: #dcfce7; color: #166534; font-weight: bold; padding: 4pt; margin-top: 6pt; }
          hr { border: none; border-top: 1px solid #e2e8f0; margin: 14pt 0; }
        </style>
      </head>
      <body>
        <h1>Lexiscan AI — Contract Review Memorandum</h1>
        <p><b>Review Date:</b> ${new Date().toLocaleDateString()}</p>
        <p><b>Evaluated Perspective:</b> Customer / Buyer</p>
        <hr/>
    `;

    payloadToExport.forEach((item, idx) => {
      docContent += `
        <h2>Clause Deviation ${idx + 1}: ${item.section || 'General Provision'}</h2>
        <div class="risk-badge">Risk Assessment: ${item.risk || 'High'}</div>
        <p class="problem-note">${item.problem || ''}</p>
        <p><b>Original Clause:</b></p>
        <div class="original-text">${item.original}</div>
        <p><b>Lexiscan Proposed Redline:</b></p>
        <div class="redline-text">${item.revised}</div>
        <hr/>
      `;
    });

    docContent += `
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', docContent], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = 'Lexiscan_Redline_Review.doc';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  });
}

// Native Context Menu Trigger Listener
window.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.local.get(['selectedClause', 'autoTrigger']);
  if (data.selectedClause) {
    document.getElementById('status').innerText = "Clause captured by Lexiscan!";
    await chrome.storage.local.remove(['selectedClause', 'autoTrigger']);
    runScan(data.selectedClause);
  }
});