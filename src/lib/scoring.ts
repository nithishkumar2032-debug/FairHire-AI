import { RubricCriterion, DiscrepancyLevel, Job, CandidateApplication, EscalationTicket } from "./types";

export class ScoringService {
  /**
   * Calculates weighted total score for a set of criterion marks
   */
  static calculateWeightedScore(
    marks: Record<string, number>,
    criteria: RubricCriterion[]
  ): number {
    if (!criteria || criteria.length === 0) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;

    criteria.forEach((criterion) => {
      const score = marks[criterion.id] ?? 0;
      totalScore += score * (criterion.weight / 100);
      totalWeight += criterion.weight;
    });

    if (totalWeight === 0) return 0;
    return Math.round((totalScore / totalWeight) * 100);
  }

  /**
   * Classifies discrepancy between Hiring Manager marks and Gemini Independent Validation marks
   */
  static classifyDiscrepancy(hmScore: number, geminiScore: number): {
    delta: number;
    discrepancyLevel: DiscrepancyLevel;
    requiresEscalation: boolean;
  } {
    const delta = Math.abs(hmScore - geminiScore);

    if (delta <= 10) {
      return { delta, discrepancyLevel: "Aligned", requiresEscalation: false };
    } else if (delta <= 25) {
      return { delta, discrepancyLevel: "Minor Difference", requiresEscalation: false };
    } else {
      return { delta, discrepancyLevel: "Significant Discrepancy", requiresEscalation: true };
    }
  }

  /**
   * Calculates official final composite score combining Round 1 and Round 2 weights
   */
  static calculateFinalCompositeScore(
    job: Job,
    round1Score?: number,
    round2Score?: number
  ): number {
    const r1 = round1Score ?? 0;
    const r2 = round2Score ?? 0;
    const r1Weight = job.round1Weight || 50;
    const r2Weight = job.round2Weight || 50;

    return Math.round((r1 * (r1Weight / 100)) + (r2 * (r2Weight / 100)));
  }

  /**
   * Checks if an application decision triggers an automatic escalation
   */
  static checkAutomaticEscalationTriggers(
    job: Job,
    application: CandidateApplication,
    allJobApplications: CandidateApplication[]
  ): EscalationTicket | null {
    // 1. Check for significant Round 1 or Round 2 Discrepancy
    if (application.round1Scorecard && application.round1Scorecard.delta > 25 && !application.round1Scorecard.hmDiscrepancyJustification) {
      return {
        id: `esc-${Date.now()}`,
        jobId: job.id,
        jobTitle: job.title,
        candidateId: application.id,
        candidateAnonymizedId: application.anonymizedId,
        triggerType: "Score Discrepancy > 25%",
        description: `Round 1 Interview score divergence of ${application.round1Scorecard.delta}% (HM: ${application.round1Scorecard.hmTotalScore} vs Gemini: ${application.round1Scorecard.geminiTotalScore}) without written justification.`,
        severity: "High",
        status: "pending",
        createdAt: new Date().toISOString(),
      };
    }

    // 2. Check if a lower-ranked candidate is proposed as Selected over a higher-scoring candidate
    if (application.finalProposal?.hiringManagerRecommendation === "Selected") {
      const thisScore = application.finalProposal.officialCompositeScore;
      const higherScoringRejected = allJobApplications.find(
        (other) =>
          other.id !== application.id &&
          (other.finalProposal?.officialCompositeScore ?? 0) > thisScore + 5 &&
          (other.finalProposal?.hiringManagerRecommendation === "Not Selected" || other.internalStatus === "not_shortlisted")
      );

      if (higherScoringRejected && !application.finalProposal.hiringManagerReason) {
        return {
          id: `esc-${Date.now()}`,
          jobId: job.id,
          jobTitle: job.title,
          candidateId: application.id,
          candidateAnonymizedId: application.anonymizedId,
          triggerType: "Adverse Decision on Top Candidate",
          description: `Candidate selected with score ${thisScore} while higher-scoring candidate (${higherScoringRejected.anonymizedId}, Score: ${higherScoringRejected.finalProposal?.officialCompositeScore}) was not advanced.`,
          severity: "Critical",
          status: "pending",
          createdAt: new Date().toISOString(),
        };
      }
    }

    return null;
  }
}
