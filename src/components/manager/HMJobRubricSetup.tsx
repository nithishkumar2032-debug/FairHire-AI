"use client";

import React, { useState } from "react";
import {
  Briefcase,
  Plus,
  Lock,
  History,
  AlertTriangle,
  Sliders,
  Scale,
  CheckCircle2,
  Edit3
} from "lucide-react";
import { Job, RubricCriterion } from "@/lib/types";
import { StorageService } from "@/lib/storage";

interface HMJobRubricSetupProps {
  jobs: Job[];
  activeJob: Job;
  onJobUpdated: () => void;
  onOpenWizard: () => void;
}

export const HMJobRubricSetup: React.FC<HMJobRubricSetupProps> = ({
  jobs,
  activeJob,
  onJobUpdated,
  onOpenWizard,
}) => {
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

  const totalWeight = activeJob.criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-fixed/40 text-on-primary-fixed border border-primary-fixed">
              {activeJob.department}
            </span>
            <span className="text-xs text-on-surface-variant font-medium">
              Seniority: <strong className="text-primary">{activeJob.seniority}</strong> • Vacancies: <strong className="text-primary">{activeJob.vacancies}</strong>
            </span>
          </div>
          <h1 className="font-headline font-bold text-xl text-primary">{activeJob.title}</h1>
          <p className="text-xs text-on-surface-variant mt-1 max-w-2xl">{activeJob.summary}</p>
        </div>

        <button
          onClick={onOpenWizard}
          className="px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary-container text-white text-xs font-semibold flex items-center gap-1.5 shadow-subtle transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Vacancy Wizard</span>
        </button>
      </div>

      {/* Locked Criteria & Rubric History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Locked Rubric Criteria */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-secondary" />
                <h3 className="font-headline font-bold text-sm text-primary">Locked Evaluation Criteria</h3>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  totalWeight === 100
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                Total Weight: {totalWeight}%
              </span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              All candidate applications are scored against these locked job criteria. Any modifications to criteria weights are version-controlled and require recorded justifications.
            </p>

            <div className="space-y-3">
              {activeJob.criteria.map((crit) => (
                <div
                  key={crit.id}
                  className="p-4 rounded-lg bg-surface border border-outline-variant/30 flex items-start justify-between gap-4 group hover:bg-surface-container-low transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-headline font-bold text-xs text-primary">{crit.name}</h4>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-secondary/10 text-secondary border border-secondary/20">
                        {crit.weight}% Weight
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">{crit.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingCriterion(crit);
                      setNewWeight(crit.weight);
                      setChangeReason("");
                    }}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface text-on-surface-variant hover:text-primary border border-outline-variant/40 transition-all shrink-0 font-semibold"
                  >
                    Adjust Weight
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Tamper-Evident Version History */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-subtle space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/30">
              <History className="w-4 h-4 text-secondary" />
              <h3 className="font-headline font-bold text-sm text-primary">Tamper-Evident Rubric History</h3>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {activeJob.rubricHistory.map((hist, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-surface border border-outline-variant/30 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-headline font-bold text-primary">v{hist.version}.0 • {hist.criterionName}</span>
                    <span className="text-[10px] text-on-surface-variant">{new Date(hist.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    Weight shifted from <strong className="text-primary">{hist.oldWeight}%</strong> to <strong className="text-secondary">{hist.newWeight}%</strong> by <span className="text-primary font-medium">{hist.actor}</span>
                  </p>
                  <p className="text-[11px] text-on-surface-variant italic bg-surface-container-lowest p-2 rounded border border-outline-variant/20">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-elevated space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-secondary" />
              <h3 className="font-headline font-bold text-base text-primary">Adjust Criterion Weight</h3>
            </div>

            <p className="text-xs text-on-surface-variant">
              Editing <strong className="text-primary">{editingCriterion.name}</strong>. All weight shifts are recorded permanently in the tamper-evident audit ledger.
            </p>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">New Weight (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={newWeight}
                onChange={(e) => setNewWeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 bg-surface-container-lowest text-primary text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">Mandatory Justification Reason *</label>
              <textarea
                required
                rows={3}
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="Explain the job-related rationale for this weight adjustment..."
                className="w-full p-3 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 bg-surface-container-lowest text-primary text-xs resize-none"
              />
            </div>

            <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingCriterion(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCriterionWeight}
                disabled={!changeReason.trim()}
                className="px-5 py-2 rounded-lg bg-secondary hover:bg-secondary-container disabled:opacity-50 text-white text-xs font-bold shadow-subtle transition-all"
              >
                Save & Record Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HMJobRubricSetup;
