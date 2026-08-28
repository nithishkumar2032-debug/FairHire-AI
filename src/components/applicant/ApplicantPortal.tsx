"use client";

import React, { useState, useRef } from "react";
import {
  Briefcase,
  ShieldCheck,
  Search,
  ArrowRight,
  Upload,
  CheckCircle2,
  FileText,
  Lock,
  Sparkles,
  MapPin,
  Clock,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Copy,
  Check,
  Paperclip,
  Trash2,
  File,
  AlertCircle
} from "lucide-react";
import { Job, CandidateApplication } from "@/lib/types";
import { StorageService } from "@/lib/storage";

interface ApplicantPortalProps {
  jobs: Job[];
  applications: CandidateApplication[];
  onApplicationSubmitted: () => void;
}

export const ApplicantPortal: React.FC<ApplicantPortalProps> = ({
  jobs,
  applications,
  onApplicationSubmitted,
}) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [linkedInText, setLinkedInText] = useState("");

  // File Upload State
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [resumeFileSize, setResumeFileSize] = useState<number | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeParseError, setResumeParseError] = useState<string | null>(null);

  const [linkedInFileName, setLinkedInFileName] = useState<string | null>(null);
  const [isParsingLinkedIn, setIsParsingLinkedIn] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation Receipt State
  const [submittedReceipt, setSubmittedReceipt] = useState<CandidateApplication | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Status Lookup State
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResult, setLookupResult] = useState<CandidateApplication | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const linkedInInputRef = useRef<HTMLInputElement>(null);

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setIsApplying(true);
    setSubmittedReceipt(null);
    setResumeFileName(null);
    setResumeFileSize(null);
    setResumeParseError(null);
    setLinkedInFileName(null);
  };

  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingResume(true);
    setResumeParseError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse document.");
      }

      setResumeText(data.text);
      setResumeFileName(file.name);
      setResumeFileSize(file.size);
    } catch (err: any) {
      console.error("Resume file parsing error:", err);
      setResumeParseError(err?.message || "Failed to extract text from file.");
    } finally {
      setIsParsingResume(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  };

  const handleLinkedInFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingLinkedIn(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse document.");
      }

      setLinkedInText(data.text);
      setLinkedInFileName(file.name);
    } catch (err: any) {
      console.error("LinkedIn file parsing error:", err);
    } finally {
      setIsParsingLinkedIn(false);
      if (linkedInInputRef.current) linkedInInputRef.current.value = "";
    }
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !fullName.trim() || !email.trim() || !resumeText.trim()) return;

    setIsSubmitting(true);

    try {
      const newApp = StorageService.submitApplication(
        selectedJob.id,
        fullName.trim(),
        email.trim(),
        phone.trim(),
        location.trim(),
        resumeText.trim(),
        linkedInText.trim() || undefined
      );

      setSubmittedReceipt(newApp);
      setIsApplying(false);
      // Reset form
      setFullName("");
      setEmail("");
      setPhone("");
      setLocation("");
      setResumeText("");
      setLinkedInText("");
      setResumeFileName(null);
      setResumeFileSize(null);
      setLinkedInFileName(null);
      onApplicationSubmitted();
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    if (!lookupQuery.trim()) {
      setLookupResult(null);
      return;
    }
    const found = applications.find(
      (a) =>
        a.anonymizedId.toLowerCase() === lookupQuery.trim().toLowerCase() ||
        a.id.toLowerCase() === lookupQuery.trim().toLowerCase()
    );
    setLookupResult(found || null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="text-center space-y-3 py-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Auditable, Bias-Free Recruitment Portal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary tracking-tight">
          Explore Open Opportunities
        </h1>
        <p className="text-sm text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          FairHire guarantees that candidate evidence is evaluated strictly against locked, job-related criteria. Your personal identity is cryptographically separated in our Identity Vault during preliminary shortlisting.
        </p>
      </div>

      {/* Submission Success Receipt Card */}
      {submittedReceipt && (
        <div className="p-6 rounded-xl border border-emerald-300 bg-emerald-50/50 shadow-subtle space-y-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-emerald-950 text-base">Application Successfully Submitted!</h3>
              <p className="text-xs text-emerald-800">Your neutral candidate tracking receipt has been created.</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-surface-container-lowest border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">
                Your Neutral Candidate Tracking ID
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl font-headline font-bold text-primary">{submittedReceipt.anonymizedId}</span>
                <button
                  onClick={() => copyToClipboard(submittedReceipt.anonymizedId)}
                  className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
                  title="Copy Candidate ID"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-xs text-on-surface-variant space-y-0.5">
              <p>Status: <strong className="text-secondary">{submittedReceipt.applicantFacingStatus}</strong></p>
              <p>Submitted: <span className="text-primary font-medium">{new Date(submittedReceipt.appliedDate).toLocaleDateString()}</span></p>
            </div>
          </div>

          <p className="text-xs text-emerald-900 leading-relaxed">
            Please save your tracking ID (<code>{submittedReceipt.anonymizedId}</code>). You can check your review status at any time below without creating an account.
          </p>
        </div>
      )}

      {/* Track Application Status Bar */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 shadow-subtle space-y-3">
        <h3 className="font-headline font-bold text-sm text-primary flex items-center gap-2">
          <Search className="w-4 h-4 text-secondary" />
          Track Existing Application Status
        </h3>
        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            type="text"
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            placeholder="Enter Candidate Tracking ID (e.g. Candidate #1001)..."
            className="flex-1 bg-surface text-primary text-xs px-3.5 py-2.5 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-subtle font-medium"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-secondary hover:bg-secondary-container text-white text-xs font-semibold transition-all shadow-subtle"
          >
            Check Status
          </button>
        </form>

        {hasSearched && (
          <div className="pt-2 border-t border-outline-variant/20">
            {lookupResult ? (
              <div className="p-3.5 rounded-lg bg-surface border border-outline-variant/30 flex items-center justify-between text-xs">
                <div>
                  <span className="font-headline font-bold text-primary">{lookupResult.anonymizedId}</span>
                  <p className="text-[11px] text-on-surface-variant">Applied: {new Date(lookupResult.appliedDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-secondary">{lookupResult.applicantFacingStatus}</span>
                  <p className="text-[10px] text-on-surface-variant">Stage: {lookupResult.stage}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-error font-medium">No application found matching that ID.</p>
            )}
          </div>
        )}
      </div>

      {/* Live Job Requisitions List */}
      <div className="space-y-4">
        <h2 className="font-headline font-bold text-lg text-primary">Open Positions ({jobs.length})</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-subtle space-y-4 flex flex-col justify-between hover:shadow-card transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-fixed/40 text-on-primary-fixed border border-primary-fixed">
                    {job.department}
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Deadline: {job.deadline}
                  </span>
                </div>

                <div>
                  <h3 className="font-headline font-bold text-base text-primary group-hover:text-secondary transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
                    {job.summary}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.requiredSkills.slice(0, 4).map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-surface text-on-surface-variant border border-outline-variant/30 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.requiredSkills.length > 4 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface text-on-surface-variant border border-outline-variant/30 font-medium">
                      +{job.requiredSkills.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-medium">
                  {job.type} • <strong className="text-primary">{job.seniority}</strong>
                </span>
                <button
                  onClick={() => handleApplyClick(job)}
                  className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary-container text-white text-xs font-semibold flex items-center gap-1.5 shadow-subtle transition-all hover:scale-[1.02]"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Application Modal */}
      {isApplying && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-6 sm:p-8 shadow-elevated text-primary max-h-[90vh] overflow-y-auto space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/20">
                  Application Form
                </span>
                <span className="text-xs text-on-surface-variant">{selectedJob.title}</span>
              </div>
              <h2 className="font-headline font-bold text-xl text-primary">Submit Candidate Evidence</h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Your personal identity is stored in an isolated Identity Vault and will not be displayed to evaluators during shortlisting.
              </p>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
              {/* Personal Info Grid */}
              <div className="p-4 rounded-lg bg-surface border border-outline-variant/30 space-y-3">
                <span className="font-headline font-bold text-primary block text-xs flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-secondary" />
                  Identity Vault Credentials (Protected & Partitioned)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-primary mb-1">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full bg-surface-container-lowest text-primary px-3 py-2 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-primary mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.morgan@example.com"
                      className="w-full bg-surface-container-lowest text-primary px-3 py-2 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-primary mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full bg-surface-container-lowest text-primary px-3 py-2 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-primary mb-1">Location / Timezone</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="San Francisco, CA (PST)"
                      className="w-full bg-surface-container-lowest text-primary px-3 py-2 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Resume Upload / Paste Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-primary">
                    Resume Document & Evidence *
                  </label>
                  <span className="text-[11px] text-on-surface-variant">
                    Supports PDF, DOCX, DOC, TXT
                  </span>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={resumeInputRef}
                  onChange={handleResumeFileUpload}
                  accept=".pdf,.docx,.doc,.txt,.md"
                  className="hidden"
                />

                {/* Upload Button / Dropzone */}
                {resumeFileName ? (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-headline font-bold text-xs text-emerald-950">{resumeFileName}</p>
                        <p className="text-[10px] text-emerald-700">
                          {resumeFileSize ? formatBytes(resumeFileSize) : "Uploaded"} • Extracted successfully
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setResumeFileName(null);
                        setResumeFileSize(null);
                        setResumeText("");
                      }}
                      className="text-error hover:bg-error-container/40 p-1.5 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => resumeInputRef.current?.click()}
                    className="p-4 rounded-lg border-2 border-dashed border-outline-variant/50 hover:border-secondary bg-surface hover:bg-surface-container-low transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-1.5"
                  >
                    {isParsingResume ? (
                      <div className="flex items-center gap-2 text-secondary py-2">
                        <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                        <span className="font-semibold text-xs">Extracting text from document...</span>
                      </div>
                    ) : (
                      <>
                        <div className="p-2 rounded-full bg-secondary/10 text-secondary">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="font-headline font-bold text-xs text-primary">
                          Click to upload or drag & drop Resume PDF / DOCX
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          Our system will extract and anonymize your professional experience automatically.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {resumeParseError && (
                  <p className="text-[11px] text-error flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {resumeParseError}
                  </p>
                )}

                {/* Extracted Resume Text (Editable) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      Extracted Resume Content (Review or Edit)
                    </span>
                    {resumeText && (
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        ✓ {resumeText.length} characters extracted
                      </span>
                    )}
                  </div>
                  <textarea
                    required
                    rows={6}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Or paste your resume text directly here..."
                    className="w-full bg-surface text-primary font-mono text-xs p-3 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Optional LinkedIn Export */}
              <div className="space-y-2 pt-2 border-t border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-primary">
                    Supplementary LinkedIn PDF Export (Optional)
                  </label>
                  <input
                    type="file"
                    ref={linkedInInputRef}
                    onChange={handleLinkedInFileUpload}
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => linkedInInputRef.current?.click()}
                    className="text-[11px] font-bold text-secondary hover:text-secondary-container flex items-center gap-1"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attach LinkedIn PDF</span>
                  </button>
                </div>

                {linkedInFileName && (
                  <div className="p-2 rounded-lg bg-surface border border-outline-variant/30 flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary">{linkedInFileName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkedInFileName(null);
                        setLinkedInText("");
                      }}
                      className="text-error hover:text-error/80"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <textarea
                  rows={2}
                  value={linkedInText}
                  onChange={(e) => setLinkedInText(e.target.value)}
                  placeholder="Paste optional text from a LinkedIn PDF export or portfolio..."
                  className="w-full bg-surface text-primary font-mono text-xs p-2.5 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsApplying(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !fullName.trim() || !email.trim() || !resumeText.trim()}
                  className="px-6 py-2.5 rounded-lg bg-secondary hover:bg-secondary-container disabled:opacity-50 text-white text-xs font-bold shadow-subtle flex items-center gap-2 transition-all hover:scale-[1.01]"
                >
                  {isSubmitting ? "Submitting Application..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantPortal;
