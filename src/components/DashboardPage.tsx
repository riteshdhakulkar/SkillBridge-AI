import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Compass,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  ChevronRight,
  Loader2,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { SavedAnalysis } from '../types/analysis';
import { AnalysisDetailModal } from './AnalysisDetailModal';
import { QuickActionModal } from './QuickActionModal';
import { getScoreTheme } from '../utils/score';

interface DashboardPageProps {
  onOpenAnalyze: (role?: string) => void;
  refreshToken?: number; // increments when a new analysis is saved
}

// ─── Derived Metrics ────────────────────────────────────────────────────────

interface DerivedMetrics {
  totalAnalyses: number;
  avgMatchScore: string;
  totalSkillsIdentified: number;
  matchedCount: number;
  gapCount: number;
  learningHours: number;
  totalMilestones: number;
}

function deriveMetrics(analyses: SavedAnalysis[]): DerivedMetrics {
  if (analyses.length === 0) {
    return {
      totalAnalyses: 0,
      avgMatchScore: '—',
      totalSkillsIdentified: 0,
      matchedCount: 0,
      gapCount: 0,
      learningHours: 0,
      totalMilestones: 0,
    };
  }
  const avg = Math.round(
    analyses.reduce((sum, a) => sum + (a.matchScore || 0), 0) / analyses.length
  );

  const matchedSet = new Set<string>();
  const gapSet = new Set<string>();
  let totalHours = 0;
  let totalMilestones = 0;

  analyses.forEach((a) => {
    (a.matchedSkills || []).forEach((m) => {
      if (m.skill) matchedSet.add(m.skill.trim().toLowerCase());
    });
    (a.missingSkills || []).forEach((m) => {
      if (m.skill) gapSet.add(m.skill.trim().toLowerCase());
    });
    if (Array.isArray(a.learningRoadmap)) {
      totalMilestones += a.learningRoadmap.length;
      a.learningRoadmap.forEach((item) => {
        const actionCount = item.actionItems?.length || 1;
        // Estimate ~4 hours of targeted study/practice per roadmap action item
        totalHours += actionCount * 4;
      });
    }
  });

  return {
    totalAnalyses: analyses.length,
    avgMatchScore: `${avg}%`,
    totalSkillsIdentified: matchedSet.size + gapSet.size,
    matchedCount: matchedSet.size,
    gapCount: gapSet.size,
    learningHours: totalHours,
    totalMilestones,
  };
}

