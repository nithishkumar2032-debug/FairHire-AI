"use client";

import React, { useState } from "react";
import {
  Briefcase,
  Plus,
  Lock,
  History,
  AlertTriangle,
  Save,
  CheckCircle2,
  Sliders,
  Sparkles
} from "lucide-react";
import { Job, RubricCriterion } from "@/lib/types";
import { StorageService } from "@/lib/storage";

interface HMJobRubricSetupProps {
  jobs: Job[];
  activeJob: Job;
  onJobUpdated: () => void;
}

export const HMJobRubricSetup: React.FC<HMJobRubricSetupProps> = ({
  jobs,
  activeJob,
  onJobUpdated,
}) => {
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDept, setNewDept] = useState("Engineering");
  const [newSeniority, setNewSeniority] = useState<Job["seniority"]>("Senior");
  const [newSummary, setNewSummary] = useState("");
  const [newSkills, setNewSkills] = useState("");

  // Edit Rubric Modal
  const [editingCriterion, setEditingCriterion] = useState<RubricCriterion | null>(null);
  const [newWeight, setNewWeight] = useState(25);
  const [changeReason, setChangeReason] = useState("");

  const handleSaveCriterionWeight = () => {
    if (!editingCriterion || !changeReason.trim()) return;
    StorageService.updateJobRubric(
      activeJob.id,
      editingCriterion.id,
      Number(newWeight),
      changeReason.trim(),
      "Hiring Manager"
    );
    setEditingCriterion(null);
    setChangeReason("");
    onJobUpdated();
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newJob: Job = {
      id: `job-${Date.now()}`,
      title: newTitle.trim(),
      department: newDept.trim(),
      seniority: newSeniority,
      location: "Remote / Hybrid",
      type: "Full-Time",
      vacancies: 1,
      summary: newSummary.trim() || "Core engineering vacancy evaluated under FairHire responsible AI rubric.",
      requiredSkills: newSkills.split(",").map((s) => s.trim()).filter(Boolean),
      niceToHaveSkills: ["Docker", "Redis", "Cloud"],
      criteria: [
        { id: `c1-${Date.now()}`, name: "Technical Competency", weight: 40, description: "Hands-on engineering depth, language idioms, architecture." },
        { id: `c2-${Date.now()}`, name: "Problem Solving", weight: 30, description: "System design, algorithmic rigor, trade-off analysis." },
        { id: `c3-${Date.now()}`, name: "Communication Clarity", weight: 20, description: "Structured explanations, active listening, collaboration." },
        { id: `c4-${Date.now()}`, name: "Role Alignment", weight: 10, description: "Seniority expectations, testing velocity, execution discipline." },
      ],
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
        }
      ],
      deadline: "2026-10-31",
      status: "published",
      createdAt: new Date().toISOString(),
    };

    StorageService.addJob(newJob);
    StorageService.setActiveJobId(newJob.id);
    setIsCreatingJob(false);
    setNewTitle("");
    setNewSummary("");
    setNewSkills("");
    onJobUpdated();
  };

  const totalWeight = activeJob.criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {activeJob.department}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Seniority: <strong className="text-white">{activeJob.seniority}</strong> • Vacancies: <strong className="text-white">{activeJob.vacancies}</strong>
            </span>
          </div>
          <h1 className="text-xl font-bold font-display text-white">{activeJob.title}</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">{activeJob.summary}</p>
        </div>

        <button
          onClick={() => setIsCreatingJob(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Vacancy</span>
        </button>
      </div>

      {/* Locked Criteria & Rubric History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Locked Rubric Criteria */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h3 className="font-display font-semibold text-sm text-white">Locked Evaluation Criteria</h3>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${totalWeight === 100 ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                Total: {totalWeight}%
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              All candidate applications are scored against these locked job criteria. Any modifications to criteria weights are version-controlled and require recorded justifications.
            </p>

            <div className="space-y-3">
              {activeJob.criteria.map((crit) => (
                <div
                  key={crit.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4 group hover:border-slate-700 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-xs text-white">{crit.name}</h4>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {crit.weight}% Weight
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{crit.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingCriterion(crit);
                      setNewWeight(crit.weight);
                      setChangeReason("");
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all shrink-0"
                  >
                    Adjust Weight
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Tamper-Evident Rubric Version History */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <History className="w-4 h-4 text-purple-400" />
              <h3 className="font-display font-semibold text-sm text-white">Tamper-Evident Rubric History</h3>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {activeJob.rubricHistory.map((hist, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">v{hist.version}.0 • {hist.criterionName}</span>
                    <span className="text-[10px] text-slate-500">{new Date(hist.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Shifted from <strong className="text-slate-200">{hist.oldWeight}%</strong> to <strong className="text-indigo-300">{hist.newWeight}%</strong> by <span className="text-slate-300">{hist.actor}</span>
                  </p>
                  <p className="text-[11px] text-slate-300 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                    "{hist.reason}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Adjust Weight Modal */}
      {editingCriterion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <h3 className="font-display font-bold text-base text-white">Adjust Criterion Weight</h3>
            </div>

            <p className="text-xs text-slate-400">
              Editing <strong className="text-white">{editingCriterion.name}</strong>. All weight shifts are recorded permanently in the tamper-evident audit ledger.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Weight (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={newWeight}
                onChange={(e) => setNewWeight(Number(e.target.value))}
                className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mandatory Justification Reason *</label>
              <textarea
                required
                rows={3}
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="Explain the job-related rationale for this weight adjustment..."
                className="w-full bg-slate-950 text-slate-200 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingCriterion(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCriterionWeight}
                disabled={!changeReason.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
              >
                Save & Record Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Vacancy Modal */}
      {isCreatingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 text-slate-100">
            <h3 className="font-display font-bold text-lg text-white">Create New Vacancy</h3>
            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Lead Machine Learning Systems Engineer"
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Seniority Level</label>
                  <select
                    value={newSeniority}
                    onChange={(e) => setNewSeniority(e.target.value as any)}
                    className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                <label className="block font-semibold text-slate-300 mb-1">Required Skills (comma-separated)</label>
                <input
                  type="text"
                  value={newSkills}
                  onChange={(e) => setNewSkills(e.target.value)}
                  placeholder="Python, PyTorch, vLLM, Distributed Systems"
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Role Summary</label>
                <textarea
                  rows={3}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Brief description of the responsibilities and scope..."
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingJob(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Publish Vacancy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HMJobRubricSetup;
