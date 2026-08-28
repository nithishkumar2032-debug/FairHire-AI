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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 flex flex-col h-[600px]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-display text-white">
              Safe-Mode Applicant Communication Inbox
            </h2>
            <p className="text-xs text-slate-400">
              All candidate stage notifications are safely intercepted and logged here during testing.
            </p>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
          {/* Mail List */}
          <div className="col-span-5 border-r border-slate-800 pr-3 space-y-2 overflow-y-auto">
            {communications.map((comm) => (
              <button
                key={comm.id}
                onClick={() => setSelectedMail(comm)}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs space-y-1 block ${
                  selectedMail?.id === comm.id
                    ? "bg-indigo-600/20 border-indigo-500/40 text-white"
                    : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white truncate">{comm.candidateAnonymizedId}</span>
                  <span className="text-[9px] text-slate-500">
                    {new Date(comm.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="font-medium text-slate-200 truncate">{comm.subject}</p>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded inline-block">
                  {comm.stage}
                </span>
              </button>
            ))}

            {communications.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                No communications staged yet.
              </div>
            )}
          </div>

          {/* Message Reader */}
          <div className="col-span-7 pl-2 flex flex-col justify-between overflow-y-auto">
            {selectedMail ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recipient:</span>
                    <span className="text-white font-mono">{selectedMail.recipientEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Candidate:</span>
                    <span className="text-emerald-400 font-semibold">{selectedMail.candidateAnonymizedId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="text-slate-400">{new Date(selectedMail.sentAt).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm mb-2">{selectedMail.subject}</h3>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedMail.body}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-500">
                Select a notification to view message content.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            Safe Mode Active • External Email Delivery Suppressed
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafeModeInboxModal;