// ─── Score badge helper ─────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Component ─────────────────────────────────────────────────────────────

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenAnalyze,
  refreshToken,
}) => {
  const [analyses, setAnalyses]           = useState<SavedAnalysis[]>([]);
  const [loading, setLoading]             = useState(true);
  const [fetchError, setFetchError]       = useState<string | null>(null);
  const [deletingId, setDeletingId]       = useState<number | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SavedAnalysis | null>(null);
  const [quickActionType, setQuickActionType]   = useState<'roadmap' | 'interview' | null>(null);
  // Tracks which detail request is in flight so a slow response for an
  // analysis the user has already navigated away from cannot overwrite the
  // currently open one.
  const detailRequestId = useRef<number>(0);

  // ── Fetch analyses from API ────────────────────────────────────────────────
  const fetchAnalyses = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/analyses');
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load analyses');
      setAnalyses(json.data as SavedAnalysis[]);
    } catch (err: any) {
      setFetchError(err.message || 'Could not load your analysis history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses, refreshToken]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this analysis? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/analyses/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Delete failed (${res.status})`);
      }
      // If the currently open modal belongs to the deleted item, close it
      if (selectedAnalysis?.id === id) setSelectedAnalysis(null);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(`Could not delete analysis: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Open one analysis ──────────────────────────────────────────────────────
  const handleOpenDetail = async (id: number) => {
    // Show what the list already gave us straight away so the modal feels
    // instant, then replace it with the authoritative record fetched from
    // GET /api/analyses/:id.
    setSelectedAnalysis(analyses.find((a) => a.id === id) ?? null);

    const requestId = ++detailRequestId.current;
    try {
      const res = await fetch(`/api/analyses/${id}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load analysis');
      // Ignore a response for an analysis the user has already moved away from.
      if (detailRequestId.current === requestId) {
        setSelectedAnalysis(json.data as SavedAnalysis);
      }
    } catch (err: any) {
      console.error('Failed to load full analysis:', err);
      // Keep the cached copy on screen - the list payload is already complete.
    }
  };

  const metrics = deriveMetrics(analyses);

  // ── Metric card definitions ────────────────────────────────────────────────
  const metricCards = [
    {
      title: 'Total Analyses',
      value: loading ? '…' : String(metrics.totalAnalyses),
      sub: metrics.totalAnalyses === 1 ? '1 evaluation saved' : `${metrics.totalAnalyses} evaluations saved`,
      icon: <FileText className="h-5 w-5 text-indigo-600" />,
      positive: true,
    },
    {
      title: 'Average Match Score',
      value: loading ? '…' : metrics.avgMatchScore,
      sub: metrics.totalAnalyses > 0 ? 'Across all evaluated roles' : 'No evaluations yet',
      icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
      positive: true,
    },
    {
      title: 'Skills Identified',
      value: loading ? '…' : String(metrics.totalSkillsIdentified),
      sub: metrics.totalAnalyses > 0 ? `${metrics.matchedCount} demonstrated · ${metrics.gapCount} gaps` : 'Awaiting evaluations',
      icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
      positive: metrics.gapCount === 0,
    },
    {
      title: 'Estimated Learning Hours',
      value: loading ? '…' : `${metrics.learningHours} hrs`,
      sub: metrics.totalMilestones > 0 ? `${metrics.totalMilestones} roadmap milestones` : '0 roadmap milestones',
      icon: <CheckCircle2 className="h-5 w-5 text-indigo-600" />,
      positive: true,
    },
  ];

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Career Readiness Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Your Career Dashboard
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              Track your resume match ratings, skill gaps, and learning progression across target roles.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onOpenAnalyze()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 active:scale-[0.98] cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              <span>Analyze My Resume</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <section className="mt-8">
          <h2 className="sr-only">Performance Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {metricCards.map((m, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs transition-all hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{m.title}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                    {m.icon}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                    {m.value}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{m.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
              <p className="text-xs text-slate-500">Essential workflows to accelerate your job search</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Analyze Resume */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs transition-all hover:border-indigo-300 hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">Analyze Resume</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  Upload a fresh PDF or compare your current profile against a new job description.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onOpenAnalyze()}
                  className="inline-flex w-full items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                >
                  <span>Start New Analysis</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Learning Roadmap */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs transition-all hover:border-indigo-300 hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <Compass className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">View Learning Roadmap</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  Follow your personalised learning milestones generated from your latest analysis.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickActionType('roadmap')}
                  className="inline-flex w-full items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                >
                  <span>Open Roadmap</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Interview Prep */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs transition-all hover:border-indigo-300 hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">Prepare for Interview</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  Review AI-generated screening questions tailored to your projects and profile.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickActionType('interview')}
                  className="inline-flex w-full items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                >
                  <span>Practice Questions</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Analyses */}
        <section className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Analysis History</h2>
              <p className="text-xs text-slate-500">
                Real AI evaluations saved from your resume analyses
              </p>
            </div>
            {!loading && !fetchError && analyses.length > 0 && (
              <span className="text-xs text-slate-500 font-medium">
                {analyses.length} {analyses.length === 1 ? 'record' : 'records'}
              </span>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              <span className="text-sm">Loading your analyses…</span>
            </div>
          )}

          {/* Fetch Error */}
          {!loading && fetchError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-400 mb-2" />
              <p className="text-sm font-semibold text-red-700">{fetchError}</p>
              <button
                type="button"
                onClick={fetchAnalyses}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !fetchError && analyses.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-16 text-center px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 mb-4">
                <BookOpen className="h-7 w-7 text-indigo-500" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No analyses yet</h3>
              <p className="mt-1.5 text-xs text-slate-500 max-w-sm">
                Run your first AI resume evaluation and it will automatically appear here with your match score, skill gaps, and learning roadmap.
              </p>
              <button
                type="button"
                onClick={() => onOpenAnalyze()}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                Analyze My Resume
              </button>
            </div>
          )}

          {/* Table (desktop) + Cards (mobile) */}
          {!loading && !fetchError && analyses.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      <th scope="col" className="px-6 py-3.5">Target Position</th>
                      <th scope="col" className="px-6 py-3.5">Resume Source</th>
                      <th scope="col" className="px-6 py-3.5">Match Score</th>
                      <th scope="col" className="px-6 py-3.5">Date</th>
                      <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {analyses.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm">{item.jobTitle || 'Untitled Role'}</div>
                          {item.companyName && (
                            <div className="flex items-center gap-1.5 text-slate-500 mt-0.5 text-xs">
                              <Building2 className="h-3 w-3" />
                              <span>{item.companyName}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-[11px] max-w-[180px] truncate">
                          {item.resumeSource}
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-2">
                            <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-bold tabular-nums ${getScoreTheme(item.matchScore).badgeClass}`}>
                              {item.matchScore}%
                            </span>
                            <span className="text-[11px] text-slate-500">{getScoreTheme(item.matchScore).shortLabel}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(item.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer"
                            >
                              <span>View</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer disabled:opacity-50"
                              title="Delete analysis"
                            >
                              {deletingId === item.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-slate-100">
                {analyses.map((item) => (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{item.jobTitle || 'Untitled Role'}</h3>
                        {item.companyName && (
                          <p className="text-xs text-slate-500 mt-0.5">{item.companyName}</p>
                        )}
                      </div>
                      <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${getScoreTheme(item.matchScore).badgeClass}`}>
                        {item.matchScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span className="font-mono text-[11px] truncate max-w-[180px]">{item.resumeSource}</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(item.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      >
                        <span>View Details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === item.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="mt-14 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-violet-50/40 p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Applying for a new role?</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Upload your resume and test it against specific company job descriptions to maximise interview invitation rates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenAnalyze()}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Analyze My Resume</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </div>

      {/* Analysis Detail Modal */}
      <AnalysisDetailModal
        analysis={selectedAnalysis}
        onClose={() => setSelectedAnalysis(null)}
        onRetest={(role) => onOpenAnalyze(role)}
        onDelete={handleDelete}
      />

      {/* Quick Action Modal */}
      <QuickActionModal
        type={quickActionType}
        onClose={() => setQuickActionType(null)}
        onOpenAnalyze={() => onOpenAnalyze()}
        latestAnalysis={analyses[0] ?? null}
      />
    </div>
  );
};
