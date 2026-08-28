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
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-secondary" />
            <h2 className="font-headline font-bold text-lg text-primary">
              Immutable Governance Audit Ledger ({logs.length} Events Recorded)
            </h2>
          </div>
        </div>
        <p className="text-xs text-on-surface-variant max-w-3xl leading-relaxed">
          Tamper-evident record of all consequential actions: criteria modifications, identity unmasking authorizations, human-AI score discrepancies, overrides, and final selection outcomes.
        </p>

        {/* Filter Controls */}
        <div className="pt-3 border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-on-surface-variant" />
            <span className="text-xs font-semibold text-on-surface-variant uppercase">Filter by Actor:</span>
            {(["all", "Hiring Manager", "HR/Admin", "System / Bias Shield"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterRole === r
                    ? "bg-secondary text-white shadow-subtle"
                    : "bg-surface text-on-surface-variant hover:text-primary border border-outline-variant/40"
                }`}
              >
                {r === "all" ? "All Actors" : r}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="bg-surface-container-lowest text-primary text-xs pl-8 pr-3 py-1.5 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-subtle"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-subtle">
        <div className="space-y-4">
          {filteredLogs.map((log) => {
            const isUnmask = log.action.includes("Unmasked");
            const isEscalation = log.action.includes("Escalation");
            const isRubric = log.action.includes("Rubric");

            return (
              <div
                key={log.id}
                className="p-4 rounded-lg bg-surface border border-outline-variant/30 space-y-2 hover:bg-surface-container-low transition-all text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isUnmask
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : isEscalation
                          ? "bg-red-50 text-error border border-red-200"
                          : isRubric
                          ? "bg-purple-50 text-purple-800 border border-purple-200"
                          : "bg-secondary/10 text-secondary border border-secondary/20"
                      }`}
                    >
                      {log.actorRole}
                    </span>
                    <span className="font-headline font-bold text-primary text-sm">{log.action}</span>
                  </div>

                  <span className="text-[11px] text-on-surface-variant">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-on-surface-variant leading-relaxed">{log.details}</p>

                {log.mandatoryReason && (
                  <p className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-md border border-amber-200 italic">
                    <strong>Logged Justification:</strong> "{log.mandatoryReason}"
                  </p>
                )}

                <div className="flex items-center gap-4 text-[10px] text-on-surface-variant pt-1 border-t border-outline-variant/20">
                  <span>Actor: <strong className="text-primary">{log.actorName}</strong></span>
                  <span>Target: <strong className="text-primary">{log.targetId}</strong></span>
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-xs text-on-surface-variant">
              No audit records matching criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRAuditLogViewer;
