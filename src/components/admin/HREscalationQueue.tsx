"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RotateCcw,
  UserCheck,
  ArrowRight,
  AlertTriangle,
  FileCheck
} from "lucide-react";
import { EscalationTicket } from "@/lib/types";
import { StorageService } from "@/lib/storage";

interface HREscalationQueueProps {
  escalations: EscalationTicket[];
  onEscalationResolved: () => void;
}

export const HREscalationQueue: React.FC<HREscalationQueueProps> = ({
  escalations,
  onEscalationResolved,
}) => {
  const [selectedTicket, setSelectedTicket] = useState<EscalationTicket | null>(null);
  const [resolutionAction, setResolutionAction] = useState<"approved" | "rejected" | "reopened">("approved");
  const [hrNotes, setHrNotes] = useState("");

  const pendingTickets = escalations.filter((e) => e.status === "pending");
  const resolvedTickets = escalations.filter((e) => e.status !== "pending");

  const handleResolve = () => {
    if (!selectedTicket || !hrNotes.trim()) return;

    StorageService.resolveEscalation(
      selectedTicket.id,
      resolutionAction,
      hrNotes.trim(),
      "HR Administrator"
    );

    setSelectedTicket(null);
    setHrNotes("");
    onEscalationResolved();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="rounded-2xl border border-purple-500/30 bg-slate-900/80 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              HR / Governance Portal
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Pending Exceptions: <strong className="text-white">{pendingTickets.length}</strong>
            </span>
          </div>
          <h1 className="text-xl font-bold font-display text-white">
            Automated Escalations & Discrepancy Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Independent oversight over score discrepancies &gt; 25%, unvetted overrides, adverse decisions, and essential criteria exceptions.
          </p>
        </div>
      </div>

      {/* Pending Tickets Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold font-display text-white uppercase tracking-wider">
          Active Governance Alerts ({pendingTickets.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-2xl border border-red-500/30 bg-slate-950 p-5 shadow-lg space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                    {ticket.triggerType}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(ticket.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">
                    {ticket.candidateAnonymizedId} • {ticket.jobTitle}
                  </h3>
                  <p className="text-xs text-red-200/90 mt-1 leading-relaxed">{ticket.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Severity: <strong className="text-red-400">{ticket.severity}</strong></span>
                <button
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setResolutionAction("approved");
                    setHrNotes("");
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all"
                >
                  Review & Action
                </button>
              </div>
            </div>
          ))}

          {pendingTickets.length === 0 && (
            <div className="col-span-2 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-950/10 p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-emerald-300">All Escalations Resolved</h4>
              <p className="text-xs text-emerald-200/70 mt-1">Zero pending governance alerts or score discrepancies.</p>
            </div>
          )}
        </div>
      </div>

      {/* Resolved History */}
      {resolvedTickets.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold font-display text-slate-300 uppercase tracking-wider">
            Resolved Governance Records ({resolvedTickets.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resolvedTickets.map((t) => (
              <div key={t.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{t.candidateAnonymizedId} • {t.triggerType}</span>
                  <span className="text-[10px] font-bold uppercase text-emerald-400">{t.status}</span>
                </div>
                <p className="text-[11px] text-slate-400 italic">HR Resolution: "{t.hrResolutionNotes}"</p>
                <p className="text-[10px] text-slate-500">Resolved by {t.resolvedBy} on {t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString() : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Resolution Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-purple-500/40 p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              <h3 className="font-display font-bold text-base text-white">Action Governance Escalation</h3>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-white">{selectedTicket.candidateAnonymizedId}</span>
                <span className="text-red-400 font-semibold">{selectedTicket.triggerType}</span>
              </div>
              <p className="text-slate-400">{selectedTicket.description}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Administrative Action</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setResolutionAction("approved")}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                    resolutionAction === "approved"
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  Approve Exception
                </button>

                <button
                  type="button"
                  onClick={() => setResolutionAction("rejected")}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                    resolutionAction === "rejected"
                      ? "bg-red-600 text-white border-red-500 shadow-md"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  Reject Proposal
                </button>

                <button
                  type="button"
                  onClick={() => setResolutionAction("reopened")}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                    resolutionAction === "reopened"
                      ? "bg-amber-600 text-white border-amber-500 shadow-md"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  Reopen Evaluation
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mandatory HR Rationale & Policy Notes *
              </label>
              <textarea
                required
                rows={3}
                value={hrNotes}
                onChange={(e) => setHrNotes(e.target.value)}
                placeholder="Document the formal justification for this administrative action..."
                className="w-full bg-slate-950 text-slate-200 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={!hrNotes.trim()}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all"
              >
                Record Official Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HREscalationQueue;
