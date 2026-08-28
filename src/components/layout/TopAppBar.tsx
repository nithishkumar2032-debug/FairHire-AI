"use client";

import React from "react";
import {
  Bell,
  User,
  ChevronDown,
  Briefcase,
  Globe,
  ShieldCheck,
  RotateCcw
} from "lucide-react";
import { UserPersona, Job } from "@/lib/types";

interface TopAppBarProps {
  currentPersona: UserPersona;
  onSelectPersona: (persona: UserPersona) => void;
  title: string;
  subtitle?: string;
  jobs: Job[];
  activeJobId: string;
  onSelectJob: (jobId: string) => void;
  onResetData: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentPersona,
  onSelectPersona,
  title,
  subtitle,
  jobs,
  activeJobId,
  onSelectJob,
  onResetData,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 px-6 py-3 flex items-center justify-between gap-4">
      {/* Title & Subtitle */}
      <div>
        <h2 className="font-headline font-bold text-lg text-primary tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-on-surface-variant hidden sm:block">{subtitle}</p>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Active Role Selector */}
        {currentPersona !== "applicant" && jobs.length > 0 && (
          <div className="relative">
            <select
              value={activeJobId}
              onChange={(e) => onSelectJob(e.target.value)}
              className="appearance-none bg-surface-container-lowest text-primary text-xs font-semibold pl-3 pr-8 py-2 rounded-lg border border-outline-variant/40 hover:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-subtle cursor-pointer transition-all max-w-[210px] truncate"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.seniority})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        {/* Mobile/Quick Persona Switcher */}
        <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg border border-outline-variant/30">
          <button
            onClick={() => onSelectPersona("applicant")}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
              currentPersona === "applicant"
                ? "bg-secondary text-white shadow-sm"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Applicant
          </button>
          <button
            onClick={() => onSelectPersona("hiring_manager")}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
              currentPersona === "hiring_manager"
                ? "bg-secondary text-white shadow-sm"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Manager
          </button>
          <button
            onClick={() => onSelectPersona("hr_admin")}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
              currentPersona === "hr_admin"
                ? "bg-secondary text-white shadow-sm"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            HR/Admin
          </button>
        </div>

        {/* Reset State Button */}
        <button
          onClick={onResetData}
          title="Reset to Fresh Production State"
          className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default TopAppBar;
