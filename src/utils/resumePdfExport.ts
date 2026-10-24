import { jsPDF } from 'jspdf';
import { ATSStructuredResume } from '../types/analysis';

/**
 * Generates an ATS-compliant, recruiter-ready, professional PDF Resume.
 * Strictly adheres to ATS parsing standards:
 * - Single-column hierarchical layout
 * - Clean standard typography (Helvetica)
 * - Structured section headers with subtle dividers
 * - Indented bullet points with proper line-height
 * - Clean page breaks without cut-off sentences
 */
export function generateResumePDF(resume: ATSStructuredResume) {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const drawSectionHeader = (title: string) => {
    checkPageBreak(12);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(title.toUpperCase(), margin, y);

    // Subtle horizontal divider line under section title
    y += 1.5;
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.35);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  };

  // ─────────────────────────────────────────────
  // 1. Candidate Header
  // ─────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  const fullName = (resume.personalInfo.fullName || 'Candidate Name').toUpperCase();
  doc.text(fullName, margin, y);
  y += 5;

  if (resume.targetTitle) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(28, 25, 23); // warm stone ink #1C1917
    doc.text(resume.targetTitle, margin, y);
    y += 4.5;
  }

  // Contact line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  const contactParts = [
    resume.personalInfo.email,
    resume.personalInfo.phone,
    resume.personalInfo.location,
    resume.personalInfo.linkedin,
    resume.personalInfo.github,
    resume.personalInfo.portfolio,
  ].filter(Boolean);

  const contactText = contactParts.join('  |  ');
  const splitContact = doc.splitTextToSize(contactText, contentWidth);
  doc.text(splitContact, margin, y);
  y += splitContact.length * 4 + 1;

  // Header separator - Crisp professional ink rule
  doc.setDrawColor(28, 25, 23); // warm stone ink #1C1917
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 2;

  // ─────────────────────────────────────────────
  // 2. Professional Summary
  // ─────────────────────────────────────────────
  if (resume.professionalSummary) {
    drawSectionHeader('Professional Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85); // slate-700
    const splitSummary = doc.splitTextToSize(resume.professionalSummary, contentWidth);
    checkPageBreak(splitSummary.length * 4.2);
    doc.text(splitSummary, margin, y);
    y += splitSummary.length * 4.2 + 2;
  }

  // ─────────────────────────────────────────────
  // 3. Technical Skills (Grouped by Category)
  // ─────────────────────────────────────────────
  if (resume.technicalSkills?.length > 0) {
    drawSectionHeader('Technical Skills');
    resume.technicalSkills.forEach((cat) => {
      checkPageBreak(6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      const catTitle = `${cat.category}: `;
      doc.text(catTitle, margin, y);

      const catTitleWidth = doc.getTextWidth(catTitle);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const skillsStr = cat.skills.join(', ');
      const splitSkills = doc.splitTextToSize(skillsStr, contentWidth - catTitleWidth);

      doc.text(splitSkills[0], margin + catTitleWidth, y);
      y += 4;
      if (splitSkills.length > 1) {
        for (let i = 1; i < splitSkills.length; i++) {
          checkPageBreak(4);
          doc.text(splitSkills[i], margin + 4, y);
          y += 4;
        }
      }
    });
    y += 1;
  }

  // ─────────────────────────────────────────────
  // 4. Projects & Technical Achievements (XYZ Bullets)
  // ─────────────────────────────────────────────
  if (resume.projects?.length > 0) {
    drawSectionHeader('Projects');
    resume.projects.forEach((proj) => {
      checkPageBreak(12);

      // Project Title & Tech Stack
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(proj.title, margin, y);

      if (proj.techStack?.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        const stackText = `[${proj.techStack.join(', ')}]`;
        const stackWidth = doc.getTextWidth(stackText);
        doc.text(stackText, pageWidth - margin - stackWidth, y);
      }
      y += 4.5;

      // Bullets
      proj.bullets.forEach((bullet) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);

        const bulletIndent = 4;
        const textWidth = contentWidth - bulletIndent;
        const splitBullet = doc.splitTextToSize(bullet, textWidth);

        checkPageBreak(splitBullet.length * 4.2 + 1);

        // Draw bullet character
        doc.setTextColor(28, 25, 23); // clean professional bullet
        doc.text('•', margin + 0.5, y);

        // Draw bullet text
        doc.setTextColor(51, 65, 85);
        doc.text(splitBullet, margin + bulletIndent, y);
        y += splitBullet.length * 4.2 + 1.2;
      });
      y += 2;
    });
  }

  // ─────────────────────────────────────────────
  // 5. Work Experience (if present)
  // ─────────────────────────────────────────────
  if (resume.experience && resume.experience.length > 0) {
    drawSectionHeader('Experience');
    resume.experience.forEach((exp) => {
      checkPageBreak(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${exp.role} — ${exp.company}`, margin, y);

      if (exp.period) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        const periodWidth = doc.getTextWidth(exp.period);
        doc.text(exp.period, pageWidth - margin - periodWidth, y);
      }
      y += 4.5;

      exp.bullets.forEach((bullet) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const bulletIndent = 4;
        const splitBullet = doc.splitTextToSize(bullet, contentWidth - bulletIndent);
        checkPageBreak(splitBullet.length * 4.2 + 1);
        doc.setTextColor(28, 25, 23);
        doc.text('•', margin + 0.5, y);
        doc.setTextColor(51, 65, 85);
        doc.text(splitBullet, margin + bulletIndent, y);
        y += splitBullet.length * 4.2 + 1.2;
      });
      y += 2;
    });
  }

  // ─────────────────────────────────────────────
  // 6. Education
  // ─────────────────────────────────────────────
  if (resume.education && resume.education.length > 0) {
    drawSectionHeader('Education');
    resume.education.forEach((edu) => {
      checkPageBreak(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(edu.degree || 'Degree', margin, y);

      if (edu.year) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        const yearWidth = doc.getTextWidth(edu.year);
        doc.text(edu.year, pageWidth - margin - yearWidth, y);
      }
      y += 4.2;

      if (edu.institution) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const institutionText = edu.gpa ? `${edu.institution}  (CGPA / Grade: ${edu.gpa})` : edu.institution;
        const splitInst = doc.splitTextToSize(institutionText, contentWidth);
        doc.text(splitInst, margin, y);
        y += splitInst.length * 4.2;
      }
      y += 1.5;
    });
  }

  // ─────────────────────────────────────────────
  // 7. Certifications (if present)
  // ─────────────────────────────────────────────
  if (resume.certifications && resume.certifications.length > 0) {
    drawSectionHeader('Certifications & Credentials');
    resume.certifications.forEach((cert) => {
      if (!cert || !cert.trim()) return;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const splitCert = doc.splitTextToSize(`•  ${cert.trim()}`, contentWidth - 2);
      checkPageBreak(splitCert.length * 4 + 1);
      doc.text(splitCert, margin + 1, y);
      y += splitCert.length * 4 + 0.8;
    });
  }

  // Multi-page page numbers
  const totalPages = doc.getNumberOfPages();
  if (totalPages > 1) {
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 18, pageHeight - 6);
    }
  }

  // Clean filename
  const cleanName = (resume.personalInfo.fullName || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
  const roleSlug = (resume.targetTitle || 'ATS').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${cleanName}_${roleSlug}_Resume.pdf`;

  doc.save(filename);
}

