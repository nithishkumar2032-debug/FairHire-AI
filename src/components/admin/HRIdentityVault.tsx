"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle2
} from "lucide-react";
import { CandidateApplication } from "@/lib/types";
import { StorageService } from "@/lib/storage";

interface HRIdentityVaultProps {
  applications: CandidateApplication[];
  onApplicationUpdated: () => void;
}

export const HRIdentityVault: React.FC<HRIdentityVaultProps> = ({
  applications,
  onApplicationUpdated,
}) => {
  const [unmaskTarget, setUnmaskTarget] = useState<CandidateApplication | null>(null);
  const [purpose, setPurpose] = useState<string>("Interview Scheduling Coordination");
  const [reason, setReason] = useState("");

  const handleConfirmUnmask = () => {
    if (!unmaskTarget || !reason.trim()) return;

    StorageService.unmaskIdentity(
      unmaskTarget.id,
      "HR Administrator",
      `Purpose: [${purpose}] - Reason: ${reason.trim()}`
    );

    setUnmaskTarget(null);
    setReason("");
    onApplicationUpdated();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold font-display text-white">
            Identity Vault & Controlled Unmasking Registry
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          Personal identities (Full Legal Name, Contact Information, Location) are cryptographically partitioned from professional evidence. Only authorized HR administrators may unmask credentials with a documented legal or operational purpose. Every unmasking event writes an immutable audit record.
        </p>
      </div>

      {/* Candidate Vault Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {applications.map((app) => {
          const isUnmasked = app.identityVault.isUnmasked;

          return (
            <div
              key={app.id}
              className={`rounded-2xl border p-5 transition-all space-y-4 shadow-lg flex flex-col justify-between ${
                isUnmasked
                  ? "bg-slate-950/90 border-emerald-500/40"
                  : "bg-slate-900/60 border-slate-800"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{app.anonymizedId}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                      isUnmasked
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {isUnmasked ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-slate-500" />}
                    <span>{isUnmasked ? "Unmasked" : "Vault Locked"}</span>
                  </span>
                </div>

                {isUnmasked ? (
                  <div className="space-y-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{app.identityVault.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{app.identityVault.email}</span>
                    </div>
                    {app.identityVault.phone && (
                      <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{app.identityVault.phone}</span>
                      </div>
                    )}
                    {app.identityVault.location && (
                      <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{app.identityVault.location}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-dashed border-slate-800 text-center space-y-1">
                    <Lock className="w-6 h-6 text-slate-600 mx-auto" />
                    <p className="text-[11px] text-slate-400 font-medium">Identity Protected</p>
                    <p className="text-[10px] text-slate-500">Separated from evaluators</p>
                  </div>
                )}

                <div className="text-[11px] text-slate-400 space-y-1">
                  <p>Stage: <strong className="text-slate-200">{app.stage}</strong></p>
                  <p>Status: <span className="text-indigo-400">{app.applicantFacingStatus}</span></p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                {isUnmasked ? (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Unmasked by {app.identityVault.unmaskedBy}
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setUnmaskTarget(app);
                      setReason("");
                    }}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Unmask with Audit Reason</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {applications.length === 0 && (
          <div className="col-span-3 rounded-2xl border border-dashed border-slate-800 p-10 text-center text-xs text-slate-400">
            No applicant records available in the Identity Vault.
          </div>
        )}
      </div>

      {/* Controlled Unmasking Modal */}
      {unmaskTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-amber-400" />
              <h3 className="font-display font-bold text-base text-white">
                Controlled Identity Unmasking Request
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              You are requesting to unmask personal contact credentials for <strong className="text-white">{unmaskTarget.anonymizedId}</strong>. A mandatory audit log entry will be permanently recorded.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Authorized Purpose *
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Interview Scheduling Coordination">Interview Scheduling Coordination</option>
                <option value="Official Employment Offer Preparation">Official Employment Offer Preparation</option>
                <option value="Legal / Compliance / Audit Investigation">Legal / Compliance / Audit Investigation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mandatory Written Justification *
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the specific operational necessity for unmasking this candidate..."
                className="w-full bg-slate-950 text-slate-200 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setUnmaskTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnmask}
                disabled={!reason.trim()}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all"
              >
                Confirm & Log Audit Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRIdentityVault;
