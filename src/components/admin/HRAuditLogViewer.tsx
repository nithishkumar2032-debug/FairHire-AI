"use client";

import React, { useState } from "react";
import {
  History,
  ShieldCheck,
  User,
  Lock,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { AuditLogEntry } from "@/lib/types";

interface HRAuditLogViewerProps {
  logs: AuditLogEntry[];
}

export const HRAuditLogViewer: React.FC<HRAuditLogViewerProps> = ({ logs }) => {
  const [filterRole, setFilterRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredLogs = logs.filter((log) => {
    if (filterRole !== "all" && log.actorRole !== filterRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.targetId.toLowerCase().includes(q) ||
        (log.mandatoryReason && log.mandatoryReason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold font-display text-white">
              Immutable Governance Audit Ledger ({logs.length} Events Recorded)
            </h2>
          </div>
        </div>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          Tamper-evident record of all consequential actions: criteria modifications, identity unmasking authorizations, human-AI score discrepancies, overrides, and final selection outcomes.
        </p>

        {/* Filter Controls */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase">Filter by Actor:</span>
            {(["all", "Hiring Manager", "HR/Admin", "System / Bias Shield"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterRole === r
                    ? "bg-purple-600 text-white font-semibold shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {r === "all" ? "All Actors" : r}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="bg-slate-950 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div className="space-y-4">
          {filteredLogs.map((log) => {
            const isUnmask = log.action.includes("Unmasked");
            const isEscalation = log.action.includes("Escalation");
            const isRubric = log.action.includes("Rubric");

            return (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition-all text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isUnmask
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : isEscalation
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : isRubric
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      }`}
                    >
                      {log.actorRole}
                    </span>
                    <span className="font-bold text-white text-sm">{log.action}</span>
                  </div>

                  <span className="text-[11px] text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed">{log.details}</p>

                {log.mandatoryReason && (
                  <p className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 italic">
                    <strong>Logged Justification:</strong> "{log.mandatoryReason}"
                  </p>
                )}

                <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                  <span>Actor: <strong className="text-slate-400">{log.actorName}</strong></span>
                  <span>Target: <strong className="text-slate-400">{log.targetId}</strong></span>
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No audit records matching criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRAuditLogViewer;
