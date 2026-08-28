"use client";

import React, { useState } from "react";
import {
  FileSearch,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  HelpCircle,
  Eye,
  Check,
  X
} from "lucide-react";
import { Job, CandidateApplication, ShortlistingAssessment } from "@/lib/types";
import { GeminiClientService } from "@/lib/gemini";
import { StorageService } from "@/lib/storage";

interface HMShortlistingProps {
  job: Job;
  applications: CandidateApplication[];
  onApplicationUpdated: () => void;
}

export const HMShortlisting: React.FC<HMShortlistingProps> = ({
  job,
  applications,
  onApplicationUpdated,
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string>(applications[0]?.id || "");
  const [isValidating, setIsValidating] = useState(false);

  // Override / Decision Modal
  const [isDeciding, setIsDeciding] = useState(false);
  const [decisionType, setDecisionType] = useState<"Advance to Round 1" | "Hold" | "Not Advancing">("Advance to Round 1");
  const [overrideReason, setOverrideReason] = useState("");

  const jobApps = applications.filter((a) => a.jobId === job.id);
  const activeApp = jobApps.find((a) => a.id === selectedAppId) || jobApps[0];

  const handleRunShortlistValidation = async () => {
    if (!activeApp) return;
    setIsValidating(true);
    try {
      const result = await GeminiClientService.validateShortlist(
        activeApp.rawResumeText,
        job,
        activeApp.linkedInExportText
      );

      const shortlistingData: ShortlistingAssessment = {
        ...result,
        hmDecision: result.geminiRecommendation === "Advance" ? "Advance to Round 1" : "Hold",
        evaluatedAt: new Date().toISOString(),
      };

      const updatedApp: CandidateApplication = {
        ...activeApp,
        shortlisting: shortlistingData,
      };

      StorageService.updateApplication(updatedApp);
      onApplicationUpdated();
    } catch (err) {
      console.error("Shortlisting validation failed:", err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRecordHMDecision = () => {
    if (!activeApp || !activeApp.shortlisting) return;

    const isOverride =
      (decisionType === "Advance to Round 1" && activeApp.shortlisting.geminiRecommendation === "Not Advance") ||
      (decisionType === "Not Advancing" && activeApp.shortlisting.geminiRecommendation === "Advance");

    if (isOverride && !overrideReason.trim()) {
      alert("A written job-related justification is required when overriding Gemini's recommendation.");
      return;
    }

    let nextStage = activeApp.stage;
    let nextInternalStatus = activeApp.internalStatus;
    let nextApplicantStatus = activeApp.applicantFacingStatus;

    if (decisionType === "Advance to Round 1") {
      nextStage = "Round 1 Interview";
      nextInternalStatus = "shortlisted";
      nextApplicantStatus = "Advance to Round 1";
      StorageService.stageCommunication(
        activeApp.identityVault.email,
        activeApp.anonymizedId,
        "Shortlisting Result",
        `Update on your application (${activeApp.anonymizedId})`,
        `Dear Candidate,\n\nWe are pleased to inform you that your profile has been advanced to Round 1 Structured Interview for the ${job.title} role.\n\nOur team will coordinate interview scheduling shortly.`
      );
    } else if (decisionType === "Hold") {
      nextInternalStatus = "hold";
      nextApplicantStatus = "Application on Hold";
      StorageService.stageCommunication(
        activeApp.identityVault.email,
        activeApp.anonymizedId,
        "Application Status",
        `Update regarding your application (${activeApp.anonymizedId})`,
        `Dear Candidate,\n\nYour application for ${job.title} is currently on hold while we review remaining submissions.`
      );
    } else {
      nextInternalStatus = "not_shortlisted";
      nextApplicantStatus = "Not Advancing";
      StorageService.stageCommunication(
        activeApp.identityVault.email,
        activeApp.anonymizedId,
        "Application Outcome",
        `Update regarding your application (${activeApp.anonymizedId})`,
        `Dear Candidate,\n\nThank you for your interest in the ${job.title} role. We have decided not to advance your application further at this stage.`
      );
    }

    const updatedShortlisting: ShortlistingAssessment = {
      ...activeApp.shortlisting,
      hmDecision: decisionType,
      hmOverrideReason: isOverride ? overrideReason.trim() : undefined,
      evaluatedAt: new Date().toISOString(),
    };

    const updatedApp: CandidateApplication = {
      ...activeApp,
      stage: nextStage,
      internalStatus: nextInternalStatus,
      applicantFacingStatus: nextApplicantStatus,
      shortlisting: updatedShortlisting,
    };

    StorageService.updateApplication(updatedApp);

    if (isOverride) {
      StorageService.logAuditEvent(
        "Hiring Manager",
        "Hiring Manager",
        "Shortlisting Override Recorded",
        activeApp.id,
        `Overrode Gemini recommendation to "${decisionType}". Reason: "${overrideReason}"`,
        overrideReason
      );
    }

    setIsDeciding(false);
    setOverrideReason("");
    onApplicationUpdated();
  };

  if (jobApps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <FileSearch className="w-10 h-10 text-slate-600 mb-3" />
        <h3 className="font-display font-bold text-white text-base">No Applications Received Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
          Open the <strong className="text-indigo-300">Applicant Portal</strong> to submit a live application for {job.title}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Stage 1: Anonymized Preliminary Shortlisting
            </span>
            <span className="text-xs text-slate-400 font-medium">{job.title}</span>
          </div>
          <h1 className="text-xl font-bold font-display text-white">
            Candidate Evidence Review ({jobApps.length} Received)
          </h1>
        </div>

        {/* Candidate Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Selecting:</span>
          <select
            value={activeApp?.id}
            onChange={(e) => setSelectedAppId(e.target.value)}
            className="bg-slate-900 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {jobApps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.anonymizedId} ({a.stage})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Anonymized Resume Evidence */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{activeApp.anonymizedId}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Identity Vault Masked
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Applied {new Date(activeApp.appliedDate).toLocaleDateString()}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Candidate Submitted Resume (Anonymized Evidence)
              </label>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 max-h-[360px] overflow-y-auto leading-relaxed whitespace-pre-wrap">
                {activeApp.rawResumeText}
              </div>
            </div>

            {activeApp.linkedInExportText && (
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Supplementary LinkedIn Export Evidence
                </label>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-400 max-h-[120px] overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {activeApp.linkedInExportText}
                </div>
              </div>
            )}

            {/* AI Shortlist Trigger */}
            {!activeApp.shortlisting && (
              <button
                onClick={handleRunShortlistValidation}
                disabled={isValidating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
              >
                {isValidating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Running Gemini Independent Shortlist Validation...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Gemini AI Shortlist Validation</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: AI Independent Validation & HM Official Decision */}
        <div className="lg:col-span-6 space-y-4">
          {activeApp.shortlisting ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-5 animate-fadeIn">
              {/* Validation Summary */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Gemini Recommendation
                  </span>
                  <span
                    className={`text-base font-bold font-display ${
                      activeApp.shortlisting.geminiRecommendation === "Advance"
                        ? "text-emerald-400"
                        : activeApp.shortlisting.geminiRecommendation === "Hold"
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {activeApp.shortlisting.geminiRecommendation.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-xl font-bold font-display text-indigo-400">
                      {activeApp.shortlisting.geminiFitScore}%
                    </span>
                    <p className="text-[9px] text-slate-500 uppercase font-semibold">AI Fit Score</p>
                  </div>
                  <div>
                    <span className="text-xl font-bold font-display text-slate-200">
                      {activeApp.shortlisting.ruleBasedScore}%
                    </span>
                    <p className="text-[9px] text-slate-500 uppercase font-semibold">Rule Score</p>
                  </div>
                </div>
              </div>

              {/* Skills Verification */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Corroborated Skills Match
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeApp.shortlisting.matchedSkills.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {s}
                    </span>
                  ))}
                  {activeApp.shortlisting.missingSkills.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      {s} (Unverified)
                    </span>
                  ))}
                </div>
              </div>

              {/* Strengths & Human Verification Claims */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                  <span className="font-semibold text-white block mb-1.5 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    Observed Strengths
                  </span>
                  <ul className="space-y-1 text-slate-300">
                    {activeApp.shortlisting.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                  <span className="font-semibold text-amber-300 block mb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    Claims Requiring Human Verification
                  </span>
                  <ul className="space-y-1 text-slate-300">
                    {activeApp.shortlisting.claimsRequiringHumanVerification.map((claim, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{claim}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* HM Official Decision Section */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Hiring Manager Official Decision:
                    </span>
                    <span className="text-xs font-bold text-indigo-400">
                      {activeApp.shortlisting.hmDecision}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setDecisionType(activeApp.shortlisting?.hmDecision || "Advance to Round 1");
                      setIsDeciding(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
                  >
                    Update Official Decision
                  </button>
                </div>

                {activeApp.shortlisting.hmOverrideReason && (
                  <p className="text-[11px] text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    <strong>Recorded Override Rationale:</strong> "{activeApp.shortlisting.hmOverrideReason}"
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[360px] rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center flex flex-col items-center justify-center">
              <Sparkles className="w-8 h-8 text-indigo-400 mb-2" />
              <h4 className="font-display font-semibold text-white text-sm">
                Awaiting Shortlist Validation
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Click "Run Gemini AI Shortlist Validation" on the left to extract skills, calculate match fit, and view Gemini's recommendation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Decision Modal */}
      {isDeciding && activeApp?.shortlisting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 text-slate-100">
            <h3 className="font-display font-bold text-base text-white">
              Record Official Shortlisting Decision
            </h3>
            <p className="text-xs text-slate-400">
              Candidate: <strong className="text-white">{activeApp.anonymizedId}</strong> • Gemini Recommendation: <strong className="text-indigo-300">{activeApp.shortlisting.geminiRecommendation}</strong>
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Select Decision</label>
              <div className="grid grid-cols-3 gap-2">
                {(["Advance to Round 1", "Hold", "Not Advancing"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setDecisionType(opt)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                      decisionType === opt
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Job-Related Override Reason (Required if overriding Gemini)
              </label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain the job-related justification for this decision..."
                className="w-full bg-slate-950 text-slate-200 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDeciding(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordHMDecision}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
              >
                Confirm Official Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HMShortlisting;
