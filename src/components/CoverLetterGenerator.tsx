import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  Mail,
  Sparkles,
  Copy,
  Check,
  Download,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileText,
  Building2,
  Send,
} from 'lucide-react';
import { CoverLetterResult } from '../types/analysis';

interface CoverLetterGeneratorProps {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  resumeText: string;
}

export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  jobTitle,
  companyName,
  jobDescription,
  resumeText,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverData, setCoverData] = useState<CoverLetterResult | null>(null);
  const [editableLetter, setEditableLetter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: jobTitle || 'Target Position',
          companyName: companyName || 'Target Company',
          jobDescription,
          resumeText,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate cover letter.');
      }
      setCoverData(data.data);
      setEditableLetter(data.data.letter);
    } catch (err: any) {
      setError(err.message || 'Failed to generate cover letter.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!editableLetter) return;
    navigator.clipboard?.writeText(editableLetter);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2200);
  };

  const handleCopySubject = () => {
    if (!coverData?.subjectLine) return;
    navigator.clipboard?.writeText(coverData.subjectLine);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2200);
  };

  const handleDownload = () => {
    if (!editableLetter) return;
    const blob = new Blob([editableLetter], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cover-Letter-${(companyName || 'TargetCompany').replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (!editableLetter) return;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);

    const splitText = doc.splitTextToSize(editableLetter, contentWidth);
    let y = margin;
    const lineHeight = 5.2;

    splitText.forEach((line: string) => {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });

    const filename = `Cover-Letter-${(companyName || 'TargetCompany').replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {!coverData && !isGenerating && (
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-stone-50 p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-sm">
            <Mail className="h-7 w-7 text-amber-400" />
          </div>
          <div className="max-w-xl mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-stone-900">
              Personalized AI Cover Letter
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Synthesizes your actual project accomplishments with the target role at <span className="font-semibold text-stone-900">{companyName || 'the target company'}</span> into an executive 3-paragraph cover letter tailored to the job description.
            </p>
          </div>

          {error && (
            <div className="max-w-md mx-auto p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-6 py-3 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:from-amber-500 hover:to-orange-500 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate Cover Letter for {jobTitle || 'Target Role'}</span>
          </button>
        </div>
      )}

      {isGenerating && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-12 text-center space-y-3 animate-in fade-in">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-amber-200/80">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          </div>
          <h4 className="text-sm font-bold text-stone-900">Drafting Tailored Cover Letter...</h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Connecting candidate projects to employer requirements and structuring a persuasive narrative.
          </p>
        </div>
      )}

      {coverData && !isGenerating && (
        <div className="space-y-6">
          {/* Key Selling Points Banner */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>Key Selling Points Used:</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {coverData.keyHooks.map((hook, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-800 bg-white px-3 py-1 rounded-full border border-stone-200 shadow-2xs"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span>{hook}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Email Subject Line Card */}
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Suggested Email Subject Line
              </span>
              <p className="text-xs font-semibold text-stone-800">{coverData.subjectLine}</p>
            </div>
            <button
              type="button"
              onClick={handleCopySubject}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 hover:text-amber-950 bg-white hover:bg-stone-50 px-2.5 py-1 rounded-md border border-stone-200 transition-colors shadow-2xs cursor-pointer"
            >
              {copiedSubject ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-stone-500" />
                  <span>Copy Subject</span>
                </>
              )}
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3 flex-wrap shadow-2xs">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-700" />
              <span className="text-xs font-bold text-stone-800">Formal Cover Letter Draft</span>
              <span className="text-[10px] text-stone-400 font-normal">(Editable below)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
              >
                {copiedLetter ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-stone-500" />
                    <span>Copy Letter</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download (PDF)</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-stone-500" />
                <span>Download (.txt)</span>
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                title="Regenerate Cover Letter"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>Regenerate</span>
              </button>
            </div>
          </div>

          {/* Editable Cover Letter Paper */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs">
            <textarea
              value={editableLetter}
              onChange={(e) => setEditableLetter(e.target.value)}
              rows={16}
              className="w-full font-serif text-sm text-stone-800 leading-relaxed p-4 rounded-xl border border-stone-200 bg-stone-50/40 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};

