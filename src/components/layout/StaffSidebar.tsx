"use client";

import React from "react";
import {
  Briefcase,
  ShieldCheck,
  Plus,
  Settings,
  HelpCircle,
  Globe,
  Sliders,
  FileSearch,
  Mic,
  FileCode,
  Award,
  AlertOctagon,
  Unlock,
  History,
  FileText,
  Mail
} from "lucide-react";
import { UserPersona } from "@/lib/types";

interface StaffSidebarProps {
  currentPersona: UserPersona;
  onSelectPersona: (persona: UserPersona) => void;
  hmTab: "rubric" | "shortlist" | "interview" | "assignment" | "proposals";
  onSelectHmTab: (tab: "rubric" | "shortlist" | "interview" | "assignment" | "proposals") => void;
  hrTab: "escalations" | "vault" | "audit" | "report";
  onSelectHrTab: (tab: "escalations" | "vault" | "audit" | "report") => void;
  onOpenNewJobWizard: () => void;
  onOpenSettings: () => void;
  onOpenSafeInbox: () => void;
  pendingEscalationsCount: number;
  stagedEmailCount: number;
}

export const StaffSidebar: React.FC<StaffSidebarProps> = ({
  currentPersona,
  onSelectPersona,
  hmTab,
  onSelectHmTab,
  hrTab,
  onSelectHrTab,
  onOpenNewJobWizard,
  onOpenSettings,
  onOpenSafeInbox,
  pendingEscalationsCount,
  stagedEmailCount,
}) => {
  return (
    <aside className="hidden lg:flex flex-col h-screen fixed left-0 top-0 w-[280px] bg-primary text-on-primary shadow-2xl z-40 select-none">
      {/* Brand Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline font-bold text-2xl text-white tracking-tight">FairHire</h1>
            <p className="text-on-primary/60 text-xs mt-0.5 font-medium">Auditable Intelligence Platform</p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary/30 text-secondary-fixed border border-secondary/40">
            STAFF
          </span>
        </div>
      </div>

      {/* New Job Post Button */}
      <div className="px-5 mb-4">
        <button
          onClick={onOpenNewJobWizard}
          className="w-full bg-secondary hover:bg-secondary-container text-on-secondary rounded-lg py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>New Job Post</span>
        </button>
      </div>

      {/* Navigation Links Area */}
      <div className="flex-1 overflow-y-auto px-3 space-y-6">
        {/* Persona Switch: Hiring Manager */}
        <div className="space-y-1">
          <button
            onClick={() => onSelectPersona("hiring_manager")}
            className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all ${
              currentPersona === "hiring_manager"
                ? "bg-secondary/20 text-white border-l-4 border-secondary pl-2.5"
                : "text-on-primary/70 hover:bg-primary-container hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-4 h-4 text-secondary-fixed-dim" />
              <span>Hiring Manager Workspace</span>
            </div>
          </button>

          {/* HM Sub-Tabs */}
          {currentPersona === "hiring_manager" && (
            <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-white/10 ml-4">
              <button
                onClick={() => onSelectHmTab("rubric")}
                className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-medium transition-colors flex items-center gap-2 ${
                  hmTab === "rubric" ? "bg-white/10 text-white font-bold" : "text-on-primary/60 hover:text-white"
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-secondary-fixed-dim" />
                <span>Locked Rubrics</span>
              </button>
              <button
                onClick={() => onSelectHmTab("shortlist")}
                className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-medium transition-colors flex items-center gap-2 ${
                  hmTab === "shortlist" ? "bg-white/10 text-white font-bold" : "text-on-primary/60 hover:text-white"
                }`}
              >
                <FileSearch className="w-3.5 h-3.5 text-secondary-fixed-dim" />
                <span>Stage 1: Shortlisting</span>
              </button>
              <button
                onClick={() => onSelectHmTab("interview")}
                className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-medium transition-colors flex items-center gap-2 ${
                  hmTab === "interview" ? "bg-white/10 text-white font-bold" : "text-on-primary/60 hover:text-white"
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-secondary-fixed-dim" />
                <span>Stage 2: Interview</span>
              </button>
              <button
                onClick={() => onSelectHmTab("assignment")}
                className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-medium transition-colors flex items-center gap-2 ${
                  hmTab === "assignment" ? "bg-white/10 text-white font-bold" : "text-on-primary/60 hover:text-white"
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-secondary-fixed-dim" />
                <span>Stage 3: Assignment</span>
              </button>
              <button
                onClick={() => onSelectHmTab("proposals")}
                className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-medium transition-colors flex items-center gap-2 ${
                  hmTab === "proposals" ? "bg-white/10 text-white font-bold" : "text-on-primary/60 hover:text-white"
                }`}
              >
                <Award className="w-3.5 h-3.5 text-secondary-fixed-dim" />
                <span>Stage 4: Rankings</span>
              </button>
            </div>
          )}
        </div>

        {/* Persona Switch: HR / Admin Governance */}
        <div className="space-y-1">
          <button
            onClick={() => onSelectPersona("hr_admin")}
            className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all ${
              currentPersona === "hr_admin"
                ? "bg-secondary/20 text-white border-l-4 border-secondary pl-2.5"
                : "text-on-primary/70 hover:bg-primary-container hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>HR / Admin Governance</span>
            </div>
            {pendingEscalationsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-error text-white text-[10px] rounded-full font-bold">
                {pendingEscalationsCount}
              </span>
            )}
          </button>

          {/* HR Sub-Tabs */}
          {currentPersona === "hr_admin" && (
            <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-white/10 ml-4">
              <button
                onClick={() => onSelectHrTab("escalations")}
                className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-medium transition-colors flex items-center justify-between ${
                  hrTab === "escalations" ? "bg-white/10 text-white font-bold" : "text-on-primary/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                  <span>Escalations</span>
                </div>
                {pendingEscalationsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-error animate-ping" />
                )}
              </button>
              <button
                onClick={() => onSelectHrTab("vault")}
                className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-medium transition-colors flex items-center gap-2 ${
                  hrTab === "vault" ? "bg-white/10 text-white font-bold" : "text-on-primary/60 hover:text-white"
                }`}
              >
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                <span>Identity Vault</span>
              </button>
              <button
                onClick={() => onSelectHrTab("audit")}
                className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-medium transition-colors flex items-center gap-2 ${
                  hrTab === "audit" ? "bg-white/10 text-white font-bold" : "text-on-primary/60 hover:text-white"
                }`}
              >
                <History className="w-3.5 h-3.5 text-purple-400" />
                <span>Audit Ledger</span>
              </button>
              <button
                onClick={() => onSelectHrTab("report")}
                className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-medium transition-colors flex items-center gap-2 ${
                  hrTab === "report" ? "bg-white/10 text-white font-bold" : "text-on-primary/60 hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Job Evidence PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Public Applicant Portal Quick Link */}
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={() => onSelectPersona("applicant")}
            className="w-full flex items-center gap-2.5 p-3 rounded-lg text-xs font-semibold text-on-primary/70 hover:bg-primary-container hover:text-white transition-colors"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Public Applicant Portal</span>
          </button>
        </div>
      </div>

      {/* Footer Area: User Profile & Utility */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center justify-between text-on-primary/70 text-xs px-1">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          <button
            onClick={onOpenSafeInbox}
            className="flex items-center gap-1.5 hover:text-white transition-colors relative"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>Safe Inbox</span>
            {stagedEmailCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        <div className="pt-2 border-t border-white/5 flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-surface-tint flex items-center justify-center text-white text-xs font-bold">
            {currentPersona === "hiring_manager" ? "HM" : "HR"}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-white">
              {currentPersona === "hiring_manager" ? "Alex Vance" : "Elena Rostova"}
            </p>
            <p className="text-[10px] text-on-primary/60">
              {currentPersona === "hiring_manager" ? "Lead Hiring Manager" : "HR Compliance Officer"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default StaffSidebar;
