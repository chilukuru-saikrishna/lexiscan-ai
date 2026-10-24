from enum import Enum
from typing import List
from pydantic import BaseModel, Field

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IssueCategory(str, Enum):
    LIABILITY = "UNACCEPTABLE_LIABILITY"
    INDEMNITY = "INDEMNIFICATION_IMBALANCE"
    IP = "INTELLECTUAL_PROPERTY"
    TERMINATION = "UNFAVORABLE_TERMINATION"
    CONFIDENTIALITY = "CONFIDENTIALITY_BREACH"
    GOVERNING_LAW = "GOVERNING_LAW"
    OTHER = "OTHER"

class ClauseReview(BaseModel):
    section_reference: str = Field(description="Clause number or heading, e.g., 'Section 6.1'")
    original_text: str = Field(description="Exact snippet from the contract")
    risk_level: RiskLevel
    category: IssueCategory
    problem_summary: str = Field(description="Why this is risky for our party")
    suggested_revision: str = Field(description="Exact redline replacement text")
    rationale: str = Field(description="Negotiation reasoning to present")

class ContractReport(BaseModel):
    document_title: str
    reviewed_party: str
    overall_risk_score: int = Field(description="1-10 risk scale")
    summary: str
    missing_clauses: List[str] = Field(description="Critical standard clauses absent from the text")
    issues: List[ClauseReview]