"use client";

import React, { useState } from "react";
import {
  FileCheck,
  Download,
  ShieldCheck,
  CheckCircle2,
  Lock,
  History,
  FileText
} from "lucide-react";
import { Job, CandidateApplication, EscalationTicket, AuditLogEntry } from "@/lib/types";
import { exportJobAuditReportToPdf } from "@/lib/pdf-export";

interface HRJobReportGeneratorProps {
  job: Job;
  applications: CandidateApplication[];
  escalations: EscalationTicket[];
  auditLogs: AuditLogEntry[];
}

export const HRJobReportGenerator: React.FC<HRJobReportGeneratorProps> = ({
  job,
  applications,
  escalations,
  auditLogs,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const jobApps = applications.filter((a) => a.jobId === job.id);
  const jobEscalations = escalations.filter((e) => e.jobId === job.id);
  const pendingEscalations = jobEscalations.filter((e) => e.status === "pending");

  const handleDownload = () => {
    setIsExporting(true);
    try {
      exportJobAuditReportToPdf(job, jobApps, escalations, auditLogs);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-secondary/10 text-secondary border border-secondary/20">
              Explainable PDF Evidence Package
            </span>
            <span className="text-xs text-on-surface-variant font-medium">{job.title}</span>
          </div>
          <h1 className="font-headline font-bold text-xl text-primary">
            Job-Level Governance & Audit Package Export
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 max-w-2xl">
            Generates the comprehensive PDF evidence document containing all candidate rankings, dual-score discrepancy validations, rubric change histories, and HR governance sign-offs.
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="px-6 py-3 rounded-lg bg-secondary hover:bg-secondary-container text-white font-bold text-xs shadow-subtle flex items-center gap-2 transition-all shrink-0 hover:scale-[1.01]"
        >
          <Download className="w-4 h-4" />
          <span>Export Governance Report PDF</span>
        </button>
      </div>

      {/* Compliance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-subtle space-y-2">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
            Evaluated Candidates
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-headline text-primary">{jobApps.length}</span>
            <span className="text-xs text-on-surface-variant">Total in Pipeline</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-subtle space-y-2">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
            Escalations & Exceptions
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold font-headline ${pendingEscalations.length === 0 ? "text-emerald-600" : "text-error"}`}>
              {pendingEscalations.length}
            </span>
            <span className="text-xs text-on-surface-variant">Pending Actions</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-subtle space-y-2">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
            Rubric Versions
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-headline text-secondary">v{job.rubricHistory.length}.0</span>
            <span className="text-xs text-on-surface-variant">Tamper-Evident History</span>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-subtle space-y-4">
        <h3 className="font-headline font-bold text-sm text-primary flex items-center gap-2">
          <FileText className="w-4 h-4 text-secondary" />
          Evidence Package Contents (Included in PDF)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-surface border border-outline-variant/30 space-y-1.5">
            <span className="font-headline font-bold text-primary">1. Job Metadata & Locked Criteria</span>
            <p className="text-on-surface-variant text-[11px]">
              Complete role requirements, department, vacancies, and criteria weight distribution.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-surface border border-outline-variant/30 space-y-1.5">
            <span className="font-headline font-bold text-primary">2. Candidate Comparative Ranking Matrix</span>
            <p className="text-on-surface-variant text-[11px]">
              Detailed table listing all candidate IDs, HM marks, Gemini independent marks, deltas, and discrepancy levels.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-surface border border-outline-variant/30 space-y-1.5">
            <span className="font-headline font-bold text-primary">3. Governance & Escalation Resolution Ledger</span>
            <p className="text-on-surface-variant text-[11px]">
              Summary of all triggered escalations, overrides, and authorized HR exception resolutions.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-surface border border-outline-variant/30 space-y-1.5">
            <span className="font-headline font-bold text-primary">4. HR Administrator Compliance Sign-Off</span>
            <p className="text-on-surface-variant text-[11px]">
              Authorized signature and certification verifying decisions adhered strictly to locked, job-related criteria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRJobReportGenerator;
