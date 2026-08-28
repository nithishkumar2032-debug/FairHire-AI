"use client";

import React, { useState } from "react";
import { Key, Shield, Sparkles, X, Check, Mail, Info } from "lucide-react";
import { AppSettings } from "@/lib/types";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: Partial<AppSettings>) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [emailSafeMode, setEmailSafeMode] = useState(settings.emailSafeMode);
  const [safeInbox, setSafeInbox] = useState(settings.safeModeInboxEmail);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      geminiApiKey: apiKey.trim(),
      emailSafeMode,
      safeModeInboxEmail: safeInbox.trim(),
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-6 sm:p-8 shadow-elevated text-primary space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-secondary/10 text-secondary border border-secondary/20">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-headline font-bold text-primary">Platform & AI Configuration</h2>
            <p className="text-xs text-on-surface-variant">Google Gemini API & Email Safe-Mode Settings</p>
          </div>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-primary uppercase tracking-wider mb-1.5">
              Custom Google Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy... (or set GEMINI_API_KEY in .env.local)"
              className="w-full bg-surface text-primary font-mono text-xs px-3.5 py-2.5 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-subtle"
            />
            <p className="text-[11px] text-on-surface-variant mt-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-secondary" />
              Passed securely to server-side Next.js route handlers for independent validation.
            </p>
          </div>

          {/* Email Safe Mode Toggle */}
          <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 flex items-center justify-between">
            <div className="pr-4 space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-primary">Email Safe Mode</span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Redirects all stage-wise candidate notices to the internal testing inbox.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailSafeMode}
                onChange={(e) => setEmailSafeMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-primary mb-1">
              Safe-Mode Internal Logging Inbox
            </label>
            <input
              type="text"
              value={safeInbox}
              onChange={(e) => setSafeInbox(e.target.value)}
              className="w-full bg-surface text-primary font-mono text-xs px-3.5 py-2.5 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-subtle"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-secondary hover:bg-secondary-container text-white text-xs font-bold shadow-subtle flex items-center gap-1.5 transition-all"
          >
            {isSaved ? <Check className="w-4 h-4 text-white" /> : null}
            <span>{isSaved ? "Saved!" : "Save Settings"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
