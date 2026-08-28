export type UserPersona = "applicant" | "hiring_manager" | "hr_admin";

export type SeniorityLevel = "Junior" | "Mid-Level" | "Senior" | "Lead / Staff" | "Principal";

export type PipelineStage = "Screened" | "Round 1 Interview" | "Round 2 Assignment" | "Decision & Governance" | "Selected" | "Waitlisted" | "Rejected";

export type DiscrepancyLevel = "Aligned" | "Minor Difference" | "Significant Discrepancy";

export type HiringProposal = "Selected" | "Waitlisted" | "Not Selected";

export interface RubricCriterion {
  id: string;
  name: string;
  weight: number; // Percentage (sum of weights = 100)
  description: string;
}

export interface RubricHistoryEntry {
  version: number;
  criterionName: string;
  oldWeight: number;
  newWeight: number;
  reason: string;
  actor: string;
  timestamp: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  seniority: SeniorityLevel;
  location: string;
  type: "Full-Time" | "Contract" | "Remote";
  vacancies: number;
  summary: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  criteria: RubricCriterion[];
  round1Weight: number; // e.g. 50%
  round2Weight: number; // e.g. 50%
  rubricHistory: RubricHistoryEntry[];
  deadline: string;
  status: "published" | "draft" | "closed";
  createdAt: string;
}

export interface CandidateApplication {
  id: string;
  jobId: string;
  anonymizedId: string; // e.g. "Candidate #8491"
  
  // Identity Vault (Stored strictly separate, unmasked only with authorized reason)
  identityVault: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    isUnmasked: boolean;
    unmaskedReason?: string;
    unmaskedBy?: string;
    unmaskedAt?: string;
  };

  // Professional Evidence
  rawResumeText: string;
  linkedInExportText?: string;
  appliedDate: string;
  stage: PipelineStage;
  internalStatus: "submitted" | "shortlisted" | "hold" | "not_shortlisted" | "round1_completed" | "round2_completed" | "selected" | "waitlisted" | "rejected";
  applicantFacingStatus: string;

  // Stage 1: Preliminary Shortlisting Assessment
  shortlisting?: ShortlistingAssessment;

  // Stage 2: Round 1 Structured Interview
  round1Scorecard?: Round1Scorecard;

  // Stage 3: Round 2 Assignment
  round2Scorecard?: Round2Scorecard;

  // Final Outcome & Proposal
  finalProposal?: {
    hiringManagerRecommendation: HiringProposal;
    hiringManagerReason: string;
    officialCompositeScore: number;
    aiCompositeScore: number;
    hrAdminDecision?: "Approved" | "Returned" | "Rejected" | "Reopened";
    hrAdminNotes?: string;
    decidedAt?: string;
  };
}

export interface ShortlistingAssessment {
  geminiRecommendation: "Advance" | "Hold" | "Not Advance";
  geminiFitScore: number; // 0 - 100
  ruleBasedScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  claimsRequiringHumanVerification: string[];
  hmDecision: "Advance to Round 1" | "Hold" | "Not Advancing";
  hmOverrideReason?: string;
  evaluatedAt: string;
}

export interface Round1Scorecard {
  transcriptText: string;
  hmMarks: Record<string, number>; // criterionId -> score (0-100)
  hmReasons: Record<string, string>; // criterionId -> justification
  hmTotalScore: number;
  
  // Gemini Independent Validation
  geminiMarks: Record<string, number>;
  geminiCitations: Record<string, string[]>; // criterionId -> quoted evidence
  geminiTotalScore: number;

  // Discrepancy
  delta: number; // Absolute difference
  discrepancyLevel: DiscrepancyLevel;
  hmDiscrepancyJustification?: string;
  isEscalated: boolean;
  completedAt: string;
}

export interface Round2Scorecard {
  assignmentPrompt: string;
  submissionArtifactText: string;
  submittedAt: string;
  
  hmMarks: Record<string, number>;
  hmReasons: Record<string, string>;
  hmTotalScore: number;

  geminiMarks: Record<string, number>;
  geminiFeedback: Record<string, string>;
  geminiTotalScore: number;

  delta: number;
  discrepancyLevel: DiscrepancyLevel;
  isEscalated: boolean;
  completedAt: string;
}

export interface EscalationTicket {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateAnonymizedId: string;
  triggerType: "Score Discrepancy > 25%" | "Unjustified Override" | "Essential Requirement Bypass" | "Rubric Tampering" | "Adverse Decision on Top Candidate";
  description: string;
  severity: "Medium" | "High" | "Critical";
  status: "pending" | "approved" | "rejected" | "reopened";
  hmJustification?: string;
  hrResolutionNotes?: string;
  resolvedBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorRole: "Hiring Manager" | "HR/Admin" | "System / Bias Shield";
  actorName: string;
  action: string;
  targetId: string; // Candidate ID or Job ID
  details: string;
  mandatoryReason?: string;
}

export interface CommunicationLog {
  id: string;
  recipientEmail: string;
  candidateAnonymizedId: string;
  stage: string;
  subject: string;
  body: string;
  sentAt: string;
  safeModeRedirected: boolean;
  status: "Delivered (Safe Mode)" | "Sent" | "Failed";
}

export interface AppSettings {
  geminiApiKey: string;
  emailSafeMode: boolean;
  safeModeInboxEmail: string;
}
