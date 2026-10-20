import React, { useEffect, useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  Compass,
  MessageSquare,
  Loader2,
  Trash2,
  Download,
} from 'lucide-react';
import { SavedAnalysis } from '../types/analysis';
import { generateAnalysisPDF } from '../utils/pdfExport';

interface AnalysisDetailModalProps {
  analysis: SavedAnalysis | null;
  onClose: () => void;
  onRetest: (roleTitle: string) => void;
  onDelete?: (id: number) => void;
}

type Tab = 'overview' | 'roadmap' | 'interview';

function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const AnalysisDetailModal: React.FC<AnalysisDetailModalProps> = ({
  analysis,
  onClose,
  onRetest,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [deleting, setDeleting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    setActiveTab('overview');
    setDeleting(false);
    setDownloadingPdf(false);
  }, [analysis]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (analysis) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [analysis, onClose]);

  if (!analysis) return null;

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    onClose();
    onDelete(analysis.id);
  };

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      await generateAnalysisPDF(analysis, true);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const scoreColor =
    analysis.matchScore >= 80
      ? 'text-emerald-700'
      : analysis.matchScore >= 65
      ? 'text-indigo-700'
      : 'text-amber-700';

  const scoreBg =
    analysis.matchScore >= 80
      ? 'bg-emerald-50 border-emerald-200'
      : analysis.matchScore >= 65
      ? 'bg-indigo-50 border-indigo-100'
      : 'bg-amber-50 border-amber-200';

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',  label: 'Overview',  icon: <FileText   className="h-3.5 w-3.5" /> },
    { id: 'roadmap',   label: 'Roadmap',   icon: <Compass    className="h-3.5 w-3.5" /> },
    { id: 'interview', label: 'Interview', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 z-10 overflow-hidden my-8">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Analysis Breakdown</h2>
              <p className="text-xs text-slate-500 truncate max-w-[320px]">{analysis.resumeSource}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-50"
              title="Download professional PDF report"
            >
              {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Score + Meta banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div>
            {analysis.companyName && (
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
                <Building2 className="h-3.5 w-3.5" />
                <span>{analysis.companyName}</span>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1 text-slate-500 font-normal">
                  <Calendar className="h-3 w-3" />
                  {formatDate(analysis.createdAt)}
                </span>
              </div>
            )}
            {!analysis.companyName && (
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                <Calendar className="h-3 w-3" />
                {formatDate(analysis.createdAt)}
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-900">{analysis.jobTitle || 'Untitled Role'}</h3>
          </div>
          <div className={`flex items-center gap-2 self-start sm:self-auto rounded-lg border px-4 py-2 ${scoreBg}`}>
            <div className="text-right">
              <div className={`text-2xl font-black tabular-nums ${scoreColor}`}>{analysis.matchScore}%</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Match Score</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/30 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 max-h-[55vh] overflow-y-auto">

          {/* ── Overview Tab ─────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <>
              {/* Matched Skills */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Demonstrated Skills ({analysis.matchedSkills?.length ?? 0})
                </h4>
                {analysis.matchedSkills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.matchedSkills.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-medium text-emerald-800"
                        title={s.context}
                      >
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        {s.skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No matched skills recorded.</p>
                )}
              </div>

              {/* Missing Skills */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Missing Skills ({analysis.missingSkills?.length ?? 0})
                </h4>
                {analysis.missingSkills?.length > 0 ? (
                  <div className="space-y-2">
                    {analysis.missingSkills.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-amber-200/70 bg-amber-50/40 px-3.5 py-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">{s.skill}</span>
                          {s.reason && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{s.reason}</p>
                          )}
                        </div>
                        <span className={`ml-3 text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          s.priority === 'High' ? 'bg-red-100 text-red-700' :
                          s.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{s.priority}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No missing skills recorded.</p>
                )}
              </div>

              {/* Recommendations */}
              {analysis.recommendations?.length > 0 && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Recommendations
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="mt-0.5 h-4 w-4 shrink-0 inline-flex items-center justify-center rounded-full bg-indigo-200 text-[10px] font-bold text-indigo-700">
                          {i + 1}
                        </span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* ── Roadmap Tab ───────────────────────────────────────── */}
          {activeTab === 'roadmap' && (
            <>
              {analysis.learningRoadmap?.length > 0 ? (
                <ol className="space-y-4">
                  {analysis.learningRoadmap.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                          {i + 1}
                        </div>
                        {i < analysis.learningRoadmap.length - 1 && (
                          <div className="flex-1 w-px bg-indigo-200 my-1" />
                        )}
                      </div>
                      <div className="pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">{step.milestone}</span>
                          <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                            {step.timeframe}
                          </span>
                        </div>
                        {step.actionItems?.length > 0 && (
                          <ul className="mt-1.5 space-y-1">
                            {step.actionItems.map((item, j) => (
                              <li key={j} className="flex items-start gap-1.5 text-xs text-slate-600">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                        {step.resourceSuggestion && (
                          <p className="mt-1.5 text-[11px] text-indigo-600 font-medium">
                            📚 {step.resourceSuggestion}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-8">No roadmap data available.</p>
              )}
            </>
          )}

          {/* ── Interview Tab ─────────────────────────────────────── */}
          {activeTab === 'interview' && (
            <>
              {analysis.interviewQuestions?.length > 0 ? (
                <ol className="space-y-4">
                  {analysis.interviewQuestions.map((q, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 h-5 w-5 shrink-0 inline-flex items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                          {i + 1}
                        </span>
                        <p className="text-sm font-semibold text-slate-900">{q.question}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap pl-7">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {q.topic}
                        </span>
                      </div>
                      {q.expectedFocus && (
                        <p className="pl-7 text-[11px] text-slate-500 leading-relaxed">{q.expectedFocus}</p>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-8">No interview questions available.</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer disabled:opacity-50 ml-3"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRetest(analysis.jobTitle || '');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <span>Re-analyze for this Role</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
