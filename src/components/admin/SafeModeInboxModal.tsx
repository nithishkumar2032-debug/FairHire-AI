"use client";

import React, { useState } from "react";
import { Mail, ShieldCheck, X, Search, Clock, CheckCircle2 } from "lucide-react";
import { CommunicationLog } from "@/lib/types";

interface SafeModeInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  communications: CommunicationLog[];
}

export const SafeModeInboxModal: React.FC<SafeModeInboxModalProps> = ({
  isOpen,
  onClose,
  communications,
}) => {
  const [selectedMail, setSelectedMail] = useState<CommunicationLog | null>(
    communications[0] || null
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-elevated text-primary flex flex-col h-[600px]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-outline-variant/30">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-headline font-bold text-primary">
              Safe-Mode Applicant Communication Inbox
            </h2>
            <p className="text-xs text-on-surface-variant">
              All candidate stage notifications are safely intercepted and logged here during testing.
            </p>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
          {/* Mail List */}
          <div className="col-span-5 border-r border-outline-variant/30 pr-3 space-y-2 overflow-y-auto">
            {communications.map((comm) => (
              <button
                key={comm.id}
                onClick={() => setSelectedMail(comm)}
                className={`w-full text-left p-3 rounded-lg border transition-all text-xs space-y-1 block ${
                  selectedMail?.id === comm.id
                    ? "bg-secondary/10 border-secondary text-primary font-semibold shadow-subtle"
                    : "bg-surface border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary truncate">{comm.candidateAnonymizedId}</span>
                  <span className="text-[9px] text-on-surface-variant">
                    {new Date(comm.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="font-medium text-primary truncate">{comm.subject}</p>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-200">
                  {comm.stage}
                </span>
              </button>
            ))}

            {communications.length === 0 && (
              <div className="p-8 text-center text-xs text-on-surface-variant">
                No communications staged yet.
              </div>
            )}
          </div>

          {/* Message Reader */}
          <div className="col-span-7 pl-2 flex flex-col justify-between overflow-y-auto">
            {selectedMail ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-lg bg-surface border border-outline-variant/30 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Recipient:</span>
                    <span className="text-primary font-mono">{selectedMail.recipientEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Candidate:</span>
                    <span className="text-secondary font-semibold">{selectedMail.candidateAnonymizedId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Timestamp:</span>
                    <span className="text-on-surface-variant">{new Date(selectedMail.sentAt).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-headline font-bold text-primary text-sm mb-2">{selectedMail.subject}</h3>
                  <div className="p-4 rounded-lg bg-surface border border-outline-variant/30 font-mono text-xs text-primary leading-relaxed whitespace-pre-wrap">
                    {selectedMail.body}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-on-surface-variant">
                Select a notification to view message content.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
          <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Safe Mode Active • External Email Delivery Suppressed
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface hover:bg-surface-container-low text-primary border border-outline-variant/40 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafeModeInboxModal;
