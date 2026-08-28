"use client";

import React, { useState } from "react";
import {
  Mic,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Quote,
  Save
} from "lucide-react";
import { Job, CandidateApplication, Round1Scorecard, DiscrepancyLevel } from "@/lib/types";
import { GeminiClientService } from "@/lib/gemini";
import { ScoringService } from "@/lib/scoring";
import { StorageService } from "@/lib/storage";

interface HMInterviewEvaluationProps {
  job: Job;
  applications: CandidateApplication[];
  onApplicationUpdated: () => void;
}

export const HMInterviewEvaluation: React.FC<HMInterviewEvaluationProps> = ({
  job,
  applications,
  onApplicationUpdated,
}) => {
  // Only candidates in Round 1 Interview or beyond
  const round1Apps = applications.filter(
    (a) => a.jobId === job.id && (a.stage === "Round 1 Interview" || a.round1Scorecard !== undefined)
  );

  const [selectedAppId, setSelectedAppId] = useState<string>(round1Apps[0]?.id || "");
  const activeApp = round1Apps.find((a) => a.id === selectedAppId) || round1Apps[0];

  const [transcriptText, setTranscriptText] = useState(
    activeApp?.round1Scorecard?.transcriptText ||
      `Interviewer: Let's discuss system architecture. How would you design a real-time collaborative document synchronization system?\nCandidate: I would use CRDTs (Conflict-free Replicated Data Types) for local convergence, connected via WebSocket gateway clusters with Redis Pub/Sub for delta broadcasting. For durability, mutations are batched and asynchronously persisted to PostgreSQL.\nInterviewer: How do you handle database write bottlenecks under heavy concurrent edits?\nCandidate: We decouple writes using an asynchronous worker queue with BullMQ and PgBouncer connection pooling with optimistic concurrency versioning.`
  );

  // HM Marks State
  const [hmMarks, setHmMarks] = useState<Record<string, number>>(() => {
    if (activeApp?.round1Scorecard?.hmMarks) return activeApp.round1Scorecard.hmMarks;
    const initial: Record<string, number> = {};
    job.criteria.forEach((c) => (initial[c.id] = 85));
    return initial;
  });

  const [hmReasons, setHmReasons] = useState<Record<string, string>>(() => {
    if (activeApp?.round1Scorecard?.hmReasons) return activeApp.round1Scorecard.hmReasons;
    const initial: Record<string, string> = {};
    job.criteria.forEach((c) => (initial[c.id] = "Demonstrated clear understanding and practical production experience."));
    return initial;
  });

  const [discrepancyJustification, setDiscrepancyJustification] = useState(
    activeApp?.round1Scorecard?.hmDiscrepancyJustification || ""
  );

  const [isValidating, setIsValidating] = useState(false);

  const handleRunAiValidation = async () => {
    if (!activeApp || !transcriptText.trim()) return;
    setIsValidating(true);
    try {
      const { geminiMarks, geminiCitations } = await GeminiClientService.validateInterviewTranscript(
        transcriptText,
        job
      );

      const hmTotal = ScoringService.calculateWeightedScore(hmMarks, job.criteria);
      const geminiTotal = ScoringService.calculateWeightedScore(geminiMarks, job.criteria);
      const { delta, discrepancyLevel, requiresEscalation } = ScoringService.classifyDiscrepancy(
        hmTotal,
        geminiTotal
      );

      const scorecard: Round1Scorecard = {
        transcriptText,
        hmMarks,
        hmReasons,
        hmTotalScore: hmTotal,
        geminiMarks,
        geminiCitations,
        geminiTotalScore: geminiTotal,
        delta,
        discrepancyLevel,
        hmDiscrepancyJustification: discrepancyJustification.trim() || undefined,
        isEscalated: requiresEscalation,
        completedAt: new Date().toISOString(),
      };

      const updatedApp: CandidateApplication = {
        ...activeApp,
        round1Scorecard: scorecard,
      };

      StorageService.updateApplication(updatedApp);

      // Auto-escalate if significant discrepancy without justification
      if (requiresEscalation && !discrepancyJustification.trim()) {
        StorageService.addEscalation({
          id: `esc-${Date.now()}`,
          jobId: job.id,
          jobTitle: job.title,
          candidateId: activeApp.id,
          candidateAnonymizedId: activeApp.anonymizedId,
          triggerType: "Score Discrepancy > 25%",
          description: `Round 1 Interview score divergence of ${delta}% between HM (${hmTotal}) and Gemini Independent Validator (${geminiTotal}).`,
          severity: "High",
          status: "pending",
          createdAt: new Date().toISOString(),
        });
      }

      onApplicationUpdated();
    } catch (err) {
      console.error("Round 1 validation failed:", err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleAdvanceToRound2 = () => {
    if (!activeApp || !activeApp.round1Scorecard) return;

    const updatedApp: CandidateApplication = {
      ...activeApp,
      stage: "Round 2 Assignment",
      internalStatus: "round1_completed",
      applicantFacingStatus: "Advance to Round 2",
    };

    StorageService.updateApplication(updatedApp);

    StorageService.stageCommunication(
      activeApp.identityVault.email,
      activeApp.anonymizedId,
      "Round 1 Outcome & Next Steps",
      `Advance to Round 2 for ${activeApp.anonymizedId}`,
      `Dear Candidate,\n\nCongratulations on completing your Round 1 Technical Interview for ${job.title}. Your results have been reviewed and advanced to Round 2 (Role-Related Assignment).\n\nYou will receive your assignment brief and submission link shortly.`
    );

    onApplicationUpdated();
  };

  if (round1Apps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <Mic className="w-10 h-10 text-slate-600 mb-3" />
        <h3 className="font-display font-bold text-white text-base">No Candidates in Round 1 Interview</h3>
        <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
          Go to <strong className="text-indigo-300">Stage 1: Shortlisting</strong> to evaluate incoming applications and advance candidates to Round 1.
        </p>
      </div>
    );
  }

  const scorecard = activeApp.round1Scorecard;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Stage 2: Round 1 Structured Interview Evaluation
            </span>
            <span className="text-xs text-slate-400 font-medium">{job.title}</span>
          </div>
          <h1 className="text-xl font-bold font-display text-white">
            Transcript Review & Dual-Score Validation
          </h1>
        </div>

        {/* Candidate Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Candidate:</span>
          <select
            value={activeApp?.id}
            onChange={(e) => {
              setSelectedAppId(e.target.value);
              const found = round1Apps.find((a) => a.id === e.target.value);
              if (found?.round1Scorecard) {
                setTranscriptText(found.round1Scorecard.transcriptText);
                setHmMarks(found.round1Scorecard.hmMarks);
                setHmReasons(found.round1Scorecard.hmReasons);
              }
            }}
            className="bg-slate-900 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {round1Apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.anonymizedId} ({a.stage})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Discrepancy Status Banner (If Scorecard Exists) */}
      {scorecard && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            scorecard.discrepancyLevel === "Aligned"
              ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
              : scorecard.discrepancyLevel === "Minor Difference"
              ? "bg-amber-950/20 border-amber-500/40 text-amber-300"
              : "bg-red-950/30 border-red-500/50 text-red-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {scorecard.discrepancyLevel === "Aligned" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : scorecard.discrepancyLevel === "Minor Difference" ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs">
                  Dual-Score Discrepancy Level: {scorecard.discrepancyLevel.toUpperCase()} (Delta: {scorecard.delta}%)
                </span>
              </div>
              <p className="text-[11px] opacity-90 mt-0.5">
                Hiring Manager Official Score: <strong>{scorecard.hmTotalScore}%</strong> • Gemini Independent Validation: <strong>{scorecard.geminiTotalScore}%</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeApp.stage !== "Round 2 Assignment" && (
              <button
                onClick={handleAdvanceToRound2}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
              >
                <span>Advance to Round 2 Assignment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Scoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interview Transcript */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="font-display font-semibold text-xs text-white">Interview Transcript</h3>
              </div>
              <span className="text-[10px] text-slate-400">Paste approved transcript</span>
            </div>

            <textarea
              rows={16}
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder="Paste dialogue transcript between Hiring Manager and Candidate..."
              className="w-full bg-slate-950 text-slate-200 font-mono text-xs p-3.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Right Column: HM Criterion Marks Entry vs Gemini Validations */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-semibold text-xs text-white">
                Hiring Manager Official Rubric Scoring (Human Marks are Official)
              </h3>
            </div>

            <div className="space-y-4">
              {job.criteria.map((crit) => {
                const hmMark = hmMarks[crit.id] ?? 80;
                const geminiMark = scorecard?.geminiMarks?.[crit.id];
                const citations = scorecard?.geminiCitations?.[crit.id] || [];

                return (
                  <div key={crit.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-xs text-white">{crit.name}</h4>
                        <span className="text-[10px] text-slate-500">{crit.description}</span>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {crit.weight}% Weight
                      </span>
                    </div>

                    {/* HM Score Slider/Input */}
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-8 flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 shrink-0 font-medium">HM Mark:</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={hmMark}
                          onChange={(e) =>
                            setHmMarks({ ...hmMarks, [crit.id]: Number(e.target.value) })
                          }
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>
                      <div className="col-span-4 flex items-center justify-end gap-2">
                        <span className="text-sm font-bold text-white">{hmMark}%</span>
                        {geminiMark !== undefined && (
                          <span className="text-xs font-bold text-indigo-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800" title="Gemini Validation Mark">
                            AI: {geminiMark}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* HM Reason Note */}
                    <input
                      type="text"
                      value={hmReasons[crit.id] || ""}
                      onChange={(e) =>
                        setHmReasons({ ...hmReasons, [crit.id]: e.target.value })
                      }
                      placeholder="Brief evidence-based justification for this mark..."
                      className="w-full bg-slate-900 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />

                    {/* Gemini Citations / Excerpts if available */}
                    {citations.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-indigo-300 space-y-1">
                        <span className="font-semibold flex items-center gap-1">
                          <Quote className="w-3 h-3 text-indigo-400" />
                          Gemini Independent Quoted Excerpt:
                        </span>
                        {citations.map((cite, cIdx) => (
                          <p key={cIdx} className="italic opacity-90">
                            "{cite}"
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* If Discrepancy > 25%, require written justification */}
            {scorecard && scorecard.delta > 25 && (
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
                <span className="text-xs font-bold text-red-300 block">
                  ⚠️ Significant Discrepancy ({scorecard.delta}% Delta) — Justification Required
                </span>
                <textarea
                  rows={2}
                  value={discrepancyJustification}
                  onChange={(e) => setDiscrepancyJustification(e.target.value)}
                  placeholder="Provide explicit job-related reasoning explaining why human marks diverged from Gemini validation..."
                  className="w-full bg-slate-950 text-slate-200 text-xs p-2.5 rounded-xl border border-red-500/30 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            )}

            {/* Validation Action Trigger */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Trigger Gemini to independently score transcript & compute discrepancy
              </span>
              <button
                onClick={handleRunAiValidation}
                disabled={isValidating || !transcriptText.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
              >
                {isValidating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Scoring with Independent AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Gemini Independent Validation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HMInterviewEvaluation;
