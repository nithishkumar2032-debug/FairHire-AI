import {
  Job,
  CandidateApplication,
  EscalationTicket,
  AuditLogEntry,
  CommunicationLog,
  AppSettings,
  RubricCriterion,
  RubricHistoryEntry
} from "./types";

const STORAGE_KEYS = {
  JOBS: "fairhire_live_jobs_v2",
  APPLICATIONS: "fairhire_live_applications_v2",
  ESCALATIONS: "fairhire_live_escalations_v2",
  AUDIT_LOGS: "fairhire_live_audit_logs_v2",
  COMMUNICATIONS: "fairhire_live_communications_v2",
  SETTINGS: "fairhire_live_settings_v2",
  ACTIVE_JOB_ID: "fairhire_live_active_job_id_v2",
};

export const DEFAULT_CRITERIA: RubricCriterion[] = [
  { id: "crit-1", name: "Technical Competency & System Design", weight: 35, description: "Mastery of core architectural patterns, concurrency, performance optimization, and clean code principles." },
  { id: "crit-2", name: "Problem Solving & Analytical Rigor", weight: 30, description: "Structured decomposition of ambiguous problems, first-principles logic, and evaluating trade-offs." },
  { id: "crit-3", name: "Communication & Collaborative Clarity", weight: 20, description: "Concise articulation of ideas, active listening, and receptiveness to feedback." },
  { id: "crit-4", name: "Role Alignment & Execution Velocity", weight: 15, description: "Pragmatism, testing discipline, and commitment to delivery timelines." },
];

export const INITIAL_JOB: Job = {
  id: "job-prod-1",
  title: "Senior Full-Stack Software Engineer",
  department: "Core Engineering",
  seniority: "Senior",
  location: "Remote / Hybrid",
  type: "Full-Time",
  vacancies: 2,
  summary: "Seeking a Senior Full-Stack Engineer to architect distributed real-time collaborative services, low-latency APIs, and accessible modern frontends.",
  requiredSkills: ["React / Next.js", "TypeScript", "Node.js or Go", "PostgreSQL", "System Design"],
  niceToHaveSkills: ["Redis", "Docker", "WebSockets", "Tailwind CSS"],
  criteria: DEFAULT_CRITERIA,
  round1Weight: 50,
  round2Weight: 50,
  rubricHistory: [
    {
      version: 1,
      criterionName: "Initial Locked Rubric",
      oldWeight: 0,
      newWeight: 100,
      reason: "Initial vacancy criteria established and locked for unbiased evaluation.",
      actor: "HR System Admin",
      timestamp: new Date().toISOString(),
    }
  ],
  deadline: "2026-09-30",
  status: "published",
  createdAt: new Date().toISOString(),
};

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: "",
  emailSafeMode: true,
  safeModeInboxEmail: "governance-audit@fairhire.internal",
};

export class StorageService {
  private static isClient(): boolean {
    return typeof window !== "undefined";
  }

  private static dispatchChangeEvent() {
    if (this.isClient()) {
      window.dispatchEvent(new Event("fairhire_data_changed"));
    }
  }

