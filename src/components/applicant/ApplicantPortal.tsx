"use client";

import React, { useState } from "react";
import {
  Globe,
  Briefcase,
  MapPin,
  Clock,
  ShieldCheck,
  Upload,
  FileText,
  CheckCircle2,
  Search,
  ArrowRight,
  Sparkles,
  Info,
  X
} from "lucide-react";
import { Job, CandidateApplication } from "@/lib/types";
import { StorageService } from "@/lib/storage";

interface ApplicantPortalProps {
  jobs: Job[];
  applications: CandidateApplication[];
  onApplicationSubmitted: (app: CandidateApplication) => void;
}

export const ApplicantPortal: React.FC<ApplicantPortalProps> = ({
  jobs,
  applications,
  onApplicationSubmitted,
}) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [linkedInText, setLinkedInText] = useState("");

  // Receipt Modal
  const [receiptApplication, setReceiptApplication] = useState<CandidateApplication | null>(null);

  // Tracking Search
  const [trackQuery, setTrackQuery] = useState("");
  const [trackedApp, setTrackedApp] = useState<CandidateApplication | null>(null);
  const [trackError, setTrackError] = useState(false);

  const publishedJobs = jobs.filter((j) => j.status === "published");

  const handleOpenApply = (job: Job) => {
    setSelectedJob(job);
    setIsApplying(true);
    setResumeText("");
    setLinkedInText("");
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !fullName.trim() || !email.trim() || !resumeText.trim()) return;

    const newApp = StorageService.submitApplication(
      selectedJob.id,
      fullName.trim(),
      email.trim(),
      phone.trim(),
      location.trim(),
      resumeText.trim(),
      linkedInText.trim() || undefined
    );

    setIsApplying(false);
    setReceiptApplication(newApp);
    onApplicationSubmitted(newApp);

    // Reset form
    setFullName("");
    setEmail("");
    setPhone("");
    setLocation("");
    setResumeText("");
    setLinkedInText("");
  };

  const handleTrackSearch = () => {
    setTrackError(false);
    if (!trackQuery.trim()) return;

    const found = applications.find(
      (a) =>
        a.anonymizedId.toLowerCase() === trackQuery.trim().toLowerCase() ||
        a.id.toLowerCase() === trackQuery.trim().toLowerCase() ||
        a.identityVault.email.toLowerCase() === trackQuery.trim().toLowerCase()
    );

    if (found) {
      setTrackedApp(found);
    } else {
      setTrackedApp(null);
      setTrackError(true);
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Hero Banner */}
      <div className="rounded-3xl border border-slate-800 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-900/60 to-slate-950 p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>FairHire Public Career Gateway • 100% Bias-Shield Protected</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight leading-tight mb-4">
          Merit-First, Unbiased Career Opportunities
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-8">
          Apply with zero bias. Your personal identity is partitioned into an isolated vault, ensuring our hiring team evaluates your application strictly on technical skills and demonstrable accomplishments.
        </p>

        {/* Track Application Quick Search */}
        <div className="max-w-md mx-auto flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 shadow-xl">
          <Search className="w-4 h-4 text-slate-500 ml-3 shrink-0" />
          <input
            type="text"
            value={trackQuery}
            onChange={(e) => setTrackQuery(e.target.value)}
            placeholder="Track code (e.g. Candidate #1001)"
            className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none px-2"
          />
          <button
            onClick={handleTrackSearch}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 shrink-0"
          >
            Track Status
          </button>
        </div>

        {/* Track result display */}
        {trackedApp && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/40 text-left max-w-md mx-auto space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">{trackedApp.anonymizedId}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                {trackedApp.applicantFacingStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Target Position: <strong className="text-slate-200">{jobs.find((j) => j.id === trackedApp.jobId)?.title || "Engineering Role"}</strong>
            </p>
            <p className="text-[11px] text-slate-500">
              Applied on {new Date(trackedApp.appliedDate).toLocaleDateString()}
            </p>
          </div>
        )}

        {trackError && (
          <p className="text-xs text-red-400 mt-4 animate-fadeIn">
            No application found matching that Candidate Code.
          </p>
        )}
      </div>

      {/* Published Vacancies Section */}
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-white">Open Vacancies ({publishedJobs.length})</h2>
            <p className="text-xs text-slate-400 mt-0.5">Explore published positions and locked evaluation rubrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {publishedJobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 hover:border-indigo-500/50 transition-all flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {job.department}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Deadline: {job.deadline}
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      {job.seniority} • {job.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {job.summary}
                </p>

                {/* Skills chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.requiredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-950 text-slate-300 border border-slate-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {job.vacancies} Open {job.vacancies === 1 ? "Vacancy" : "Vacancies"}
                </span>
                <button
                  onClick={() => handleOpenApply(job)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {publishedJobs.length === 0 && (
            <div className="col-span-2 rounded-2xl border border-dashed border-slate-800 p-12 text-center">
              <p className="text-xs text-slate-400">No vacancies published at this time.</p>
            </div>
          )}
        </div>
      </div>

      {/* Application Modal */}
      {isApplying && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsApplying(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display text-white">Apply for {selectedJob.title}</h2>
                <p className="text-xs text-slate-400">{selectedJob.department} • {selectedJob.location}</p>
              </div>
            </div>

            {/* Bias Shield Guarantee */}
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 mb-6 flex items-start gap-3 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong>Identity Vault Protection:</strong> Your personal contact details are stored in an isolated vault and completely redacted during evaluation. You will receive a neutral tracking code.
              </p>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.rivera@example.com"
                    className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Current Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                    className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Resume / Professional Evidence (Text / Paste) *
                </label>
                <textarea
                  required
                  rows={8}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your professional experience, technical skills, projects, and quantifiable achievements..."
                  className="w-full bg-slate-950 text-slate-200 font-mono text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Optional: Supplementary LinkedIn Export Text / URL Evidence
                </label>
                <textarea
                  rows={3}
                  value={linkedInText}
                  onChange={(e) => setLinkedInText(e.target.value)}
                  placeholder="Optional LinkedIn profile export or additional open-source portfolio evidence..."
                  className="w-full bg-slate-950 text-slate-200 font-mono text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsApplying(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                >
                  Submit Application with Bias Shield
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Traceable Receipt Modal */}
      {receiptApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold font-display text-white">Application Received!</h3>
              <p className="text-xs text-slate-400 mt-1">Your application is now securely partitioned in FairHire.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Your Candidate Code</span>
                <span className="font-mono text-sm font-bold text-emerald-400">{receiptApplication.anonymizedId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Initial Status</span>
                <span className="text-xs font-semibold text-slate-200">{receiptApplication.applicantFacingStatus}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Timestamp</span>
                <span className="text-[11px] text-slate-400">{new Date(receiptApplication.appliedDate).toLocaleTimeString()}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Save your candidate code. A confirmation notice has also been staged to your email address.
            </p>

            <button
              onClick={() => setReceiptApplication(null)}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              Done & Return to Career Gateway
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantPortal;
