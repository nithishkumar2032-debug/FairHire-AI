"use client";

import React, { useState, useEffect } from "react";
import StaffSidebar from "@/components/layout/StaffSidebar";
import TopAppBar from "@/components/layout/TopAppBar";
import ApplicantPortal from "@/components/applicant/ApplicantPortal";
import HMJobRubricSetup from "@/components/manager/HMJobRubricSetup";
import HMJobCreationWizard from "@/components/manager/HMJobCreationWizard";
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
  const [currentPersona, setCurrentPersona] = useState<UserPersona>("hiring_manager");

  // Sub-navigation for Hiring Manager
  const [hmTab, setHmTab] = useState<"rubric" | "shortlist" | "interview" | "assignment" | "proposals">("rubric");

  // Sub-navigation for HR/Admin
  const [hrTab, setHrTab] = useState<"escalations" | "vault" | "audit" | "report">("escalations");

  // Modals & Wizard
  const [isJobWizardOpen, setIsJobWizardOpen] = useState(false);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-secondary font-headline font-semibold text-sm">
          <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
          <span>Loading FairHire Intelligence System...</span>
        </div>
      </div>
    );
  }

  const activeJob = jobs.find((j) => j.id === activeJobId) || jobs[0] || INITIAL_JOB;
  const pendingEscalationCount = escalations.filter((e) => e.status === "pending").length;

  const pageTitle =
    isJobWizardOpen
      ? "Job Creation Wizard"
      : currentPersona === "applicant"
      ? "Public Applicant Portal"
      : currentPersona === "hiring_manager"
      ? "Hiring Manager Evaluation Workspace"
      : "HR / Admin Governance & Compliance Portal";

  const isStaffView = currentPersona !== "applicant";

  return (
    <div className="min-h-screen bg-background text-on-background flex">
      {/* 280px Deep Navy Staff Sidebar (for HM & HR/Admin) */}
      {isStaffView && (
        <StaffSidebar
          currentPersona={currentPersona}
          onSelectPersona={setCurrentPersona}
          hmTab={hmTab}
          onSelectHmTab={setHmTab}
          hrTab={hrTab}
          onSelectHrTab={setHrTab}
          onOpenNewJobWizard={() => setIsJobWizardOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSafeInbox={() => setIsSafeInboxOpen(true)}
          pendingEscalationsCount={pendingEscalationCount}
          stagedEmailCount={communications.length}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen ${isStaffView ? "lg:ml-[280px]" : "w-full"}`}>
        {/* Top App Bar */}
        <TopAppBar
          currentPersona={currentPersona}
          onSelectPersona={setCurrentPersona}
          title={pageTitle}
          subtitle={activeJob.title}
          jobs={jobs}
          activeJobId={activeJobId}
          onSelectJob={handleSelectJob}
          onResetData={handleResetData}
        />

        {/* Dynamic Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* 5-Step Job Creation Wizard Overlay */}
          {isJobWizardOpen ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                <h2 className="font-headline font-bold text-lg text-primary">Job Creation — Step-by-Step Rubric Builder</h2>
                <button
                  onClick={() => setIsJobWizardOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant text-xs text-on-surface-variant hover:bg-surface font-semibold"
                >
                  Exit Wizard
                </button>
              </div>
              <HMJobCreationWizard
                onJobCreated={(newJob) => {
                  loadData();
                  setIsJobWizardOpen(false);
                  setHmTab("rubric");
                }}
                onCancel={() => setIsJobWizardOpen(false)}
              />
            </div>
          ) : (
            <>
              {/* PERSONA 1: APPLICANT PORTAL */}
              {currentPersona === "applicant" && (
                <ApplicantPortal
                  jobs={jobs}
                  applications={applications}
                  onApplicationSubmitted={() => loadData()}
                />
              )}

              {/* PERSONA 2: HIRING MANAGER WORKSPACE */}
              {currentPersona === "hiring_manager" && (
                <div className="space-y-6">
                  {hmTab === "rubric" && (
                    <HMJobRubricSetup
                      jobs={jobs}
                      activeJob={activeJob}
                      onJobUpdated={() => loadData()}
                      onOpenWizard={() => setIsJobWizardOpen(true)}
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

              {/* PERSONA 3: HR / ADMIN GOVERNANCE PORTAL */}
              {currentPersona === "hr_admin" && (
                <div className="space-y-6">
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
            </>
          )}
        </main>
      </div>

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
