"use client";

import React, { useState, useEffect } from "react";
import PersonaNav from "@/components/PersonaNav";
import ApplicantPortal from "@/components/applicant/ApplicantPortal";
import HMJobRubricSetup from "@/components/manager/HMJobRubricSetup";
import HMShortlisting from "@/components/manager/HMShortlisting";
import HMInterviewEvaluation from "@/components/manager/HMInterviewEvaluation";
import HMAssignmentEvaluation from "@/components/manager/HMAssignmentEvaluation";
import HMRankingAndProposal from "@/components/manager/HMRankingAndProposal";
import HREscalationQueue from "@/components/admin/HREscalationQueue";
import HRIdentityVault from "@/components/admin/HRIdentityVault";
import HRAuditLogViewer from "@/components/admin/HRAuditLogViewer";
import HRJobReportGenerator from "@/components/admin/HRJobReportGenerator";
import ApiKeyModal from "@/components/ApiKeyModal";
import SafeModeInboxModal from "@/components/admin/SafeModeInboxModal";

import {
  UserPersona,
  Job,
  CandidateApplication,
  EscalationTicket,
  AuditLogEntry,
  CommunicationLog,
  AppSettings
} from "@/lib/types";
import { StorageService, DEFAULT_SETTINGS, INITIAL_JOB } from "@/lib/storage";

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<UserPersona>("applicant");

  // Sub-navigation for Hiring Manager
  const [hmTab, setHmTab] = useState<"rubric" | "shortlist" | "interview" | "assignment" | "proposals">("rubric");

  // Sub-navigation for HR/Admin
  const [hrTab, setHrTab] = useState<"escalations" | "vault" | "audit" | "report">("escalations");

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSafeInboxOpen, setIsSafeInboxOpen] = useState(false);

  // Live Data State
  const [jobs, setJobs] = useState<Job[]>([INITIAL_JOB]);
  const [activeJobId, setActiveJobId] = useState<string>(INITIAL_JOB.id);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [escalations, setEscalations] = useState<EscalationTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [communications, setCommunications] = useState<CommunicationLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const loadData = () => {
    setJobs(StorageService.getJobs());
    setActiveJobId(StorageService.getActiveJobId());
    setApplications(StorageService.getApplications());
    setEscalations(StorageService.getEscalations());
    setAuditLogs(StorageService.getAuditLogs());
    setCommunications(StorageService.getCommunications());
    setSettings(StorageService.getSettings());
  };

  useEffect(() => {
    setIsMounted(true);
    loadData();

    const handleDataChange = () => loadData();
    window.addEventListener("fairhire_data_changed", handleDataChange);
    window.addEventListener("fairhire_active_job_changed", handleDataChange);
    window.addEventListener("fairhire_settings_changed", handleDataChange);

    return () => {
      window.removeEventListener("fairhire_data_changed", handleDataChange);
      window.removeEventListener("fairhire_active_job_changed", handleDataChange);
      window.removeEventListener("fairhire_settings_changed", handleDataChange);
    };
  }, []);

  const handleSelectJob = (jobId: string) => {
    setActiveJobId(jobId);
    StorageService.setActiveJobId(jobId);
  };

  const handleResetData = () => {
    if (confirm("Reset to clean production state? (Clears all live applications and resets audit ledger)")) {
      StorageService.resetToFreshState();
      loadData();
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="flex items-center gap-3 text-indigo-400 font-display font-medium text-sm">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Initializing FairHire Responsible AI Recruitment Platform...</span>
        </div>
      </div>
    );
  }

  const activeJob = jobs.find((j) => j.id === activeJobId) || jobs[0] || INITIAL_JOB;
  const pendingEscalationCount = escalations.filter((e) => e.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* 3-Persona Unified Navbar */}
      <PersonaNav
        currentPersona={currentPersona}
        onSelectPersona={setCurrentPersona}
        jobs={jobs}
        activeJobId={activeJobId}
        onSelectJob={handleSelectJob}
        settings={settings}
        stagedEmailCount={communications.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSafeInbox={() => setIsSafeInboxOpen(true)}
        onResetData={handleResetData}
      />

      {/* Main Persona Workspaces */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ========================================================= */}
        {/* PERSONA 1: PUBLIC APPLICANT PORTAL                        */}
        {/* ========================================================= */}
        {currentPersona === "applicant" && (
          <ApplicantPortal
            jobs={jobs}
            applications={applications}
            onApplicationSubmitted={() => loadData()}
          />
        )}

        {/* ========================================================= */}
        {/* PERSONA 2: HIRING MANAGER WORKSPACE                       */}
        {/* ========================================================= */}
        {currentPersona === "hiring_manager" && (
          <div className="space-y-6">
            {/* Hiring Manager Stage Sub-Navigation Bar */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto shadow-lg">
              <button
                onClick={() => setHmTab("rubric")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  hmTab === "rubric"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                1. Vacancy & Locked Rubrics
              </button>

              <button
                onClick={() => setHmTab("shortlist")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  hmTab === "shortlist"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                2. Stage 1: Shortlisting ({applications.filter((a) => a.jobId === activeJob.id).length})
              </button>

              <button
                onClick={() => setHmTab("interview")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  hmTab === "interview"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                3. Stage 2: Interview Transcript Scoring
              </button>

              <button
                onClick={() => setHmTab("assignment")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  hmTab === "assignment"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                4. Stage 3: Assignment Evaluation
              </button>

              <button
                onClick={() => setHmTab("proposals")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  hmTab === "proposals"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                5. Stage 4: Candidate Rankings & Proposal
              </button>
            </div>

            {/* Sub-Views */}
            {hmTab === "rubric" && (
              <HMJobRubricSetup
                jobs={jobs}
                activeJob={activeJob}
                onJobUpdated={() => loadData()}
              />
            )}

            {hmTab === "shortlist" && (
              <HMShortlisting
                job={activeJob}
                applications={applications}
                onApplicationUpdated={() => loadData()}
              />
            )}

            {hmTab === "interview" && (
              <HMInterviewEvaluation
                job={activeJob}
                applications={applications}
                onApplicationUpdated={() => loadData()}
              />
            )}

            {hmTab === "assignment" && (
              <HMAssignmentEvaluation
                job={activeJob}
                applications={applications}
                onApplicationUpdated={() => loadData()}
                onNavigateToProposal={() => setHmTab("proposals")}
              />
            )}

            {hmTab === "proposals" && (
              <HMRankingAndProposal
                job={activeJob}
                applications={applications}
                onApplicationUpdated={() => loadData()}
                onNavigateToHRReport={() => {
                  setCurrentPersona("hr_admin");
                  setHrTab("report");
                }}
              />
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PERSONA 3: HR / ADMIN GOVERNANCE PORTAL                   */}
        {/* ========================================================= */}
        {currentPersona === "hr_admin" && (
          <div className="space-y-6">
            {/* HR Governance Sub-Navigation Bar */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto shadow-lg">
              <button
                onClick={() => setHrTab("escalations")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  hrTab === "escalations"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <span>1. Escalations & Discrepancies</span>
                {pendingEscalationCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-red-500 text-white text-[10px] rounded-full font-bold">
                    {pendingEscalationCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setHrTab("vault")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  hrTab === "vault"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                2. Identity Vault & Unmasking
              </button>

              <button
                onClick={() => setHrTab("audit")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  hrTab === "audit"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                3. Immutable Audit Ledger ({auditLogs.length})
              </button>

              <button
                onClick={() => setHrTab("report")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  hrTab === "report"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                4. Job-Level Audit PDF Evidence Package
              </button>
            </div>

            {/* Sub-Views */}
            {hrTab === "escalations" && (
              <HREscalationQueue
                escalations={escalations}
                onEscalationResolved={() => loadData()}
              />
            )}

            {hrTab === "vault" && (
              <HRIdentityVault
                applications={applications}
                onApplicationUpdated={() => loadData()}
              />
            )}

            {hrTab === "audit" && (
              <HRAuditLogViewer logs={auditLogs} />
            )}

            {hrTab === "report" && (
              <HRJobReportGenerator
                job={activeJob}
                applications={applications}
                escalations={escalations}
                auditLogs={auditLogs}
              />
            )}
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(updated) => StorageService.saveSettings(updated)}
      />

      {/* Safe Mode Inbox Modal */}
      <SafeModeInboxModal
        isOpen={isSafeInboxOpen}
        onClose={() => setIsSafeInboxOpen(false)}
        communications={communications}
      />
    </div>
  );
}
