"use client";

import React from "react";
import {
  Globe,
  Briefcase,
  ShieldAlert,
  Key,
  Mail,
  RotateCcw,
  Bot,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { UserPersona, Job, AppSettings } from "@/lib/types";

interface PersonaNavProps {
  currentPersona: UserPersona;
  onSelectPersona: (persona: UserPersona) => void;
  jobs: Job[];
  activeJobId: string;
  onSelectJob: (jobId: string) => void;
  settings: AppSettings;
  stagedEmailCount: number;
  onOpenSettings: () => void;
  onOpenSafeInbox: () => void;
  onResetData: () => void;
}

export const PersonaNav: React.FC<PersonaNavProps> = ({
  currentPersona,
  onSelectPersona,
  jobs,
  activeJobId,
  onSelectJob,
  settings,
  stagedEmailCount,
  onOpenSettings,
  onOpenSafeInbox,
  onResetData,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#090d16] rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-lg tracking-tight text-white">
                FairHire
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PROD
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Responsible AI Recruitment</p>
          </div>
        </div>

        {/* 3 Persona Switcher */}
        <nav className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => onSelectPersona("applicant")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentPersona === "applicant"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Applicant Portal</span>
          </button>

          <button
            onClick={() => onSelectPersona("hiring_manager")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentPersona === "hiring_manager"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Hiring Manager</span>
          </button>

          <button
            onClick={() => onSelectPersona("hr_admin")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentPersona === "hr_admin"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>HR / Governance</span>
          </button>
        </nav>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {/* Active Job selector for HM and HR */}
          {currentPersona !== "applicant" && jobs.length > 0 && (
            <div className="relative hidden md:block">
              <select
                value={activeJobId}
                onChange={(e) => onSelectJob(e.target.value)}
                className="appearance-none bg-slate-900 text-slate-200 text-xs font-medium pl-3 pr-8 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[190px] truncate"
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} ({job.seniority})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Safe Mode Inbox button */}
          <button
            onClick={onOpenSafeInbox}
            title="Safe-Mode Applicant Communication Log"
            className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all"
          >
            <Mail className="w-4 h-4 text-emerald-400" />
            {stagedEmailCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center">
                {stagedEmailCount}
              </span>
            )}
          </button>

          {/* Settings / API Key */}
          <button
            onClick={onOpenSettings}
            title="Platform & Gemini Settings"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all"
          >
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Reset Live State */}
          <button
            onClick={onResetData}
            title="Reset to Fresh Production State"
            className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default PersonaNav;
