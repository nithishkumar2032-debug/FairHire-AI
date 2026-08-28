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
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-fixed/40 text-on-primary-fixed border border-primary-fixed">
              HR / Governance Portal
            </span>
            <span className="text-xs text-on-surface-variant font-medium">
              Pending Exceptions: <strong className="text-primary">{pendingTickets.length}</strong>
            </span>
          </div>
          <h1 className="font-headline font-bold text-xl text-primary">
            Automated Escalations & Discrepancy Queue
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 max-w-2xl">
            Independent oversight over score discrepancies &gt; 25%, unvetted overrides, adverse decisions, and essential criteria exceptions.
          </p>
        </div>
      </div>

      {/* Active Escalations Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold font-headline text-primary uppercase tracking-wider">
          Active Governance Alerts ({pendingTickets.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-surface-container-lowest rounded-xl border border-red-200 p-5 shadow-subtle space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-error border border-red-200">
                    {ticket.triggerType}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    {new Date(ticket.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <div>
                  <h3 className="font-headline font-bold text-sm text-primary">
                    {ticket.candidateAnonymizedId} • {ticket.jobTitle}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{ticket.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant">
                  Severity: <strong className="text-error">{ticket.severity}</strong>
                </span>
                <button
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setResolutionAction("approved");
                    setHrNotes("");
                  }}
                  className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary-container text-white text-xs font-semibold shadow-subtle transition-all"
                >
                  Review & Action
                </button>
              </div>
            </div>
          ))}

          {pendingTickets.length === 0 && (
            <div className="col-span-2 bg-surface-container-lowest rounded-xl border border-dashed border-emerald-200 p-8 text-center shadow-subtle">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="font-headline font-bold text-sm text-emerald-800">All Escalations Resolved</h4>
              <p className="text-xs text-on-surface-variant mt-1">Zero pending governance alerts or score discrepancies.</p>
            </div>
          )}
        </div>
      </div>

      {/* Resolved History */}
      {resolvedTickets.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-outline-variant/30">
          <h3 className="text-xs font-bold font-headline text-on-surface-variant uppercase tracking-wider">
            Resolved Governance Records ({resolvedTickets.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resolvedTickets.map((t) => (
              <div key={t.id} className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant/30 space-y-1 text-xs shadow-subtle">
                <div className="flex items-center justify-between">
                  <span className="font-headline font-bold text-primary">{t.candidateAnonymizedId} • {t.triggerType}</span>
                  <span className="text-[10px] font-bold uppercase text-emerald-700">{t.status}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant italic">HR Resolution: "{t.hrResolutionNotes}"</p>
                <p className="text-[10px] text-on-surface-variant">Resolved by {t.resolvedBy} on {t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString() : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Resolution Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-elevated space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-secondary" />
              <h3 className="font-headline font-bold text-base text-primary">Action Governance Escalation</h3>
            </div>

            <div className="p-3.5 rounded-lg bg-surface border border-outline-variant/30 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="font-headline font-bold text-primary">{selectedTicket.candidateAnonymizedId}</span>
                <span className="text-error font-semibold">{selectedTicket.triggerType}</span>
              </div>
              <p className="text-on-surface-variant">{selectedTicket.description}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-primary">Administrative Action</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setResolutionAction("approved")}
                  className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all text-center ${
                    resolutionAction === "approved"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-subtle"
                      : "bg-surface text-on-surface-variant border-outline-variant/40 hover:text-primary"
                  }`}
                >
                  Approve Exception
                </button>

                <button
                  type="button"
                  onClick={() => setResolutionAction("rejected")}
                  className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all text-center ${
                    resolutionAction === "rejected"
                      ? "bg-error text-white border-error shadow-subtle"
                      : "bg-surface text-on-surface-variant border-outline-variant/40 hover:text-primary"
                  }`}
                >
                  Reject Proposal
                </button>

                <button
                  type="button"
                  onClick={() => setResolutionAction("reopened")}
                  className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all text-center ${
                    resolutionAction === "reopened"
                      ? "bg-amber-600 text-white border-amber-600 shadow-subtle"
                      : "bg-surface text-on-surface-variant border-outline-variant/40 hover:text-primary"
                  }`}
                >
                  Reopen Evaluation
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                Mandatory HR Rationale & Policy Notes *
              </label>
              <textarea
                required
                rows={3}
                value={hrNotes}
                onChange={(e) => setHrNotes(e.target.value)}
                placeholder="Document the formal justification for this administrative action..."
                className="w-full p-3 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 bg-surface-container-lowest text-primary text-xs resize-none"
              />
            </div>

            <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={!hrNotes.trim()}
                className="px-5 py-2 rounded-lg bg-secondary hover:bg-secondary-container disabled:opacity-50 text-white text-xs font-bold shadow-subtle transition-all"
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
