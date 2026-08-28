"use client";

import React, { useState } from "react";
import {
  Award,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Job, CandidateApplication, HiringProposal } from "@/lib/types";
import { StorageService } from "@/lib/storage";
import { ScoringService } from "@/lib/scoring";

interface HMRankingAndProposalProps {
  job: Job;
  applications: CandidateApplication[];
  onApplicationUpdated: () => void;
  onNavigateToHRReport: () => void;
}

export const HMRankingAndProposal: React.FC<HMRankingAndProposalProps> = ({
  job,
  applications,
  onApplicationUpdated,
  onNavigateToHRReport,
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [proposal, setProposal] = useState<HiringProposal>("Selected");
  const [proposalReason, setProposalReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ranked candidates in active job
  const jobApps = applications.filter((a) => a.jobId === job.id);
  const rankedApps = [...jobApps].sort((a, b) => {
    const scoreA = a.finalProposal?.officialCompositeScore || a.round1Scorecard?.hmTotalScore || a.shortlisting?.ruleBasedScore || 0;
    const scoreB = b.finalProposal?.officialCompositeScore || b.round1Scorecard?.hmTotalScore || b.shortlisting?.ruleBasedScore || 0;
    return scoreB - scoreA;
  });

  const activeApp = jobApps.find((a) => a.id === selectedAppId) || rankedApps[0];

  const handleSubmitProposal = (app: CandidateApplication) => {
    if (!proposalReason.trim()) {
      alert("A written job-related justification is required for all hiring proposals.");
      return;
    }

    setIsSubmitting(true);

    const officialComposite = ScoringService.calculateFinalCompositeScore(
      job,
      app.round1Scorecard?.hmTotalScore,
      app.round2Scorecard?.hmTotalScore
    );

    const aiComposite = ScoringService.calculateFinalCompositeScore(
      job,
      app.round1Scorecard?.geminiTotalScore,
      app.round2Scorecard?.geminiTotalScore
    );

    let nextInternalStatus = app.internalStatus;
    let nextApplicantStatus = app.applicantFacingStatus;

    if (proposal === "Selected") {
      nextInternalStatus = "selected";
      nextApplicantStatus = "Selected — Pending Final HR Governance";
    } else if (proposal === "Waitlisted") {
      nextInternalStatus = "waitlisted";
      nextApplicantStatus = "Waitlisted for Vacancy";
    } else {
      nextInternalStatus = "rejected";
      nextApplicantStatus = "Not Selected";
    }

    const updatedApp: CandidateApplication = {
      ...app,
      internalStatus: nextInternalStatus,
      applicantFacingStatus: nextApplicantStatus,
      finalProposal: {
        hiringManagerRecommendation: proposal,
        hiringManagerReason: proposalReason.trim(),
        officialCompositeScore: officialComposite,
        aiCompositeScore: aiComposite,
      },
    };

    StorageService.updateApplication(updatedApp);

    // Check automatic escalation triggers (e.g. if lower-ranked candidate is proposed over higher-ranked)
    const escalation = ScoringService.checkAutomaticEscalationTriggers(job, updatedApp, jobApps);
    if (escalation) {
      StorageService.addEscalation(escalation);
    }

    StorageService.logAuditEvent(
      "Hiring Manager",
      "Hiring Manager",
      `Submitted Hiring Proposal (${proposal})`,
      app.id,
      `Proposed outcome: ${proposal}. Official Score: ${officialComposite}%. Reason: "${proposalReason}"`,
      proposalReason
    );

    setIsSubmitting(false);
    setProposalReason("");
    onApplicationUpdated();
  };

  if (jobApps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
        <Award className="w-10 h-10 text-slate-600 mb-2 mx-auto" />
        <h3 className="font-display font-bold text-white text-base">No Evaluated Candidates</h3>
        <p className="text-xs text-slate-400 mt-1">Submit applications and run evaluations to generate candidate rankings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Stage 4: Official Rankings & Hiring Proposals
            </span>
            <span className="text-xs text-slate-400 font-medium">{job.title}</span>
          </div>
          <h1 className="text-xl font-bold font-display text-white">
            Candidate Ranking Matrix ({rankedApps.length} Candidates)
          </h1>
        </div>

        <button
          onClick={onNavigateToHRReport}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all shrink-0"
        >
          <FileCheck className="w-4 h-4" />
          <span>Generate Job-Level Audit PDF</span>
        </button>
      </div>

      {/* Rankings Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">Candidate Code</th>
                <th className="pb-3">Current Stage</th>
                <th className="pb-3">Round 1 (HM / AI)</th>
                <th className="pb-3">Round 2 (HM / AI)</th>
                <th className="pb-3">Official Composite</th>
                <th className="pb-3">HM Proposal</th>
                <th className="pb-3 pr-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {rankedApps.map((app, index) => {
                const r1HM = app.round1Scorecard?.hmTotalScore || "-";
                const r1AI = app.round1Scorecard?.geminiTotalScore || "-";
                const r2HM = app.round2Scorecard?.hmTotalScore || "-";
                const r2AI = app.round2Scorecard?.geminiTotalScore || "-";
                const composite =
                  app.finalProposal?.officialCompositeScore ||
                  app.round1Scorecard?.hmTotalScore ||
                  app.shortlisting?.ruleBasedScore ||
                  "-";

                const isSelected = app.finalProposal?.hiringManagerRecommendation === "Selected";

                return (
                  <tr key={app.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3.5 pl-2 font-bold text-white">#{index + 1}</td>
                    <td className="py-3.5">
                      <span className="font-semibold text-white">{app.anonymizedId}</span>
                    </td>
                    <td className="py-3.5 text-slate-400">{app.stage}</td>
                    <td className="py-3.5 text-slate-300">
                      {r1HM}% <span className="text-slate-500">/ {r1AI}%</span>
                    </td>
                    <td className="py-3.5 text-slate-300">
                      {r2HM}% <span className="text-slate-500">/ {r2AI}%</span>
                    </td>
                    <td className="py-3.5">
                      <span className="text-sm font-bold text-emerald-400 font-display">
                        {composite}%
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : app.finalProposal
                            ? "bg-slate-800 text-slate-300 border border-slate-700"
                            : "bg-slate-950 text-slate-500"
                        }`}
                      >
                        {app.finalProposal?.hiringManagerRecommendation || "Pending"}
                      </span>
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <button
                        onClick={() => {
                          setSelectedAppId(app.id);
                          setProposal(app.finalProposal?.hiringManagerRecommendation || "Selected");
                          setProposalReason(app.finalProposal?.hiringManagerReason || "");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all"
                      >
                        Submit Proposal
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proposal Submission Panel */}
      {activeApp && (
        <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-display font-bold text-sm text-white">
                Submit Official Hiring Recommendation for {activeApp.anonymizedId}
              </h3>
              <p className="text-xs text-slate-400">
                Official recommendations are routed to HR/Admin governance for review and final hiring outcome authorization.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              Vacancies: {job.vacancies}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hiring Manager Recommendation *
              </label>
              <select
                value={proposal}
                onChange={(e) => setProposal(e.target.value as HiringProposal)}
                className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Selected">Selected (Offer Recommendation)</option>
                <option value="Waitlisted">Waitlisted (Alternate)</option>
                <option value="Not Selected">Not Selected (Reject)</option>
              </select>
            </div>

            <div className="md:col-span-6">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Job-Related Justification & Evidence Rationale *
              </label>
              <input
                type="text"
                value={proposalReason}
                onChange={(e) => setProposalReason(e.target.value)}
                placeholder="Detail the candidate's demonstrated competency and rubric alignment..."
                className="w-full bg-slate-950 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                onClick={() => handleSubmitProposal(activeApp)}
                disabled={isSubmitting || !proposalReason.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit to HR</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HMRankingAndProposal;
