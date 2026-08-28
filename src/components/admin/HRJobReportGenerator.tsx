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
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="rounded-2xl border border-purple-500/30 bg-slate-900/80 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Explainable PDF Evidence Package
            </span>
            <span className="text-xs text-slate-400 font-medium">{job.title}</span>
          </div>
          <h1 className="text-xl font-bold font-display text-white">
            Job-Level Governance & Audit Package Export
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Generates the comprehensive PDF evidence document containing all candidate rankings, dual-score discrepancy validations, rubric change histories, and HR governance sign-offs.
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all shrink-0 hover:scale-[1.02]"
        >
          <Download className="w-4 h-4" />
          <span>Export Governance Report PDF</span>
        </button>
      </div>

      {/* Compliance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 shadow-lg space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Evaluated Candidates
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-white">{jobApps.length}</span>
            <span className="text-xs text-slate-400">Total in Pipeline</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 shadow-lg space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Escalations & Exceptions
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-display ${pendingEscalations.length === 0 ? "text-emerald-400" : "text-red-400"}`}>
              {pendingEscalations.length}
            </span>
            <span className="text-xs text-slate-400">Pending Actions</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 shadow-lg space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Rubric Versions
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-purple-300">v{job.rubricHistory.length}.0</span>
            <span className="text-xs text-slate-400">Tamper-Evident History</span>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-4">
        <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400" />
          Evidence Package Contents (Included in PDF)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-semibold text-white">1. Job Metadata & Locked Criteria</span>
            <p className="text-slate-400 text-[11px]">
              Complete role requirements, department, vacancies, and criteria weight distribution.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-semibold text-white">2. Candidate Comparative Ranking Matrix</span>
            <p className="text-slate-400 text-[11px]">
              Detailed table listing all candidate IDs, HM marks, Gemini independent marks, deltas, and discrepancy levels.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-semibold text-white">3. Governance & Escalation Resolution Ledger</span>
            <p className="text-slate-400 text-[11px]">
              Summary of all triggered escalations, overrides, and authorized HR exception resolutions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-semibold text-white">4. HR Administrator Compliance Sign-Off</span>
            <p className="text-slate-400 text-[11px]">
              Authorized signature and certification verifying decisions adhered strictly to locked, job-related criteria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRJobReportGenerator;
