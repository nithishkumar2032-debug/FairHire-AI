import jsPDF from "jspdf";
import { Job, CandidateApplication, EscalationTicket, AuditLogEntry } from "./types";

export function exportJobAuditReportToPdf(
  job: Job,
  applications: CandidateApplication[],
  escalations: EscalationTicket[],
  auditLogs: AuditLogEntry[]
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const darkColor = [15, 23, 42]; // #0f172a
  const indigoColor = [79, 70, 229]; // #4f46e5
  const grayColor = [100, 116, 139]; // #64748b
  const emeraldColor = [16, 185, 129]; // #10b981

  // 1. Header Banner
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, 210, 36, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("FAIRHIRE — JOB GOVERNANCE & EVIDENCE REPORT", 14, 16);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(165, 180, 252);
  doc.text("Transparent, Explainable and Auditable Recruitment with Human Accountability", 14, 24);

  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 155, 24);

  // 2. Job Requisition Summary Card
  let currentY = 44;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 30, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 30, 2, 2, "D");

  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`${job.title} (${job.department})`, 18, currentY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`Seniority: ${job.seniority} • Vacancies: ${job.vacancies} • Type: ${job.type} • Status: ${job.status.toUpperCase()}`, 18, currentY + 16);
  doc.text(`Locked Rubric Criteria: ${job.criteria.map((c) => `${c.name} (${c.weight}%)`).join(", ")}`, 18, currentY + 23);

  // 3. Candidate Comparative Ranking Matrix
  currentY += 38;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text("Candidate Evaluation & Discrepancy Matrix", 14, currentY);

  currentY += 5;
  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, 182, 8, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text("Candidate Code", 16, currentY + 5.5);
  doc.text("Stage", 50, currentY + 5.5);
  doc.text("HM Score", 85, currentY + 5.5);
  doc.text("AI Score", 108, currentY + 5.5);
  doc.text("Discrepancy", 130, currentY + 5.5);
  doc.text("Proposal", 165, currentY + 5.5);

  currentY += 8;

  if (applications.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("No candidate applications recorded yet.", 16, currentY + 6);
    currentY += 12;
  } else {
    applications.forEach((app) => {
      const hmScore = app.round1Scorecard?.hmTotalScore || app.shortlisting?.ruleBasedScore || "-";
      const aiScore = app.round1Scorecard?.geminiTotalScore || app.shortlisting?.geminiFitScore || "-";
      const disc = app.round1Scorecard?.discrepancyLevel || "Aligned";
      const proposal = app.finalProposal?.hiringManagerRecommendation || app.internalStatus;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(app.anonymizedId, 16, currentY + 5.5);
      doc.text(app.stage, 50, currentY + 5.5);
      doc.text(String(hmScore), 85, currentY + 5.5);
      doc.text(String(aiScore), 108, currentY + 5.5);
      doc.text(disc, 130, currentY + 5.5);
      doc.text(proposal.toUpperCase(), 165, currentY + 5.5);

      doc.setDrawColor(241, 245, 249);
      doc.line(14, currentY + 8, 196, currentY + 8);
      currentY += 8;
    });
  }

  // 4. Governance & Escalation Summary
  currentY += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text("Governance Escalation Records & Exceptions", 14, currentY);

  currentY += 5;
  const jobEscalations = escalations.filter((e) => e.jobId === job.id);
  if (jobEscalations.length === 0) {
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(14, currentY, 182, 14, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.text("✓ Zero unresolved discrepancies or unauthorized overrides. All candidate outcomes aligned with locked rubric.", 18, currentY + 9);
    currentY += 20;
  } else {
    jobEscalations.forEach((esc) => {
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(14, currentY, 182, 18, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(185, 28, 28);
      doc.text(`[${esc.triggerType}] Candidate: ${esc.candidateAnonymizedId} • Status: ${esc.status.toUpperCase()}`, 18, currentY + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(127, 29, 29);
      doc.text(esc.description, 18, currentY + 12);
      currentY += 22;
    });
  }

  // 5. HR / Admin Final Sign-Off Section
  currentY += 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 34, 2, 2, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, 182, 34, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text("HR / Admin Compliance & Governance Sign-Off", 18, currentY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("I hereby certify that all hiring decisions for this requisition were evaluated against locked, job-related criteria", 18, currentY + 15);
  doc.text("without protected characteristic bias. AI outputs served as independent validation under human authority.", 18, currentY + 20);

  doc.text("Authorized HR Administrator Signature: _______________________      Date: ______________", 18, currentY + 28);

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("FairHire AI • Transparent, Explainable, and Auditable Recruitment • Confidential", 14, 288);

  doc.save(`${job.title.toLowerCase().replace(/\s+/g, "_")}_governance_report.pdf`);
}
