import { jsPDF } from 'jspdf';
import { SavedAnalysis, GeminiAnalysisResult } from '../types/analysis';
import { getScoreTier } from './score';
import { getInterviewAnswer } from './interviewAnswers';

export type ExportableAnalysis = (SavedAnalysis | GeminiAnalysisResult) & {
  id?: number;
  jobTitle?: string;
  companyName?: string;
  resumeSource?: string;
  createdAt?: string;
};

export async function generateAnalysisPDF(
  analysis: ExportableAnalysis,
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

  const primaryColor = [28, 25, 23];    // Stone-900 warm ink
  const darkColor = [28, 25, 23];       // Stone-900
  const mutedColor = [120, 113, 108];   // Stone-500
  const bodyColor = [68, 64, 60];       // Stone-700
  const lightBg = [251, 251, 249];      // Warm alabaster
  const accentGreen = [5, 150, 105];    // Emerald-600
  const accentAmber = [217, 119, 6];    // Amber-600

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

  y += 28;

  // ── Match Score Explanation Banner ─────────────────────────────────────────
  const explanationTheme =
    scoreTier === 'strong'
      ? {
          title: 'Strong Qualification Match',
          summary:
            'The candidate profile demonstrates strong alignment with core job requirements and technical competencies. Direct evidence was found across primary qualifications.',
          bg: [236, 253, 245], // emerald-50
          border: [167, 243, 208], // emerald-200
          text: [6, 95, 70], // emerald-800
        }
      : scoreTier === 'moderate'
      ? {
          title: 'Moderate Match · High Potential',
          summary:
            'Good foundational alignment with key requirements. Targeted upskilling on identified gaps will significantly strengthen interview readiness and candidate competitiveness.',
          bg: [254, 243, 199], // amber-100/50
          border: [251, 191, 36], // amber-300
          text: [146, 64, 14], // amber-800
        }
      : {
          title: 'Developing Alignment',
          summary:
            'Notable qualification gaps identified between the resume and target job requirements. Focused preparation using the learning roadmap is recommended before applying.',
          bg: [255, 251, 235], // amber-50
          border: [253, 230, 138], // amber-200
          text: [146, 64, 14], // amber-800
        };

  doc.setFillColor(explanationTheme.bg[0], explanationTheme.bg[1], explanationTheme.bg[2]);
  doc.setDrawColor(explanationTheme.border[0], explanationTheme.border[1], explanationTheme.border[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

  doc.setTextColor(explanationTheme.text[0], explanationTheme.text[1], explanationTheme.text[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`Score Assessment: ${explanationTheme.title} (${score}%)`, margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const splitSummary = doc.splitTextToSize(explanationTheme.summary, contentWidth - 8);
  doc.text(splitSummary, margin + 4, y + 10.5);

  y += 22;

  // ── Section Helper ─────────────────────────────────────────────────────────
  const addSectionTitle = (title: string) => {
    checkPageBreak(14);
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
      const contextLines = ms.context ? doc.splitTextToSize(`Context: ${ms.context}`, contentWidth - 6) : [];
      const itemHeight = 6 + (contextLines.length > 0 ? contextLines.length * 4 + 2 : 0) + 2;
      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(`• ${ms.skill}`, margin + 2, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      const catText = ms.category ? `[${ms.category}]` : '';
      doc.text(catText, margin + 40, y);

      y += 4;
      if (contextLines.length > 0) {
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        doc.text(contextLines, margin + 6, y);
        y += contextLines.length * 4 + 2;
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
      const reasonLines = mis.reason ? doc.splitTextToSize(`Why it matters: ${mis.reason}`, contentWidth - 6) : [];
      const itemHeight = 6 + (reasonLines.length > 0 ? reasonLines.length * 4 + 2 : 0) + 2;
      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(`• ${mis.skill}`, margin + 2, y);

      const priorityStr = `Priority: ${mis.priority || 'Medium'}`;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentAmber[0], accentAmber[1], accentAmber[2]);
      doc.text(priorityStr, pageWidth - margin, y, { align: 'right' });
      y += 4;

      if (reasonLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(reasonLines, margin + 6, y);
        y += reasonLines.length * 4 + 2;
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
      const splitClaim = doc.splitTextToSize(ev.claim || '', contentWidth - 4);
      const splitEvidence = ev.evidence ? doc.splitTextToSize(`Evidence: ${ev.evidence}`, contentWidth - 8) : [];
      const itemHeight = (splitClaim.length * 4) + (ev.alignment ? 5 : 0) + (splitEvidence.length * 4) + 6;
      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(splitClaim, margin + 2, y);
      y += splitClaim.length * 4;

      if (ev.alignment) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(accentGreen[0], accentGreen[1], accentGreen[2]);
        doc.text(`Alignment: ${ev.alignment}`, margin + 6, y);
        y += 4;
      }

      if (splitEvidence.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
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
      const recText = `${idx + 1}.  ${rec}`;
      const splitRec = doc.splitTextToSize(recText, contentWidth - 4);
      checkPageBreak(splitRec.length * 4 + 4);
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
      checkPageBreak(16);
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
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        item.actionItems.forEach((action) => {
          const splitAction = doc.splitTextToSize(`• ${action}`, contentWidth - 8);
          checkPageBreak(splitAction.length * 4 + 2);
          doc.text(splitAction, margin + 6, y);
          y += splitAction.length * 4;
        });
      }

      if (item.resourceSuggestion) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        const splitRes = doc.splitTextToSize(`Recommended Resource: ${item.resourceSuggestion}`, contentWidth - 8);
        checkPageBreak(splitRes.length * 4 + 3);
        doc.text(splitRes, margin + 6, y);
        y += splitRes.length * 4 + 3;
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
      const qTitle = `Q${idx + 1}: ${q.question}`;
      const splitQ = doc.splitTextToSize(qTitle, contentWidth - 4);
      const splitFocus = q.expectedFocus ? doc.splitTextToSize(`Expected Focus: ${q.expectedFocus}`, contentWidth - 8) : [];
      const itemHeight = (splitQ.length * 4) + (q.topic ? 5 : 0) + (splitFocus.length * 4) + 6;
      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(splitQ, margin + 2, y);
      y += splitQ.length * 4 + 2;

      if (q.topic) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(`Topic: ${q.topic}`, margin + 6, y);
        y += 4;
      }

      if (splitFocus.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        doc.text(splitFocus, margin + 6, y);
        y += splitFocus.length * 4 + 3;
      }

      const modelAnswer = getInterviewAnswer(q);
      if (modelAnswer) {
        const splitAns = doc.splitTextToSize(`Model Answer: ${modelAnswer}`, contentWidth - 8);
        checkPageBreak(splitAns.length * 4 + 3);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(splitAns, margin + 6, y);
        y += splitAns.length * 4 + 3;
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

  const idPart = ('id' in analysis && analysis.id) ? `${analysis.id}` : '';
  const safeFileNameRole = ('jobTitle' in analysis && analysis.jobTitle)
    ? analysis.jobTitle.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)
    : 'Resume_Analysis';

  const fileName = idPart
    ? `SkillBridge-AI-Report-${idPart}.pdf`
    : `SkillBridge-AI-Report-${safeFileNameRole}.pdf`;

  doc.save(fileName);
}
