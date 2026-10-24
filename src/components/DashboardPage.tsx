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
import { SavedAnalysis, ProgressSummary } from '../types/analysis';
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
      icon: <FileText className="h-5 w-5 text-amber-700" />,
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
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      positive: true,
    },
  ];

  return (
    <div className="bg-[#FAF7F2] min-h-screen pb-20 text-[#231815]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-[#b7a89a]/35">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#722f37] bg-[#e8dcc6]/60 px-3 py-1 rounded-full border border-[#b7a89a]/50 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-[#722f37]" />
              <span>Career Readiness Center</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#231815]">
              Your Career Dashboard
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-[#574943] max-w-2xl leading-relaxed">
              Track your resume match ratings, skill gaps, and learning progression across target roles with editorial clarity.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onOpenAnalyze()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-6 py-3.5 text-sm font-bold text-[#FAF7F2] shadow-md shadow-[#722f37]/20 transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              <FileText className="h-4 w-4 text-[#e8dcc6]" />
              <span>Analyze My Resume</span>
              <ArrowRight className="h-4 w-4 text-[#e8dcc6]" />
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
                className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 shadow-2xs transition-all hover:border-[#722f37]/40 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#574943]">{m.title}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8dcc6]/60 border border-[#b7a89a]/40 text-[#722f37]">
                    {m.icon}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-black tracking-tight text-[#231815] tabular-nums">
                    {m.value}
                  </div>
                  <div className="mt-1 text-xs text-[#574943]">{m.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-xl font-bold text-[#231815]">Quick Actions</h2>
              <p className="text-xs text-[#574943]">Essential workflows to accelerate your job search</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Analyze Resume */}
            <div className="group rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 shadow-2xs transition-all hover:border-[#722f37]/50 hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8dcc6]/60 border border-[#b7a89a]/40 text-[#722f37] transition-all group-hover:bg-[#722f37] group-hover:text-[#FAF7F2]">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-[#231815] group-hover:text-[#722f37] transition-colors">Analyze Resume</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#574943]">
                  Upload a fresh PDF or compare your current profile against a new job description.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#e8dcc6]">
                <button
                  type="button"
                  onClick={() => onOpenAnalyze()}
                  className="inline-flex w-full items-center justify-between rounded-lg bg-[#e8dcc6]/35 border border-[#b7a89a]/40 px-3.5 py-2 text-xs font-bold text-[#231815] transition-colors hover:bg-[#722f37] hover:text-[#FAF7F2] hover:border-[#722f37] cursor-pointer"
                >
                  <span>Start New Analysis</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#722f37] group-hover:text-[#FAF7F2]" />
                </button>
              </div>
            </div>

            {/* Learning Roadmap */}
            <div className="group rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 shadow-2xs transition-all hover:border-[#722f37]/50 hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8dcc6]/60 border border-[#b7a89a]/40 text-[#722f37] transition-all group-hover:bg-[#722f37] group-hover:text-[#FAF7F2]">
                  <Compass className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-[#231815] group-hover:text-[#722f37] transition-colors">View Learning Roadmap</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#574943]">
                  Follow your personalised learning milestones generated from your latest analysis.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#e8dcc6]">
                <button
                  type="button"
                  onClick={() => setQuickActionType('roadmap')}
                  className="inline-flex w-full items-center justify-between rounded-lg bg-[#e8dcc6]/35 border border-[#b7a89a]/40 px-3.5 py-2 text-xs font-bold text-[#231815] transition-colors hover:bg-[#722f37] hover:text-[#FAF7F2] hover:border-[#722f37] cursor-pointer"
                >
                  <span>Open Roadmap</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#722f37] group-hover:text-[#FAF7F2]" />
                </button>
              </div>
            </div>

            {/* Interview Prep */}
            <div className="group rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 shadow-2xs transition-all hover:border-[#722f37]/50 hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8dcc6]/60 border border-[#b7a89a]/40 text-[#722f37] transition-all group-hover:bg-[#722f37] group-hover:text-[#FAF7F2]">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-[#231815] group-hover:text-[#722f37] transition-colors">Prepare for Interview</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#574943]">
                  Review AI-generated screening questions tailored to your projects and profile.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#e8dcc6]">
                <button
                  type="button"
                  onClick={() => setQuickActionType('interview')}
                  className="inline-flex w-full items-center justify-between rounded-lg bg-[#e8dcc6]/35 border border-[#b7a89a]/40 px-3.5 py-2 text-xs font-bold text-[#231815] transition-colors hover:bg-[#722f37] hover:text-[#FAF7F2] hover:border-[#722f37] cursor-pointer"
                >
                  <span>Practice Questions</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#722f37] group-hover:text-[#FAF7F2]" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Analyses */}
        <section className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-xl font-bold text-[#231815]">Analysis History</h2>
              <p className="text-xs text-[#574943]">
                Real AI evaluations saved from your resume analyses
              </p>
            </div>
            {!loading && !fetchError && analyses.length > 0 && (
              <span className="text-xs text-[#574943] font-medium">
                {analyses.length} {analyses.length === 1 ? 'record' : 'records'}
              </span>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] py-16 text-[#574943]">
              <Loader2 className="h-5 w-5 animate-spin text-[#722f37]" />
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#b7a89a]/60 bg-[#e8dcc6]/20 py-16 text-center px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8dcc6]/60 text-[#722f37] mb-4 border border-[#b7a89a]/40">
                <BookOpen className="h-7 w-7 text-[#722f37]" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#231815]">No analyses yet</h3>
              <p className="mt-1.5 text-xs text-[#574943] max-w-sm">
                Run your first AI resume evaluation and it will automatically appear here with your match score, skill gaps, and learning roadmap.
              </p>
              <button
                type="button"
                onClick={() => onOpenAnalyze()}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-5 py-2.5 text-sm font-bold text-[#FAF7F2] shadow-md shadow-[#722f37]/20 transition-all cursor-pointer"
              >
                <FileText className="h-4 w-4 text-[#e8dcc6]" />
                <span>Analyze My Resume</span>
              </button>
            </div>
          )}

          {/* Table (desktop) + Cards (mobile) */}
          {!loading && !fetchError && analyses.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-[#b7a89a]/45 bg-[#FAF7F2] shadow-2xs">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#b7a89a]/35 bg-[#e8dcc6]/35 text-[11px] font-bold uppercase tracking-wider text-[#722f37]">
                      <th scope="col" className="px-6 py-3.5">Target Position</th>
                      <th scope="col" className="px-6 py-3.5">Resume Source</th>
                      <th scope="col" className="px-6 py-3.5">Match Score</th>
                      <th scope="col" className="px-6 py-3.5">Date</th>
                      <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#b7a89a]/25 text-xs">
                    {analyses.map((item) => (
                      <tr key={item.id} className="hover:bg-[#e8dcc6]/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#231815] text-sm">{item.jobTitle || 'Untitled Role'}</div>
                          {item.companyName && (
                            <div className="flex items-center gap-1.5 text-[#574943] mt-0.5 text-xs">
                              <Building2 className="h-3 w-3 text-[#722f37]" />
                              <span>{item.companyName}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[#574943] font-mono text-[11px] max-w-[180px] truncate">
                          {item.resumeSource}
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-2">
                            <span className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums ${getScoreTheme(item.matchScore).badgeClass}`}>
                              {item.matchScore}%
                            </span>
                            <span className="text-[11px] text-[#574943] font-semibold">{getScoreTheme(item.matchScore).shortLabel}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#574943] text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[#b7a89a]" />
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(item.id)}
                              className="inline-flex items-center gap-1 rounded-xl border border-[#b7a89a]/50 bg-[#FAF7F2] px-3 py-1.5 text-xs font-bold text-[#722f37] hover:bg-[#e8dcc6]/40 hover:border-[#722f37]/50 transition-all cursor-pointer"
                            >
                              <span>View</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              className="inline-flex items-center justify-center rounded-xl border border-[#b7a89a]/40 p-1.5 text-[#574943] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer disabled:opacity-50"
                              title="Delete analysis"
                            >
                              {deletingId === item.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#722f37]" />
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
              <div className="md:hidden divide-y divide-[#b7a89a]/25">
                {analyses.map((item) => (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-[#231815] text-sm">{item.jobTitle || 'Untitled Role'}</h3>
                        {item.companyName && (
                          <p className="text-xs text-[#574943] mt-0.5">{item.companyName}</p>
                        )}
                      </div>
                      <span className={`inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-xs font-bold tabular-nums ${getScoreTheme(item.matchScore).badgeClass}`}>
                        {item.matchScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#574943] pt-1">
                      <span className="font-mono text-[11px] truncate max-w-[180px]">{item.resumeSource}</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(item.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-[#b7a89a]/50 bg-[#FAF7F2] py-2 text-xs font-bold text-[#722f37] hover:bg-[#e8dcc6]/40 transition-colors cursor-pointer"
                      >
                        <span>View Details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="inline-flex items-center justify-center rounded-xl border border-[#b7a89a]/40 p-2 text-[#574943] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === item.id
                          ? <Loader2 className="h-4 w-4 animate-spin text-[#722f37]" />
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
        <section className="mt-14 rounded-3xl border border-[#b7a89a]/40 bg-gradient-to-r from-[#e8dcc6]/50 via-[#FAF7F2] to-[#e8dcc6]/50 p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#231815]">Applying for a new role?</h2>
            <p className="text-xs sm:text-sm text-[#574943] leading-relaxed">
              Upload your resume and test it against specific company job descriptions to maximise interview invitation rates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenAnalyze()}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-6 py-3 text-sm font-bold text-[#FAF7F2] shadow-md shadow-[#722f37]/25 transition-all active:scale-[0.98] cursor-pointer"
          >
            <FileText className="h-4 w-4 text-[#e8dcc6]" />
            <span>Analyze My Resume</span>
            <ArrowRight className="h-4 w-4 text-[#e8dcc6]" />
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
