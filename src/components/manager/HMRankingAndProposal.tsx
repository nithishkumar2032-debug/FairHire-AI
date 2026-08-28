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
      <div className="bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/50 p-12 text-center shadow-subtle">
        <Award className="w-10 h-10 text-on-surface-variant mb-2 mx-auto" />
        <h3 className="font-headline font-bold text-primary text-base">No Evaluated Candidates</h3>
        <p className="text-xs text-on-surface-variant mt-1">Submit applications and run evaluations to generate candidate rankings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-secondary/10 text-secondary border border-secondary/20">
              Stage 4: Official Rankings & Hiring Proposals
            </span>
            <span className="text-xs text-on-surface-variant font-medium">{job.title}</span>
          </div>
          <h1 className="font-headline font-bold text-xl text-primary">
            Candidate Ranking Matrix ({rankedApps.length} Candidates)
          </h1>
        </div>

        <button
          onClick={onNavigateToHRReport}
          className="px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-semibold shadow-subtle flex items-center gap-2 transition-all shrink-0"
        >
          <FileCheck className="w-4 h-4" />
          <span>Generate Job Evidence PDF</span>
        </button>
      </div>

      {/* Rankings Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-subtle space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant uppercase tracking-wider text-[10px] font-semibold">
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
            <tbody className="divide-y divide-outline-variant/20">
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
                  <tr key={app.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-3.5 pl-2 font-headline font-bold text-primary">#{index + 1}</td>
                    <td className="py-3.5">
                      <span className="font-semibold text-primary">{app.anonymizedId}</span>
                    </td>
                    <td className="py-3.5 text-on-surface-variant">{app.stage}</td>
                    <td className="py-3.5 text-primary">
                      {r1HM}% <span className="text-on-surface-variant font-normal">/ {r1AI}%</span>
                    </td>
                    <td className="py-3.5 text-primary">
                      {r2HM}% <span className="text-on-surface-variant font-normal">/ {r2AI}%</span>
                    </td>
                    <td className="py-3.5">
                      <span className="text-sm font-headline font-bold text-secondary">
                        {composite}%
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : app.finalProposal
                            ? "bg-surface-container text-on-surface-variant border border-outline-variant/40"
                            : "bg-surface text-on-surface-variant"
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
                        className="px-3 py-1.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-semibold border border-secondary/20 transition-all"
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
        <div className="bg-surface-container-lowest rounded-xl border border-secondary/30 p-6 shadow-subtle space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
            <div>
              <h3 className="font-headline font-bold text-sm text-primary">
                Submit Official Hiring Recommendation for {activeApp.anonymizedId}
              </h3>
              <p className="text-xs text-on-surface-variant">
                Official recommendations are routed to HR/Admin governance for review and final hiring outcome authorization.
              </p>
            </div>
            <span className="text-xs font-bold text-secondary bg-secondary/10 px-2.5 py-1 rounded-lg border border-secondary/20">
              Vacancies: {job.vacancies}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-primary mb-1">
                Hiring Manager Recommendation *
              </label>
              <select
                value={proposal}
                onChange={(e) => setProposal(e.target.value as HiringProposal)}
                className="w-full bg-surface-container-lowest text-primary text-xs px-3 py-2.5 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-subtle"
              >
                <option value="Selected">Selected (Offer Recommendation)</option>
                <option value="Waitlisted">Waitlisted (Alternate)</option>
                <option value="Not Selected">Not Selected (Reject)</option>
              </select>
            </div>

            <div className="md:col-span-6">
              <label className="block text-xs font-semibold text-primary mb-1">
                Job-Related Justification & Evidence Rationale *
              </label>
              <input
                type="text"
                value={proposalReason}
                onChange={(e) => setProposalReason(e.target.value)}
                placeholder="Detail the candidate's demonstrated competency and rubric alignment..."
                className="w-full bg-surface-container-lowest text-primary text-xs px-3.5 py-2.5 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-subtle"
              />
            </div>

            <div className="md:col-span-2">
              <button
                onClick={() => handleSubmitProposal(activeApp)}
                disabled={isSubmitting || !proposalReason.trim()}
                className="w-full py-2.5 rounded-lg bg-secondary hover:bg-secondary-container disabled:opacity-50 text-white text-xs font-bold shadow-subtle flex items-center justify-center gap-1.5 transition-all"
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
