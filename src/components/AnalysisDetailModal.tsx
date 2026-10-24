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
  Copy,
  Check,
} from 'lucide-react';
import { SavedAnalysis } from '../types/analysis';
import { generateAnalysisPDF } from '../utils/pdfExport';
import { getScoreTheme } from '../utils/score';
import { getInterviewAnswer } from '../utils/interviewAnswers';

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
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [copiedModalQuestionIdx, setCopiedModalQuestionIdx] = useState<number | null>(null);

  const handleCopyModalAnswer = (text: string, idx: number) => {
    navigator.clipboard?.writeText(text);
    setCopiedModalQuestionIdx(idx);
    setTimeout(() => setCopiedModalQuestionIdx(null), 2200);
  };

  useEffect(() => {
    setActiveTab('overview');
    setDeleting(false);
    setDownloadingPdf(false);
    setPdfError(null);
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
    setPdfError(null);
    try {
      await generateAnalysisPDF(analysis, true);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setPdfError(err?.message || 'Failed to generate PDF report. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const scoreTheme = getScoreTheme(analysis.matchScore);
  const scoreColor = scoreTheme.text;
  const scoreBg = `${scoreTheme.bg} ${scoreTheme.border}`;

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
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#FAF7F2] shadow-2xl border border-[#b7a89a]/50 z-10 overflow-hidden my-8">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#b7a89a]/35 px-6 py-4 bg-[#e8dcc6]/35">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#722f37] text-[#FAF7F2]">
              <FileText className="h-4 w-4 text-[#e8dcc6]" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#231815]">Analysis Breakdown</h2>
              <p className="text-xs text-[#574943] truncate max-w-[320px]">{analysis.resumeSource}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#b7a89a]/50 bg-[#FAF7F2] px-3 py-1.5 text-xs font-bold text-[#722f37] hover:bg-[#e8dcc6]/40 transition-colors cursor-pointer disabled:opacity-50"
              title="Download professional PDF report"
            >
              {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span>{downloadingPdf ? 'Generating...' : 'Download PDF Report'}</span>
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

        {/* PDF error banner if any */}
        {pdfError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{pdfError}</span>
            </div>
            <button
              type="button"
              onClick={() => setPdfError(null)}
              className="text-rose-500 hover:text-rose-700 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Score + Meta banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div>
            {analysis.companyName && (
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 mb-1">
                <Building2 className="h-3.5 w-3.5" />
                <span>{analysis.companyName}</span>
                <span className="text-stone-300">·</span>
                <span className="flex items-center gap-1 text-stone-500 font-normal">
                  <Calendar className="h-3 w-3" />
                  {formatDate(analysis.createdAt)}
                </span>
              </div>
            )}
            {!analysis.companyName && (
              <div className="flex items-center gap-1 text-xs text-stone-500 mb-1">
                <Calendar className="h-3 w-3" />
                {formatDate(analysis.createdAt)}
              </div>
            )}
            <h3 className="text-lg font-bold text-stone-900">{analysis.jobTitle || 'Untitled Role'}</h3>
          </div>
          <div className={`flex items-center gap-2 self-start sm:self-auto rounded-lg border px-4 py-2 ${scoreBg}`}>
            <div className="text-right">
              <div className={`text-2xl font-black tabular-nums ${scoreColor}`}>{analysis.matchScore}%</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Match Score</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#b7a89a]/35 bg-[#e8dcc6]/25 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#722f37] text-[#722f37]'
                  : 'border-transparent text-[#574943] hover:text-[#231815]'
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#231815] flex items-center gap-1.5 mb-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Demonstrated Skills ({analysis.matchedSkills?.length ?? 0})
                </h4>
                {analysis.matchedSkills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.matchedSkills.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-800"
                        title={s.context}
                      >
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        {s.skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#574943] italic">No matched skills recorded.</p>
                )}
              </div>

              {/* Missing Skills */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#231815] flex items-center gap-1.5 mb-2.5">
                  <AlertCircle className="h-4 w-4 text-[#722f37]" />
                  Missing Skills ({analysis.missingSkills?.length ?? 0})
                </h4>
                {analysis.missingSkills?.length > 0 ? (
                  <div className="space-y-2">
                    {analysis.missingSkills.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl border border-[#b7a89a]/40 bg-[#e8dcc6]/20 px-3.5 py-2 text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#231815]">{s.skill}</span>
                          {s.reason && (
                            <p className="text-[11px] text-[#574943] mt-0.5">{s.reason}</p>
                          )}
                        </div>
                        <span className={`ml-3 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          s.priority === 'High' ? 'bg-[#722f37] text-[#FAF7F2]' :
                          s.priority === 'Medium' ? 'bg-[#e8dcc6] text-[#231815]' :
                          'bg-[#FAF7F2] text-[#574943] border border-[#b7a89a]/40'
                        }`}>{s.priority} Priority</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#574943] italic">No missing skills recorded.</p>
                )}
              </div>

              {/* Resume Evidence */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#231815] flex items-center gap-1.5 mb-2.5">
                  <FileText className="h-4 w-4 text-[#722f37]" />
                  Resume Evidence ({analysis.resumeEvidence?.length ?? 0})
                </h4>
                {analysis.resumeEvidence?.length > 0 ? (
                  <div className="space-y-2">
                    {analysis.resumeEvidence.map((ev, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-[#b7a89a]/40 bg-[#FAF7F2] px-3.5 py-2.5 text-xs space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-[#231815]">{ev.claim}</span>
                          {ev.alignment && (
                            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {ev.alignment}
                            </span>
                          )}
                        </div>
                        {ev.evidence && (
                          <p className="text-[11px] text-[#574943] leading-relaxed">
                            <span className="font-bold text-[#231815]">Evidence: </span>
                            {ev.evidence}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#574943] italic">No resume evidence recorded.</p>
                )}
              </div>

              {/* Recommendations */}
              {analysis.recommendations?.length > 0 && (
                <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#e8dcc6]/30 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#722f37]">
                    <Sparkles className="h-3.5 w-3.5 text-[#722f37]" />
                    AI Recommendations
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#574943]">
                        <span className="mt-0.5 h-4 w-4 shrink-0 inline-flex items-center justify-center rounded-full bg-[#722f37] text-[10px] font-bold text-[#FAF7F2]">
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
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#722f37] text-[#FAF7F2] text-xs font-bold">
                          {i + 1}
                        </div>
                        {i < analysis.learningRoadmap.length - 1 && (
                          <div className="flex-1 w-px bg-[#b7a89a]/50 my-1" />
                        )}
                      </div>
                      <div className="pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#231815]">{step.milestone}</span>
                          <span className="inline-flex items-center rounded-full bg-[#e8dcc6]/60 border border-[#b7a89a]/50 px-2 py-0.5 text-[10px] font-bold text-[#722f37]">
                            {step.timeframe}
                          </span>
                        </div>
                        {step.actionItems?.length > 0 && (
                          <ul className="mt-1.5 space-y-1">
                            {step.actionItems.map((item, j) => (
                              <li key={j} className="flex items-start gap-1.5 text-xs text-[#574943]">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#722f37]" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                        {step.resourceSuggestion && (
                          <p className="mt-1.5 text-[11px] text-[#722f37] font-semibold">
                            📚 {step.resourceSuggestion}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-[#574943] italic text-center py-8">No roadmap data available.</p>
              )}
            </>
          )}

          {/* ── Interview Tab ─────────────────────────────────────── */}
          {activeTab === 'interview' && (
            <>
              {analysis.interviewQuestions?.length > 0 ? (
                <ol className="space-y-4">
                  {analysis.interviewQuestions.map((q, i) => {
                    const answer = getInterviewAnswer(q);
                    return (
                      <li
                        key={i}
                        className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-4 space-y-2"
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 h-5 w-5 shrink-0 inline-flex items-center justify-center rounded-full bg-[#e8dcc6] text-[10px] font-bold text-[#722f37]">
                            {i + 1}
                          </span>
                          <p className="text-sm font-semibold text-[#231815]">{q.question}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap pl-7">
                          <span className="inline-flex items-center rounded-full bg-[#e8dcc6]/50 border border-[#b7a89a]/40 px-2 py-0.5 text-[10px] font-bold text-[#574943]">
                            {q.topic}
                          </span>
                        </div>
                        {q.expectedFocus && (
                          <p className="pl-7 text-[11px] text-[#574943] leading-relaxed">{q.expectedFocus}</p>
                        )}
                        {answer && (
                            <div className="ml-7 mt-2.5 rounded-xl bg-[#e8dcc6]/20 p-4 border border-[#b7a89a]/35 text-xs text-[#231815] space-y-2 shadow-2xs">
                              <div className="flex items-center justify-between gap-2 border-b border-[#b7a89a]/25 pb-2">
                                <div className="flex items-center gap-1.5 font-bold text-[#231815]">
                                  <Sparkles className="h-4 w-4 text-[#722f37] shrink-0" />
                                  <span className="text-xs font-bold uppercase tracking-wider text-[#722f37]">Suggested Model Answer (STAR Method)</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyModalAnswer(answer, i)}
                                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#722f37] hover:text-[#231815] bg-[#e8dcc6]/40 hover:bg-[#e8dcc6]/70 px-2.5 py-1 rounded-md border border-[#b7a89a]/40 transition-colors shadow-2xs cursor-pointer"
                                  title="Copy model answer to clipboard"
                                >
                                  {copiedModalQuestionIdx === i ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                                      <span className="text-emerald-700">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5 text-[#722f37]" />
                                      <span>Copy Answer</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="leading-relaxed text-[#574943] font-normal">{answer}</p>
                            </div>
                          )}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="text-xs text-[#574943] italic text-center py-8">No interview questions available.</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#b7a89a]/35 bg-[#e8dcc6]/30 px-6 py-3.5 gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-[#574943] hover:text-[#231815] cursor-pointer"
            >
              Close
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer disabled:opacity-50 ml-3"
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#b7a89a]/50 bg-[#FAF7F2] px-4 py-2 text-xs font-bold text-[#722f37] hover:bg-[#e8dcc6]/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span>{downloadingPdf ? 'Generating Report...' : 'Download PDF Report'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRetest(analysis.jobTitle || '');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-4 py-2 text-xs font-bold text-[#FAF7F2] shadow-md shadow-[#722f37]/20 transition-colors cursor-pointer"
            >
              <span>Re-analyze for this Role</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#e8dcc6]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
