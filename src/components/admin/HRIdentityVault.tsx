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
      {/* Banner */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-subtle space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-secondary" />
          <h2 className="font-headline font-bold text-lg text-primary">
            Identity Vault & Controlled Unmasking Registry
          </h2>
        </div>
        <p className="text-xs text-on-surface-variant max-w-3xl leading-relaxed">
          Personal identities (Full Legal Name, Contact Information, Location) are cryptographically partitioned from professional evidence. Only authorized HR administrators may unmask credentials with a documented legal or operational purpose. Every unmasking event writes an immutable audit record.
        </p>
      </div>

      {/* Candidate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {applications.map((app) => {
          const isUnmasked = app.identityVault.isUnmasked;

          return (
            <div
              key={app.id}
              className={`rounded-xl border p-5 transition-all space-y-4 shadow-subtle flex flex-col justify-between ${
                isUnmasked
                  ? "bg-surface-container-lowest border-emerald-300"
                  : "bg-surface-container-lowest border-outline-variant/30"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-headline font-bold text-xs text-primary">{app.anonymizedId}</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                      isUnmasked
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-surface text-on-surface-variant border border-outline-variant/40"
                    }`}
                  >
                    {isUnmasked ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-on-surface-variant" />}
                    <span>{isUnmasked ? "Unmasked" : "Vault Locked"}</span>
                  </span>
                </div>

                {isUnmasked ? (
                  <div className="space-y-2 p-3.5 rounded-lg bg-surface border border-outline-variant/20 text-xs">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <User className="w-3.5 h-3.5 text-secondary" />
                      <span>{app.identityVault.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span>{app.identityVault.email}</span>
                    </div>
                    {app.identityVault.phone && (
                      <div className="flex items-center gap-2 text-on-surface-variant text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-on-surface-variant" />
                        <span>{app.identityVault.phone}</span>
                      </div>
                    )}
                    {app.identityVault.location && (
                      <div className="flex items-center gap-2 text-on-surface-variant text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-on-surface-variant" />
                        <span>{app.identityVault.location}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-5 rounded-lg bg-surface border border-dashed border-outline-variant/50 text-center space-y-1">
                    <Lock className="w-6 h-6 text-on-surface-variant mx-auto" />
                    <p className="text-[11px] text-primary font-medium">Identity Protected</p>
                    <p className="text-[10px] text-on-surface-variant">Separated from evaluators</p>
                  </div>
                )}

                <div className="text-[11px] text-on-surface-variant space-y-0.5">
                  <p>Stage: <strong className="text-primary">{app.stage}</strong></p>
                  <p>Status: <span className="text-secondary font-medium">{app.applicantFacingStatus}</span></p>
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant/20">
                {isUnmasked ? (
                  <span className="text-[10px] text-emerald-800 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Unmasked by {app.identityVault.unmaskedBy}
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setUnmaskTarget(app);
                      setReason("");
                    }}
                    className="w-full py-2 rounded-lg bg-surface hover:bg-surface-container-low text-primary text-xs font-semibold flex items-center justify-center gap-1.5 border border-outline-variant/40 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 text-secondary" />
                    <span>Unmask with Audit Reason</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {applications.length === 0 && (
          <div className="col-span-3 rounded-xl border border-dashed border-outline-variant/50 p-10 text-center text-xs text-on-surface-variant">
            No applicant records available in the Identity Vault.
          </div>
        )}
      </div>

      {/* Unmasking Modal */}
      {unmaskTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-elevated space-y-4">
            <div className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-amber-600" />
              <h3 className="font-headline font-bold text-base text-primary">
                Controlled Identity Unmasking Request
              </h3>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              You are requesting to unmask personal contact credentials for <strong className="text-primary">{unmaskTarget.anonymizedId}</strong>. A mandatory audit log entry will be permanently recorded.
            </p>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                Authorized Purpose *
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-surface-container-lowest text-primary text-xs px-3 py-2 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-subtle"
              >
                <option value="Interview Scheduling Coordination">Interview Scheduling Coordination</option>
                <option value="Official Employment Offer Preparation">Official Employment Offer Preparation</option>
                <option value="Legal / Compliance / Audit Investigation">Legal / Compliance / Audit Investigation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                Mandatory Written Justification *
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the specific operational necessity for unmasking this candidate..."
                className="w-full p-3 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 bg-surface-container-lowest text-primary text-xs resize-none"
              />
            </div>

            <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-end gap-2">
              <button
                onClick={() => setUnmaskTarget(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnmask}
                disabled={!reason.trim()}
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-subtle transition-all"
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
