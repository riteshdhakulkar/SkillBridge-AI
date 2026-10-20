import { jsPDF } from 'jspdf';
import { SavedAnalysis, GeminiAnalysisResult } from '../types/analysis';
import { getScoreTier } from './score';

export async function generateAnalysisPDF(
  analysis: SavedAnalysis | GeminiAnalysisResult & { jobTitle?: string; companyName?: string; resumeSource?: string; createdAt?: string },
  isSavedAnalysis: boolean = true
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const primaryColor = [79, 70, 229];   // Indigo-600
  const darkColor = [15, 23, 42];       // Slate-900
  const mutedColor = [100, 116, 139];   // Slate-500
  const lightBg = [248, 250, 252];      // Slate-50
  const accentGreen = [16, 185, 129];   // Emerald-500
  const accentAmber = [245, 158, 11];   // Amber-500

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // ── Header Banner ──────────────────────────────────────────────────────────
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SkillBridge AI', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Professional Resume Evaluation & Career Fit Report', margin, 18);

  const reportDate = isSavedAnalysis && 'createdAt' in analysis && analysis.createdAt
    ? new Date(analysis.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  doc.text(`Generated: ${reportDate}`, pageWidth - margin, 15, { align: 'right' });

  y = 38;

  // ── Job Title & Company Banner ─────────────────────────────────────────────
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'F');

  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const roleTitle = ('jobTitle' in analysis && analysis.jobTitle) ? analysis.jobTitle : 'Target Role Evaluation';
  doc.text(roleTitle, margin + 4, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  const companyStr = ('companyName' in analysis && analysis.companyName) ? `Company: ${analysis.companyName}` : '';
  const sourceStr = ('resumeSource' in analysis && analysis.resumeSource) ? `Source: ${analysis.resumeSource}` : '';
  const metaSub = [companyStr, sourceStr].filter(Boolean).join('  |  ');
  if (metaSub) {
    doc.text(metaSub, margin + 4, y + 15);
  }

  // Match Score Badge on the right
  const score = analysis.matchScore ?? 0;
  const scoreText = `${score}% Match`;
  const scoreTier = getScoreTier(score);
  const scoreBadgeColor =
    scoreTier === 'strong' ? accentGreen : scoreTier === 'moderate' ? primaryColor : accentAmber;
  doc.setFillColor(scoreBadgeColor[0], scoreBadgeColor[1], scoreBadgeColor[2]);
  doc.roundedRect(pageWidth - margin - 28, y + 3, 24, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(scoreText, pageWidth - margin - 16, y + 13, { align: 'center' });

  y += 30;

  // ── Section Helper ─────────────────────────────────────────────────────────
  const addSectionTitle = (title: string) => {
    checkPageBreak(12);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, margin, y);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 8;
  };

  // ── 1. Demonstrated Skills ─────────────────────────────────────────────────
  if (analysis.matchedSkills?.length > 0) {
    addSectionTitle(`Demonstrated Skills (${analysis.matchedSkills.length})`);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    analysis.matchedSkills.forEach((ms) => {
      checkPageBreak(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(`• ${ms.skill}`, margin + 2, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      const catText = ms.category ? `[${ms.category}]` : '';
      doc.text(catText, margin + 35, y);

      y += 4;
      if (ms.context) {
        doc.setTextColor(70, 75, 85);
        const splitContext = doc.splitTextToSize(`Context: ${ms.context}`, contentWidth - 6);
        doc.text(splitContext, margin + 6, y);
        y += splitContext.length * 4 + 2;
      }
      y += 2;
    });
    y += 4;
  }

  // ── 2. Missing Skills & Gaps ───────────────────────────────────────────────
  if (analysis.missingSkills?.length > 0) {
    addSectionTitle(`Missing Skills & Gaps (${analysis.missingSkills.length})`);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    analysis.missingSkills.forEach((mis) => {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(`• ${mis.skill}`, margin + 2, y);

      const priorityStr = `Priority: ${mis.priority || 'Medium'}`;
      doc.text(priorityStr, pageWidth - margin - 25, y, { align: 'right' });
      y += 4;

      if (mis.reason) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        const splitReason = doc.splitTextToSize(`Why it matters: ${mis.reason}`, contentWidth - 6);
        doc.text(splitReason, margin + 6, y);
        y += splitReason.length * 4 + 2;
      }
      y += 2;
    });
    y += 4;
  }

  // ── 3. Extracted Resume Evidence ───────────────────────────────────────────
  if (analysis.resumeEvidence?.length > 0) {
    addSectionTitle(`Extracted Resume Evidence (${analysis.resumeEvidence.length})`);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    analysis.resumeEvidence.forEach((ev) => {
      checkPageBreak(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      const splitClaim = doc.splitTextToSize(ev.claim || '', contentWidth - 4);
      doc.text(splitClaim, margin + 2, y);
      y += splitClaim.length * 4;

      if (ev.alignment) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(accentGreen[0], accentGreen[1], accentGreen[2]);
        doc.text(`Alignment: ${ev.alignment}`, margin + 6, y);
        y += 4;
      }

      if (ev.evidence) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        const splitEvidence = doc.splitTextToSize(`Evidence: ${ev.evidence}`, contentWidth - 8);
        doc.text(splitEvidence, margin + 6, y);
        y += splitEvidence.length * 4;
      }
      y += 4;
    });
    y += 4;
  }

  // ── 4. AI Recommendations ──────────────────────────────────────────────────
  if (analysis.recommendations?.length > 0) {
    addSectionTitle('AI Recommendations');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

    analysis.recommendations.forEach((rec, idx) => {
      checkPageBreak(10);
      const recText = `${idx + 1}.  ${rec}`;
      const splitRec = doc.splitTextToSize(recText, contentWidth - 4);
      doc.text(splitRec, margin + 2, y);
      y += splitRec.length * 4 + 3;
    });
    y += 4;
  }

  // ── 5. Learning Roadmap ────────────────────────────────────────────────────
  if (analysis.learningRoadmap?.length > 0) {
    addSectionTitle('Personalized Learning Roadmap');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    analysis.learningRoadmap.forEach((item, idx) => {
      checkPageBreak(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(`Milestone ${idx + 1}: ${item.milestone}`, margin + 2, y);

      if (item.timeframe) {
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`(${item.timeframe})`, pageWidth - margin, y, { align: 'right' });
      }
      y += 5;

      if (item.actionItems?.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(70, 75, 85);
        item.actionItems.forEach((action) => {
          checkPageBreak(6);
          const splitAction = doc.splitTextToSize(`- ${action}`, contentWidth - 8);
          doc.text(splitAction, margin + 6, y);
          y += splitAction.length * 4;
        });
      }

      if (item.resourceSuggestion) {
        checkPageBreak(6);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`Recommended Resource: ${item.resourceSuggestion}`, margin + 6, y);
        y += 5;
      }
      y += 3;
    });
    y += 4;
  }

  // ── 6. Interview Questions ─────────────────────────────────────────────────
  if (analysis.interviewQuestions?.length > 0) {
    addSectionTitle('Targeted Interview Questions');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    analysis.interviewQuestions.forEach((q, idx) => {
      checkPageBreak(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      const qTitle = `Q${idx + 1}: ${q.question}`;
      const splitQ = doc.splitTextToSize(qTitle, contentWidth - 4);
      doc.text(splitQ, margin + 2, y);
      y += splitQ.length * 4 + 2;

      if (q.topic) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(`Topic: ${q.topic}`, margin + 6, y);
        y += 4;
      }

      if (q.expectedFocus) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(70, 75, 85);
        const splitFocus = doc.splitTextToSize(`Expected Focus: ${q.expectedFocus}`, contentWidth - 8);
        doc.text(splitFocus, margin + 6, y);
        y += splitFocus.length * 4 + 3;
      }
      y += 2;
    });
  }

  // ── Footer on all pages ────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('SkillBridge AI — Career Readiness & Resume Optimization Report', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  const safeFileNameRole = ('jobTitle' in analysis && analysis.jobTitle)
    ? analysis.jobTitle.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)
    : 'Resume_Analysis';
  const fileName = `SkillBridge-AI-Report-${safeFileNameRole}.pdf`;

  doc.save(fileName);
}
