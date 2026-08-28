"use client";

import React, { useState } from "react";
import {
  FileCode,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Send,
  Award
} from "lucide-react";
import { Job, CandidateApplication, Round2Scorecard } from "@/lib/types";
import { GeminiClientService } from "@/lib/gemini";
import { ScoringService } from "@/lib/scoring";
import { StorageService } from "@/lib/storage";

interface HMAssignmentEvaluationProps {
  job: Job;
  applications: CandidateApplication[];
  onApplicationUpdated: () => void;
  onNavigateToProposal: () => void;
}

export const HMAssignmentEvaluation: React.FC<HMAssignmentEvaluationProps> = ({
  job,
  applications,
  onApplicationUpdated,
  onNavigateToProposal,
}) => {
  const round2Apps = applications.filter(
    (a) => a.jobId === job.id && (a.stage === "Round 2 Assignment" || a.round2Scorecard !== undefined || a.stage === "Decision & Governance")
  );

  const [selectedAppId, setSelectedAppId] = useState<string>(round2Apps[0]?.id || "");
  const activeApp = round2Apps.find((a) => a.id === selectedAppId) || round2Apps[0];

  const [promptText, setPromptText] = useState(
    "Design and implement a high-throughput, low-latency API rate-limiting middleware in TypeScript using Redis token bucket algorithm."
  );

  const [artifactText, setArtifactText] = useState(
    activeApp?.round2Scorecard?.submissionArtifactText ||
      `// High-Throughput Redis Token Bucket Rate Limiter
import Redis from "ioredis";

export class TokenBucketRateLimiter {
  private redis: Redis;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  async isAllowed(key: string, capacity: number, refillRatePerSec: number): Promise<{ allowed: boolean; remaining: number }> {
    const luaScript = \`
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])

      local data = redis.call("HMGET", key, "tokens", "lastRefill")
      local tokens = tonumber(data[1]) or capacity
      local lastRefill = tonumber(data[2]) or now

      local elapsed = math.max(0, now - lastRefill)
      tokens = math.min(capacity, tokens + elapsed * refillRate)

      if tokens >= 1 then
        tokens = tokens - 1
        redis.call("HMSET", key, "tokens", tokens, "lastRefill", now)
        redis.call("EXPIRE", key, 3600)
        return {1, math.floor(tokens)}
      else
        return {0, 0}
      end
    \`;

    const nowSec = Math.floor(Date.now() / 1000);
    const result = await this.redis.eval(luaScript, 1, key, capacity, refillRatePerSec, nowSec) as [number, number];
    return { allowed: result[0] === 1, remaining: result[1] };
  }
}`
  );

  const [hmMarks, setHmMarks] = useState<Record<string, number>>(() => {
    if (activeApp?.round2Scorecard?.hmMarks) return activeApp.round2Scorecard.hmMarks;
    const initial: Record<string, number> = {};
    job.criteria.forEach((c) => (initial[c.id] = 90));
    return initial;
  });

  const [hmReasons, setHmReasons] = useState<Record<string, string>>(() => {
    if (activeApp?.round2Scorecard?.hmReasons) return activeApp.round2Scorecard.hmReasons;
    const initial: Record<string, string> = {};
    job.criteria.forEach((c) => (initial[c.id] = "Atomic Lua script prevents race conditions and ensures sub-millisecond execution."));
    return initial;
  });

  const [isValidating, setIsValidating] = useState(false);

  const handleRunAiValidation = async () => {
    if (!activeApp || !artifactText.trim()) return;
    setIsValidating(true);
    try {
      const { geminiMarks, geminiFeedback } = await GeminiClientService.validateAssignment(
        promptText,
        artifactText,
        job
      );

      const hmTotal = ScoringService.calculateWeightedScore(hmMarks, job.criteria);
      const geminiTotal = ScoringService.calculateWeightedScore(geminiMarks, job.criteria);
      const { delta, discrepancyLevel, requiresEscalation } = ScoringService.classifyDiscrepancy(
        hmTotal,
        geminiTotal
      );

      const scorecard: Round2Scorecard = {
        assignmentPrompt: promptText,
        submissionArtifactText: artifactText,
        submittedAt: new Date().toISOString(),
        hmMarks,
        hmReasons,
        hmTotalScore: hmTotal,
        geminiMarks,
        geminiFeedback,
        geminiTotalScore: geminiTotal,
        delta,
        discrepancyLevel,
        isEscalated: requiresEscalation,
        completedAt: new Date().toISOString(),
      };

      const finalCompositeScore = ScoringService.calculateFinalCompositeScore(
        job,
        activeApp.round1Scorecard?.hmTotalScore || 85,
        hmTotal
      );

      const aiComposite = ScoringService.calculateFinalCompositeScore(
        job,
        activeApp.round1Scorecard?.geminiTotalScore || 85,
        geminiTotal
      );

      const updatedApp: CandidateApplication = {
        ...activeApp,
        stage: "Decision & Governance",
        internalStatus: "round2_completed",
        applicantFacingStatus: "Under Final Committee Review",
        round2Scorecard: scorecard,
        finalProposal: {
          hiringManagerRecommendation: finalCompositeScore >= 88 ? "Selected" : "Waitlisted",
          hiringManagerReason: `Completed Round 1 (Score: ${activeApp.round1Scorecard?.hmTotalScore || 85}) and Round 2 Assignment (Score: ${hmTotal}) with high technical proficiency.`,
          officialCompositeScore: finalCompositeScore,
          aiCompositeScore: aiComposite,
        },
      };

      StorageService.updateApplication(updatedApp);
      onApplicationUpdated();
    } catch (err) {
      console.error("Round 2 validation failed:", err);
    } finally {
      setIsValidating(false);
    }
  };

  if (round2Apps.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/50 p-12 text-center flex flex-col items-center justify-center min-h-[380px] shadow-subtle">
        <FileCode className="w-10 h-10 text-on-surface-variant mb-2" />
        <h3 className="font-headline font-bold text-primary text-base">No Candidates in Round 2 Assignment</h3>
        <p className="text-xs text-on-surface-variant max-w-md mt-1 mb-4">
          Advance candidates from <strong className="text-secondary">Round 1 Interview</strong> to evaluate role-related coding tasks and case studies.
        </p>
      </div>
    );
  }

  const scorecard = activeApp.round2Scorecard;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-secondary/10 text-secondary border border-secondary/20">
              Stage 3: Round 2 Assignment & Coding Evaluation
            </span>
            <span className="text-xs text-on-surface-variant font-medium">{job.title}</span>
          </div>
          <h1 className="font-headline font-bold text-xl text-primary">
            Assignment Artifact Scoring & Dual Validation
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={activeApp?.id}
            onChange={(e) => {
              setSelectedAppId(e.target.value);
              const found = round2Apps.find((a) => a.id === e.target.value);
              if (found?.round2Scorecard) {
                setArtifactText(found.round2Scorecard.submissionArtifactText);
                setHmMarks(found.round2Scorecard.hmMarks);
                setHmReasons(found.round2Scorecard.hmReasons);
              }
            }}
            className="bg-surface-container-lowest text-primary text-xs font-semibold px-3 py-2 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-subtle cursor-pointer"
          >
            {round2Apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.anonymizedId} ({a.stage})
              </option>
            ))}
          </select>

          {activeApp.round2Scorecard && (
            <button
              onClick={onNavigateToProposal}
              className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary-container text-white text-xs font-semibold shadow-subtle flex items-center gap-1.5 transition-all"
            >
              <span>View Rankings & Proposal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Discrepancy Status Banner */}
      {scorecard && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle ${
            scorecard.discrepancyLevel === "Aligned"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : scorecard.discrepancyLevel === "Minor Difference"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-headline font-bold text-xs">
                Round 2 Discrepancy: {scorecard.discrepancyLevel.toUpperCase()} (Delta: {scorecard.delta}%)
              </span>
              <p className="text-[11px] opacity-90 mt-0.5">
                HM Score: <strong>{scorecard.hmTotalScore}%</strong> • Gemini Validation: <strong>{scorecard.geminiTotalScore}%</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Artifact & Prompt */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-subtle space-y-3">
            <div className="pb-2 border-b border-outline-variant/30">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                Standardized Assignment Prompt
              </span>
              <p className="text-xs text-primary font-medium mt-1">{promptText}</p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block mb-1.5">
                Candidate Submitted Artifact
              </span>
              <textarea
                rows={16}
                value={artifactText}
                onChange={(e) => setArtifactText(e.target.value)}
                className="w-full bg-surface text-primary font-mono text-xs p-3.5 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20 resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right: Scoring */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-subtle space-y-4">
            <h3 className="font-headline font-bold text-xs text-primary pb-3 border-b border-outline-variant/30">
              Hiring Manager Assignment Rubric Scoring
            </h3>

            <div className="space-y-4">
              {job.criteria.map((crit) => {
                const hmMark = hmMarks[crit.id] ?? 85;
                const geminiMark = scorecard?.geminiMarks?.[crit.id];
                const feedback = scorecard?.geminiFeedback?.[crit.id];

                return (
                  <div key={crit.id} className="p-4 rounded-lg bg-surface border border-outline-variant/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline font-bold text-xs text-primary">{crit.name}</h4>
                      <span className="text-[11px] font-bold text-secondary">
                        {crit.weight}% Weight
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-8 flex items-center gap-3">
                        <span className="text-[11px] text-on-surface-variant shrink-0 font-medium">HM Mark:</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={hmMark}
                          onChange={(e) =>
                            setHmMarks({ ...hmMarks, [crit.id]: Number(e.target.value) })
                          }
                          className="w-full accent-secondary cursor-pointer"
                        />
                      </div>
                      <div className="col-span-4 flex items-center justify-end gap-2">
                        <span className="text-sm font-headline font-bold text-primary">{hmMark}%</span>
                        {geminiMark !== undefined && (
                          <span className="text-xs font-bold text-secondary bg-surface-container px-2 py-0.5 rounded border border-outline-variant/30">
                            AI: {geminiMark}%
                          </span>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={hmReasons[crit.id] || ""}
                      onChange={(e) =>
                        setHmReasons({ ...hmReasons, [crit.id]: e.target.value })
                      }
                      placeholder="Evidence reason for this mark..."
                      className="w-full bg-surface-container-lowest text-primary text-xs px-3 py-2 rounded-md border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />

                    {feedback && (
                      <p className="text-[11px] text-secondary bg-secondary-container/10 p-2 rounded-md border border-secondary/20 italic">
                        AI Validator: "{feedback}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">
                Run Gemini validation and synthesize composite ranking
              </span>
              <button
                onClick={handleRunAiValidation}
                disabled={isValidating || !artifactText.trim()}
                className="px-6 py-2.5 rounded-lg bg-secondary hover:bg-secondary-container text-white font-bold text-xs shadow-subtle flex items-center gap-2 transition-all hover:scale-[1.01]"
              >
                {isValidating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Validating Assignment...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Gemini Assignment Validation</span>
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

export default HMAssignmentEvaluation;
