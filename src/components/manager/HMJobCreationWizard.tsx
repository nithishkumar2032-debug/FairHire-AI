"use client";

import React, { useState } from "react";
import {
  Check,
  Plus,
  Trash2,
  Lock,
  Scale,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileCheck
} from "lucide-react";
import { Job, RubricCriterion } from "@/lib/types";
import { StorageService } from "@/lib/storage";

interface HMJobCreationWizardProps {
  onJobCreated: (job: Job) => void;
  onCancel: () => void;
}

export const HMJobCreationWizard: React.FC<HMJobCreationWizardProps> = ({
  onJobCreated,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(4); // Default to Step 4 to highlight rubric or Step 1

  // Job Details
  const [title, setTitle] = useState("Lead Machine Learning Systems Engineer");
  const [department, setDepartment] = useState("Engineering");
  const [seniority, setSeniority] = useState<Job["seniority"]>("Senior");
  const [vacancies, setVacancies] = useState(1);
  const [summary, setSummary] = useState(
    "Design and optimize high-throughput, low-latency distributed inference systems with strict auditability and model governance."
  );

  // Requirements
  const [skills, setSkills] = useState("Python, PyTorch, vLLM, Distributed Systems, CUDA, Kubernetes");

  // Scoring Rubric Criteria (Step 4)
  const [criteria, setCriteria] = useState<RubricCriterion[]>([
    {
      id: "c1",
      name: "Technical Competency",
      weight: 40,
      description: "Proficiency in required programming languages, system architecture, and frameworks.",
    },
    {
      id: "c2",
      name: "Communication Skills",
      weight: 30,
      description: "Ability to clearly articulate complex technical trade-offs and collaborate across teams.",
    },
    {
      id: "c3",
      name: "Problem Solving",
      weight: 30,
      description: "Analytical approach to resolving unexpected production bottlenecks and concurrency issues.",
    },
  ]);

  const [shortlistThreshold, setShortlistThreshold] = useState(75);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);

  const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

  const handleUpdateWeight = (id: string, weight: number) => {
    setCriteria(criteria.map((c) => (c.id === id ? { ...c, weight: Math.max(0, weight) } : c)));
  };

  const handleRemoveCriterion = (id: string) => {
    if (criteria.length <= 1) return;
    setCriteria(criteria.filter((c) => c.id !== id));
  };

  const handleAddCriterion = () => {
    const newId = `c-${Date.now()}`;
    setCriteria([
      ...criteria,
      {
        id: newId,
        name: "Role & Culture Alignment",
        weight: 10,
        description: "Execution velocity, testing discipline, and adaptability to team operating norms.",
      },
    ]);
  };

  const handleConfirmAndLock = () => {
    if (totalWeight !== 100) {
      alert("Criterion weights must sum to exactly 100% before locking.");
      return;
    }

    const newJob: Job = {
      id: `job-${Date.now()}`,
      title: title.trim(),
      department: department.trim(),
      seniority,
      location: "Remote / Hybrid",
      type: "Full-Time",
      vacancies,
      summary: summary.trim(),
      requiredSkills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      niceToHaveSkills: ["Docker", "Redis", "Cloud"],
      criteria,
      round1Weight: 50,
      round2Weight: 50,
      rubricHistory: [
        {
          version: 1,
          criterionName: "Initial Locked Rubric",
          oldWeight: 0,
          newWeight: 100,
          reason: "Initial vacancy criteria established and locked for unbiased evaluation.",
          actor: "Hiring Manager",
          timestamp: new Date().toISOString(),
        },
      ],
      deadline: "2026-11-30",
      status: "published",
      createdAt: new Date().toISOString(),
    };

    StorageService.addJob(newJob);
    StorageService.setActiveJobId(newJob.id);
    setIsLockModalOpen(false);
    onJobCreated(newJob);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 animate-fadeIn">
      {/* 5-Step Horizontal Stepper */}
      <div className="mb-10 flex items-center justify-between relative px-2">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-surface-container-high -z-10"></div>
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-secondary transition-all duration-300 -z-10"
          style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
        ></div>

        {[
          { step: 1, label: "Details" },
          { step: 2, label: "Requirements" },
          { step: 3, label: "Audit" },
          { step: 4, label: "Scoring Rubric" },
          { step: 5, label: "Review" },
        ].map((item) => {
          const isDone = currentStep > item.step;
          const isCurrent = currentStep === item.step;

          return (
            <button
              key={item.step}
              onClick={() => setCurrentStep(item.step)}
              className="flex flex-col items-center gap-1.5 bg-background px-2 group cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? "bg-secondary text-white"
                    : isCurrent
                    ? "bg-secondary text-white ring-4 ring-secondary/20 scale-110"
                    : "bg-surface-container-high text-on-surface-variant group-hover:bg-surface-container-highest"
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : item.step}
              </div>
              <span
                className={`text-xs font-medium tracking-tight ${
                  isCurrent ? "text-primary font-bold" : "text-on-surface-variant"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* STEP 1: DETAILS */}
      {currentStep === 1 && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-subtle p-6 space-y-4">
          <h3 className="font-headline font-bold text-lg text-primary">Job Details</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-primary mb-1">Job Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 bg-surface-container-lowest text-primary font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-primary mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 bg-surface-container-lowest text-primary"
                />
              </div>
              <div>
                <label className="block font-semibold text-primary mb-1">Seniority Level</label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 bg-surface-container-lowest text-primary"
                >
                  <option value="Junior">Junior</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead / Staff">Lead / Staff</option>
                  <option value="Principal">Principal</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block font-semibold text-primary mb-1">Role Summary</label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full p-3 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 bg-surface-container-lowest text-primary resize-none"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 rounded-lg bg-secondary text-white text-xs font-semibold hover:bg-secondary-container transition-all"
            >
              Continue to Requirements
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: REQUIREMENTS */}
      {currentStep === 2 && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-subtle p-6 space-y-4">
          <h3 className="font-headline font-bold text-lg text-primary">Required Skills & Evidence Scope</h3>
          <div>
            <label className="block text-xs font-semibold text-primary mb-1">
              Required Technical Competencies (Comma-separated)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 bg-surface-container-lowest text-primary text-xs"
            />
            <p className="text-[11px] text-on-surface-variant mt-1">
              These competencies will be evaluated strictly by the Bias Shield against candidate evidence.
            </p>
          </div>
          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant text-xs font-semibold hover:bg-surface-container-low"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 rounded-lg bg-secondary text-white text-xs font-semibold hover:bg-secondary-container transition-all"
            >
              Continue to Audit
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AUDIT & GOVERNANCE RULES */}
      {currentStep === 3 && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-subtle p-6 space-y-4">
          <h3 className="font-headline font-bold text-lg text-primary">Audit & Bias Shield Configuration</h3>
          <div className="p-4 rounded-lg bg-surface border border-outline-variant/30 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Scale className="w-4 h-4 text-secondary" />
              <span>Identity Vault Partitioning Active</span>
            </div>
            <p className="text-on-surface-variant leading-relaxed">
              All candidate resumes will be anonymized into neutral candidate IDs (e.g. <code>Candidate #1001</code>). Personal identifying details remain in the Identity Vault until unmasked with documented operational justification.
            </p>
          </div>
          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant text-xs font-semibold hover:bg-surface-container-low"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="px-6 py-2.5 rounded-lg bg-secondary text-white text-xs font-semibold hover:bg-secondary-container transition-all"
            >
              Continue to Scoring Rubric
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SCORING RUBRIC (EXACT MOCKUP UI) */}
      {currentStep === 4 && (
        <div className="space-y-6">
          {/* Main Criteria Card */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-subtle overflow-hidden">
            <div className="p-6 border-b border-outline-variant/30 bg-surface/50 flex justify-between items-start">
              <div>
                <h3 className="font-headline font-bold text-lg text-primary mb-0.5">Define Scoring Criteria</h3>
                <p className="text-xs text-on-surface-variant">Assign weights to key competencies. Total must equal 100%.</p>
              </div>
              <div className="flex items-center gap-1.5 bg-primary-fixed/40 text-on-primary-fixed px-3 py-1 rounded-full text-xs font-semibold border border-primary-fixed">
                <Scale className="w-3.5 h-3.5" />
                <span>Auditable Setup</span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Criteria List */}
              <div className="space-y-3">
                {criteria.map((crit) => (
                  <div
                    key={crit.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-outline-variant/30 bg-surface hover:bg-surface-container-low transition-colors group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-headline font-semibold text-xs text-primary">{crit.name}</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant">{crit.description}</p>
                    </div>

                    <div className="w-28">
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={crit.weight}
                          onChange={(e) => handleUpdateWeight(crit.id, Number(e.target.value))}
                          className="w-full pl-3 pr-8 py-1.5 rounded-md border border-outline-variant/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 bg-surface-container-lowest font-medium text-xs text-primary text-right"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant font-medium">
                          %
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveCriterion(crit.id)}
                      className="text-error hover:bg-error-container/40 p-1.5 rounded-md transition-colors"
                      title="Remove Criterion"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Criterion Button & Total Weight Indicator */}
              <div className="flex justify-between items-center pt-3 border-t border-outline-variant/20">
                <button
                  onClick={handleAddCriterion}
                  className="flex items-center gap-1.5 text-secondary hover:text-secondary-container text-xs font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Criterion</span>
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant font-medium">Total Weight:</span>
                  <span
                    className={`font-headline font-bold text-base ${
                      totalWeight === 100 ? "text-primary" : "text-error"
                    }`}
                  >
                    {totalWeight}%
                  </span>
                  {totalWeight === 100 ? (
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-error" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Shortlisting Thresholds Panel */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-subtle overflow-hidden">
            <div className="p-6 border-b border-outline-variant/30 bg-surface/50">
              <h3 className="font-headline font-bold text-base text-primary mb-0.5">Shortlisting Thresholds</h3>
              <p className="text-xs text-on-surface-variant">Set minimum composite scores required to advance candidates.</p>
            </div>
            <div className="p-6">
              <div className="max-w-xl space-y-2">
                <label className="block text-xs font-semibold text-primary">
                  Minimum Composite Score for Auto-Shortlist
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={shortlistThreshold}
                    onChange={(e) => setShortlistThreshold(Number(e.target.value))}
                    className="flex-1 h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-secondary"
                  />
                  <div className="w-20 relative">
                    <input
                      type="number"
                      value={shortlistThreshold}
                      onChange={(e) => setShortlistThreshold(Number(e.target.value))}
                      className="w-full pl-3 pr-2 py-1.5 rounded-md border border-outline-variant/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 bg-surface-container-lowest text-xs text-primary font-bold text-center"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Candidates scoring above {shortlistThreshold} will be marked as "Advance to Round 1".
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant text-xs font-semibold hover:bg-surface-container-low transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setIsLockModalOpen(true)}
              className="px-6 py-2.5 rounded-lg bg-secondary text-white text-xs font-bold hover:bg-secondary-container transition-all shadow-subtle flex items-center gap-2 hover:scale-[1.01]"
            >
              <Lock className="w-4 h-4" />
              <span>Lock Rubric & Continue</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW */}
      {currentStep === 5 && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-subtle p-6 space-y-4">
          <h3 className="font-headline font-bold text-lg text-primary">Review Vacancy & Criteria</h3>
          <div className="p-4 rounded-lg bg-surface border border-outline-variant/30 space-y-2 text-xs">
            <p><strong>Title:</strong> {title}</p>
            <p><strong>Department:</strong> {department} • {seniority}</p>
            <p><strong>Criteria:</strong> {criteria.map((c) => `${c.name} (${c.weight}%)`).join(", ")}</p>
          </div>
          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant text-xs font-semibold hover:bg-surface-container-low"
            >
              Back
            </button>
            <button
              onClick={() => setIsLockModalOpen(true)}
              className="px-6 py-2.5 rounded-lg bg-secondary text-white text-xs font-bold hover:bg-secondary-container transition-all shadow-subtle"
            >
              Confirm & Publish Vacancy
            </button>
          </div>
        </div>
      )}

      {/* LOCK RUBRIC MODAL (MATCHING MOCKUP) */}
      {isLockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-elevated max-w-md w-full overflow-hidden text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary-container/10 flex items-center justify-center mx-auto text-secondary">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-headline font-bold text-lg text-primary mb-1">Lock Scoring Rubric?</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Once locked, this rubric version will be strictly tied to this job post to ensure auditability and fairness. Any future changes will create a new version of the rubric and require justification.
              </p>
            </div>

            <div className="bg-surface p-3.5 rounded-lg text-left border border-outline-variant/20 text-xs">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                Version Control
              </p>
              <p className="font-semibold text-primary">v1.0 (Initial Creation)</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsLockModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant text-xs font-semibold hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAndLock}
                className="flex-1 px-4 py-2.5 rounded-lg bg-secondary text-white text-xs font-bold hover:bg-secondary-container transition-all shadow-subtle"
              >
                Confirm & Lock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HMJobCreationWizard;