  // Jobs
  static getJobs(): Job[] {
    if (!this.isClient()) return [INITIAL_JOB];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.JOBS);
      if (!data) {
        this.saveJobs([INITIAL_JOB]);
        return [INITIAL_JOB];
      }
      return JSON.parse(data);
    } catch {
      return [INITIAL_JOB];
    }
  }

  static saveJobs(jobs: Job[]): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
    this.dispatchChangeEvent();
  }

  static addJob(job: Job): void {
    const jobs = this.getJobs();
    this.saveJobs([job, ...jobs]);
    this.logAuditEvent(
      "Hiring Manager",
      "Hiring Manager",
      "Created Job Requisition",
      job.id,
      `Published job "${job.title}" with ${job.criteria.length} locked criteria.`
    );
  }

  static updateJobRubric(
    jobId: string,
    criterionId: string,
    newWeight: number,
    reason: string,
    actor: string
  ): void {
    const jobs = this.getJobs();
    const updated = jobs.map((job) => {
      if (job.id === jobId) {
        const criterion = job.criteria.find((c) => c.id === criterionId);
        if (!criterion) return job;
        const oldWeight = criterion.weight;
        criterion.weight = newWeight;

        const newHistoryEntry: RubricHistoryEntry = {
          version: job.rubricHistory.length + 1,
          criterionName: criterion.name,
          oldWeight,
          newWeight,
          reason,
          actor,
          timestamp: new Date().toISOString(),
        };

        return {
          ...job,
          rubricHistory: [newHistoryEntry, ...job.rubricHistory],
        };
      }
      return job;
    });

    this.saveJobs(updated);
    this.logAuditEvent(
      "Hiring Manager",
      actor,
      "Modified Locked Rubric",
      jobId,
      `Adjusted weight for criterion. Justification: "${reason}"`,
      reason
    );
  }

  static getActiveJobId(): string {
    if (!this.isClient()) return INITIAL_JOB.id;
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_JOB_ID);
    if (id && this.getJobs().some((j) => j.id === id)) {
      return id;
    }
    const defaultId = this.getJobs()[0]?.id || INITIAL_JOB.id;
    this.setActiveJobId(defaultId);
    return defaultId;
  }

  static setActiveJobId(id: string): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_JOB_ID, id);
    window.dispatchEvent(new Event("fairhire_active_job_changed"));
  }

  // Applications
  static getApplications(): CandidateApplication[] {
    if (!this.isClient()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveApplications(apps: CandidateApplication[]): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    this.dispatchChangeEvent();
  }

  static submitApplication(
    jobId: string,
    fullName: string,
    email: string,
    phone: string,
    location: string,
    resumeText: string,
    linkedInText?: string
  ): CandidateApplication {
    const apps = this.getApplications();
    const anonymizedNumber = 1000 + apps.length + 1;
    const anonymizedId = `Candidate #${anonymizedNumber}`;

    const newApp: CandidateApplication = {
      id: `app-${Date.now()}`,
      jobId,
      anonymizedId,
      identityVault: {
        fullName,
        email,
        phone,
        location,
        isUnmasked: false,
      },
      rawResumeText: resumeText,
      linkedInExportText: linkedInText,
      appliedDate: new Date().toISOString(),
      stage: "Screened",
      internalStatus: "submitted",
      applicantFacingStatus: "Application Received / Under Review",
    };

    this.saveApplications([newApp, ...apps]);

    // Send safe mode receipt
    this.stageCommunication(
      email,
      anonymizedId,
      "Application Confirmation",
      `Application Received for ${anonymizedId}`,
      `Hello,\n\nWe have successfully received your application. Your neutral evaluation code is ${anonymizedId}.\n\nYour credentials have been securely stored in our isolated Identity Vault. The hiring committee evaluates applications strictly on job-relevant skills.\n\nYou may track your status at any time using your Candidate Code: ${anonymizedId}.`
    );

    this.logAuditEvent(
      "System / Bias Shield",
      "Public Gateway",
      "Ingested Application",
      newApp.id,
      `Generated neutral identifier ${anonymizedId}. Identity partitioned into isolated vault.`
    );

    return newApp;
  }

  static updateApplication(app: CandidateApplication): void {
    const apps = this.getApplications();
    const updated = apps.map((a) => (a.id === app.id ? app : a));
    this.saveApplications(updated);
  }

  static unmaskIdentity(candidateId: string, actor: string, reason: string): void {
    const apps = this.getApplications();
    const updated = apps.map((app) => {
      if (app.id === candidateId) {
        return {
          ...app,
          identityVault: {
            ...app.identityVault,
            isUnmasked: true,
            unmaskedReason: reason,
            unmaskedBy: actor,
            unmaskedAt: new Date().toISOString(),
          },
        };
      }
      return app;
    });

    this.saveApplications(updated);
    this.logAuditEvent(
      "HR/Admin",
      actor,
      "Unmasked Identity Vault",
      candidateId,
      `Unmasked personal identity for operational purposes. Justification: "${reason}"`,
      reason
    );
  }

  // Escalations
  static getEscalations(): EscalationTicket[] {
    if (!this.isClient()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ESCALATIONS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveEscalations(tickets: EscalationTicket[]): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.ESCALATIONS, JSON.stringify(tickets));
    this.dispatchChangeEvent();
  }

  static addEscalation(ticket: EscalationTicket): void {
    const tickets = this.getEscalations();
    this.saveEscalations([ticket, ...tickets]);
    this.logAuditEvent(
      "System / Bias Shield",
      "Discrepancy Engine",
      "Triggered Governance Escalation",
      ticket.candidateId,
      `Escalation created: [${ticket.triggerType}] ${ticket.description}`
    );
  }

  static resolveEscalation(ticketId: string, status: "approved" | "rejected" | "reopened", hrNotes: string, actor: string): void {
    const tickets = this.getEscalations();
    const updated = tickets.map((t) => (t.id === ticketId ? { ...t, status, hrResolutionNotes: hrNotes, resolvedBy: actor, resolvedAt: new Date().toISOString() } : t));
    this.saveEscalations(updated);

    this.logAuditEvent(
      "HR/Admin",
      actor,
      `Resolved Escalation (${status.toUpperCase()})`,
      ticketId,
      `HR resolution: "${hrNotes}"`,
      hrNotes
    );
  }

  // Audit Log
  static getAuditLogs(): AuditLogEntry[] {
    if (!this.isClient()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static logAuditEvent(
    actorRole: AuditLogEntry["actorRole"],
    actorName: string,
    action: string,
    targetId: string,
    details: string,
    mandatoryReason?: string
  ): void {
    if (!this.isClient()) return;
    const logs = this.getAuditLogs();
    const newLog: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actorRole,
      actorName,
      action,
      targetId,
      details,
      mandatoryReason,
    };
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([newLog, ...logs]));
    this.dispatchChangeEvent();
  }

  // Communications
  static getCommunications(): CommunicationLog[] {
    if (!this.isClient()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMMUNICATIONS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static stageCommunication(
    recipientEmail: string,
    candidateAnonymizedId: string,
    stage: string,
    subject: string,
    body: string
  ): void {
    if (!this.isClient()) return;
    const settings = this.getSettings();
    const comms = this.getCommunications();

    const newComm: CommunicationLog = {
      id: `comm-${Date.now()}`,
      recipientEmail: settings.emailSafeMode ? `${settings.safeModeInboxEmail} (for ${recipientEmail})` : recipientEmail,
      candidateAnonymizedId,
      stage,
      subject,
      body,
      sentAt: new Date().toISOString(),
      safeModeRedirected: settings.emailSafeMode,
      status: settings.emailSafeMode ? "Delivered (Safe Mode)" : "Sent",
    };

    localStorage.setItem(STORAGE_KEYS.COMMUNICATIONS, JSON.stringify([newComm, ...comms]));
    this.dispatchChangeEvent();
  }

  // Settings
  static getSettings(): AppSettings {
    if (!this.isClient()) return DEFAULT_SETTINGS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: Partial<AppSettings>): void {
    if (!this.isClient()) return;
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    window.dispatchEvent(new Event("fairhire_settings_changed"));
  }

  static resetToFreshState(): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify([INITIAL_JOB]));
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ESCALATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.COMMUNICATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_JOB_ID, INITIAL_JOB.id);
    this.dispatchChangeEvent();
  }
}
