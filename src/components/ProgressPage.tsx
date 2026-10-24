import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Circle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Filter,
  Search,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
  Compass,
  Check,
  ChevronRight,
  TrendingUp,
  FileText,
  ListTodo,
} from 'lucide-react';
import { LearningTaskProgress, ProgressSummary, TaskStatus } from '../types/analysis';

interface ProgressPageProps {
  onNavigateAnalyze: (role?: string) => void;
  onNavigateDashboard: () => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({
  onNavigateAnalyze,
  onNavigateDashboard,
}) => {
  const [tasks, setTasks] = useState<LearningTaskProgress[]>([]);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [analysisFilter, setAnalysisFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fetch all tasks and progress summary
  const loadData = async () => {
    setError(null);
    try {
      const [tasksRes, summaryRes] = await Promise.all([
        fetch('/api/progress'),
        fetch('/api/progress/summary'),
      ]);

      const tasksType = tasksRes.headers.get('content-type') || '';
      const sumType = summaryRes.headers.get('content-type') || '';

      if (tasksRes.ok && tasksType.includes('application/json')) {
        const tasksJson = await tasksRes.json();
        if (tasksJson.success && Array.isArray(tasksJson.data)) {
          setTasks(tasksJson.data);
          try {
            localStorage.setItem('skillbridge_progress_tasks', JSON.stringify(tasksJson.data));
          } catch {}
        }
      }

      if (summaryRes.ok && sumType.includes('application/json')) {
        const summaryJson = await summaryRes.json();
        if (summaryJson.success && summaryJson.summary) {
          setSummary(summaryJson.summary);
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {
      // Server offline or static deployment
    } finally {
      setLoading(false);
    }

    // Fallback: load tasks from localStorage
    try {
      const localTasks = JSON.parse(localStorage.getItem('skillbridge_progress_tasks') || '[]');
      if (Array.isArray(localTasks)) {
        setTasks(localTasks);
        const completed = localTasks.filter((t: any) => t.status === 'completed').length;
        const inProgress = localTasks.filter((t: any) => t.status === 'in_progress').length;
        const notStarted = localTasks.filter((t: any) => t.status === 'not_started').length;
        const total = localTasks.length;
        setSummary({
          totalTasks: total,
          completed,
          inProgress,
          notStarted,
          completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          byAnalysis: [],
        });
        return;
      }
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, []);

  // Show temporary toast
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  // Handle status update
  const handleUpdateStatus = async (task: LearningTaskProgress, newStatus: TaskStatus) => {
    if (task.status === newStatus) return;
    setUpdatingTaskId(task.taskId);

    // Optimistic UI update
    const previousStatus = task.status;
    const optimisticTasks = tasks.map((t) =>
      t.taskId === task.taskId ? { ...t, status: newStatus } : t
    );
    setTasks(optimisticTasks);
    try {
      localStorage.setItem('skillbridge_progress_tasks', JSON.stringify(optimisticTasks));
      const completed = optimisticTasks.filter((t) => t.status === 'completed').length;
      const inProgress = optimisticTasks.filter((t) => t.status === 'in_progress').length;
      const notStarted = optimisticTasks.filter((t) => t.status === 'not_started').length;
      const total = optimisticTasks.length;
      setSummary({
        totalTasks: total,
        completed,
        inProgress,
        notStarted,
        completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        byAnalysis: [],
      });
    } catch {}

    try {
      const res = await fetch(`/api/progress/${task.taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: task.analysisId,
          milestone: task.milestone,
          title: task.title,
          timeframe: task.timeframe,
          resource: task.resourceSuggestion,
          status: newStatus,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success) {
          // Refresh summary quietly
          const summaryRes = await fetch('/api/progress/summary');
          if (summaryRes.ok) {
            const sumType = summaryRes.headers.get('content-type') || '';
            if (sumType.includes('application/json')) {
              const sumJson = await summaryRes.json();
              if (sumJson.success) setSummary(sumJson.summary);
            }
          }
        }
      }
    } catch {
      // offline / static mode fallback already handled via localStorage
    } finally {
      setUpdatingTaskId(null);
      const label =
        newStatus === 'completed'
          ? 'Task marked as Completed! 🎉'
          : newStatus === 'in_progress'
          ? 'Task marked as In Progress 🚀'
          : 'Task reset to Not Started';
      showToast(label);
    }
  };

  // Handle task reset
  const handleResetTask = async (task: LearningTaskProgress) => {
    setUpdatingTaskId(task.taskId);
    const updatedTasks = tasks.map((t) =>
      t.taskId === task.taskId ? { ...t, status: 'not_started' as TaskStatus } : t
    );
    setTasks(updatedTasks);
    try {
      localStorage.setItem('skillbridge_progress_tasks', JSON.stringify(updatedTasks));
    } catch {}

    try {
      await fetch(`/api/progress/${task.taskId}`, {
        method: 'DELETE',
      });
    } catch {
      // fallback
    } finally {
      setUpdatingTaskId(null);
      showToast('Task reset to Not Started');
      loadData();
    }
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;

      // Analysis ID filter
      if (analysisFilter !== 'all' && String(task.analysisId) !== analysisFilter) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchMilestone = task.milestone.toLowerCase().includes(query);
        const matchRole = task.jobTitle.toLowerCase().includes(query);
        if (!matchTitle && !matchMilestone && !matchRole) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, analysisFilter, searchQuery]);

  // Unique analyses for filter dropdown
  const uniqueAnalyses = useMemo(() => {
    const map = new Map<number, string>();
    tasks.forEach((t) => {
      if (!map.has(t.analysisId)) {
        map.set(t.analysisId, t.jobTitle);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({
      id,
      label: title,
    }));
  }, [tasks]);

  // Group filtered tasks by milestone
  const groupedByMilestone = useMemo(() => {
    const groups: {
      key: string;
      milestone: string;
      analysisId: number;
      jobTitle: string;
      companyName: string;
      timeframe: string;
      resourceSuggestion: string;
      tasks: LearningTaskProgress[];
    }[] = [];

    const map = new Map<string, typeof groups[0]>();

    filteredTasks.forEach((t) => {
      const key = `${t.analysisId}:::${t.milestone}`;
      if (!map.has(key)) {
        const groupObj = {
          key,
          milestone: t.milestone,
          analysisId: t.analysisId,
          jobTitle: t.jobTitle,
          companyName: t.companyName,
          timeframe: t.timeframe,
          resourceSuggestion: t.resourceSuggestion,
          tasks: [],
        };
        map.set(key, groupObj);
        groups.push(groupObj);
      }
      map.get(key)!.tasks.push(t);
    });

    return groups;
  }, [filteredTasks]);

  const totalCount = summary?.totalTasks ?? tasks.length;
  const completedCount = summary?.completed ?? tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = summary?.inProgress ?? tasks.filter((t) => t.status === 'in_progress').length;
  const notStartedCount = summary?.notStarted ?? tasks.filter((t) => t.status === 'not_started').length;
  const percentDone =
    summary?.completionPercentage ??
    (totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0);

  return (
    <div className="bg-[#FAF7F2] min-h-screen pb-24 text-[#231815]">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-[#231815] px-4 py-3 text-xs font-semibold text-[#FAF7F2] shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200 border border-[#b7a89a]/40">
          <Sparkles className="h-4 w-4 text-[#e8dcc6] shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="border-b border-[#b7a89a]/35 bg-[#FAF7F2] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#722f37] bg-[#e8dcc6]/60 px-3 py-1 rounded-full border border-[#b7a89a]/50 mb-3">
                <ListTodo className="h-4 w-4 text-[#722f37]" />
                <span>Personalized Skill Tracker</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#231815]">
                Learning Progress & Milestones
              </h1>
              <p className="mt-2.5 text-sm sm:text-base text-[#574943] max-w-2xl leading-relaxed">
                Track and execute the action items from your AI learning roadmaps. Monitor your preparation milestone by milestone.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onNavigateDashboard}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#b7a89a]/60 bg-[#FAF7F2] px-4 py-2.5 text-xs font-bold text-[#231815] hover:bg-[#e8dcc6]/40 transition-colors cursor-pointer"
              >
                <span>View Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateAnalyze()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-5 py-2.5 text-xs font-bold text-[#FAF7F2] shadow-md shadow-[#722f37]/20 transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#e8dcc6]" />
                <span>New Resume Evaluation</span>
              </button>
            </div>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#574943]">Overall Progress</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8dcc6]/60 text-[#722f37] border border-[#b7a89a]/40">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#722f37] tabular-nums">{percentDone}%</span>
                <span className="text-xs font-medium text-[#574943]">completed</span>
              </div>
              <div className="mt-3 w-full bg-[#e8dcc6]/40 rounded-full h-2 overflow-hidden border border-[#b7a89a]/30">
                <div
                  className="bg-[#722f37] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percentDone}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#574943]">Completed</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-700 tabular-nums">{completedCount}</span>
                <span className="text-xs font-medium text-[#574943]">of {totalCount} tasks</span>
              </div>
              <p className="mt-2 text-[11px] text-[#574943]">Validated competencies ready</p>
            </div>

            <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#574943]">In Progress</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8dcc6]/60 text-[#722f37] border border-[#b7a89a]/40">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#722f37] tabular-nums">{inProgressCount}</span>
                <span className="text-xs font-medium text-[#574943]">active tasks</span>
              </div>
              <p className="mt-2 text-[11px] text-[#574943]">Currently studying or building</p>
            </div>

            <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#574943]">Not Started</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8dcc6]/30 text-[#574943] border border-[#b7a89a]/40">
                  <Circle className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#231815] tabular-nums">{notStartedCount}</span>
                <span className="text-xs font-medium text-[#574943]">queued items</span>
              </div>
              <p className="mt-2 text-[11px] text-[#574943]">Upcoming learning modules</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#b7a89a]/35">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Tasks', count: totalCount },
              { id: 'in_progress', label: 'In Progress', count: inProgressCount },
              { id: 'completed', label: 'Completed', count: completedCount },
              { id: 'not_started', label: 'Not Started', count: notStartedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#722f37] text-[#FAF7F2] shadow-sm'
                    : 'bg-[#e8dcc6]/40 text-[#574943] hover:bg-[#e8dcc6]/70 hover:text-[#231815]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    statusFilter === tab.id ? 'bg-[#FAF7F2] text-[#722f37]' : 'bg-[#FAF7F2] text-[#574943] border border-[#b7a89a]/40'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Role Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {uniqueAnalyses.length > 1 && (
              <select
                value={analysisFilter}
                onChange={(e) => setAnalysisFilter(e.target.value)}
                aria-label="Filter by target role"
                className="w-full sm:w-auto rounded-xl border border-[#b7a89a]/50 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#231815] focus:border-[#722f37] focus:outline-none cursor-pointer"
              >
                <option value="all">All Evaluated Roles ({uniqueAnalyses.length})</option>
                {uniqueAnalyses.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.label}
                  </option>
                ))}
              </select>
            )}

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#574943]" />
              <input
                type="text"
                placeholder="Search action items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#b7a89a]/50 bg-[#FAF7F2] pl-9 pr-3 py-2 text-xs font-medium text-[#231815] placeholder-[#574943]/60 focus:border-[#722f37] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#722f37]" />
            <p className="mt-3 text-xs font-bold text-[#574943]">Loading your learning roadmap tasks...</p>
          </div>
        )}

        {/* Empty State: No tasks generated yet */}
        {!loading && tasks.length === 0 && (
          <div className="my-12 rounded-3xl border border-dashed border-[#b7a89a]/60 p-12 text-center bg-[#e8dcc6]/30">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8dcc6] text-[#722f37] mb-4 border border-[#b7a89a]/40 shadow-xs">
              <Compass className="h-7 w-7" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#231815]">No Learning Roadmap Tasks Yet</h3>
            <p className="mt-2 text-xs text-[#574943] max-w-md mx-auto leading-relaxed">
              Run a resume analysis against any target job description. The AI will synthesize a custom learning roadmap with actionable tasks for this tracker.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => onNavigateAnalyze()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-6 py-3 text-xs font-bold text-[#FAF7F2] shadow-md shadow-[#722f37]/20 transition-all cursor-pointer active:scale-95"
              >
                <Sparkles className="h-4 w-4 text-[#e8dcc6]" />
                <span>Analyze Resume to Build Roadmap</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty State: Filter matched nothing */}
        {!loading && tasks.length > 0 && filteredTasks.length === 0 && (
          <div className="my-12 rounded-2xl border border-[#b7a89a]/40 p-8 text-center bg-[#FAF7F2]">
            <Filter className="mx-auto h-8 w-8 text-[#574943] mb-2" />
            <h3 className="font-display text-sm font-bold text-[#231815]">No tasks match your filter</h3>
            <p className="mt-1 text-xs text-[#574943]">Try switching filters or clearing your search term.</p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setAnalysisFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 text-xs font-bold text-[#722f37] hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}

        {/* Task List Grouped by Roadmap Milestones */}
        {!loading && groupedByMilestone.length > 0 && (
          <div className="mt-8 space-y-8">
            {groupedByMilestone.map((group) => {
              const groupTotal = group.tasks.length;
              const groupDone = group.tasks.filter((t) => t.status === 'completed').length;
              const groupProgress = groupTotal > 0 ? Math.round((groupDone / groupTotal) * 100) : 0;

              return (
                <div
                  key={group.key}
                  className="rounded-3xl border border-[#b7a89a]/40 bg-[#FAF7F2] shadow-sm overflow-hidden transition-all duration-200"
                >
                  {/* Milestone Header */}
                  <div className="border-b border-[#b7a89a]/35 bg-[#e8dcc6]/35 p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[#722f37] mb-1">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{group.jobTitle}</span>
                          {group.companyName && (
                            <>
                              <span className="text-[#b7a89a]">·</span>
                              <span>{group.companyName}</span>
                            </>
                          )}
                        </div>
                        <h3 className="font-display text-base font-bold text-[#231815]">{group.milestone}</h3>
                      </div>

                      <div className="flex items-center gap-3">
                        {group.timeframe && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF7F2] border border-[#b7a89a]/50 px-3 py-1 text-[11px] font-bold text-[#722f37] shadow-2xs">
                            <Calendar className="h-3 w-3 text-[#722f37]" />
                            <span>{group.timeframe}</span>
                          </span>
                        )}
                        <span className="text-xs font-bold text-[#231815]">
                          {groupDone}/{groupTotal} ({groupProgress}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar for Milestone */}
                    <div className="mt-3 w-full bg-[#FAF7F2] rounded-full h-2 overflow-hidden border border-[#b7a89a]/30">
                      <div
                        className="bg-[#722f37] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${groupProgress}%` }}
                      />
                    </div>

                    {/* Resource Link if available */}
                    {group.resourceSuggestion && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-[#722f37]">
                        <BookOpen className="h-3.5 w-3.5 text-[#722f37] shrink-0" />
                        <span className="font-bold">Recommended Resource:</span>
                        <span className="text-[#574943] italic">{group.resourceSuggestion}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Item Cards */}
                  <div className="divide-y divide-[#b7a89a]/25 p-2 sm:p-4">
                    {group.tasks.map((task) => {
                      const isUpdating = updatingTaskId === task.taskId;
                      const isCompleted = task.status === 'completed';
                      const isInProgress = task.status === 'in_progress';

                      return (
                        <div
                          key={task.taskId}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl transition-colors ${
                            isCompleted
                              ? 'bg-emerald-50/40'
                              : isInProgress
                              ? 'bg-[#e8dcc6]/40'
                              : 'hover:bg-[#e8dcc6]/20'
                          }`}
                        >
                          {/* Task Info */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStatus(
                                  task,
                                  isCompleted ? 'not_started' : 'completed'
                                )
                              }
                              disabled={isUpdating}
                              title={isCompleted ? 'Mark not started' : 'Mark completed'}
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                                isCompleted
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : isInProgress
                                  ? 'border-[#722f37] bg-[#e8dcc6] text-[#722f37]'
                                  : 'border-[#b7a89a]/60 bg-[#FAF7F2] hover:border-[#722f37] text-transparent'
                              }`}
                            >
                              {isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                              {isInProgress && <Clock className="h-3 w-3" />}
                            </button>

                            <div className="space-y-1">
                              <p
                                className={`text-xs sm:text-sm font-semibold transition-all ${
                                  isCompleted
                                    ? 'text-[#b7a89a] line-through'
                                    : 'text-[#231815]'
                                }`}
                              >
                                {task.title}
                              </p>
                              {task.completedAt && (
                                <p className="text-[10px] text-emerald-700 font-bold">
                                  Completed {new Date(task.completedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Status Controls */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin text-[#722f37] mr-2" />
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(task, 'not_started')}
                              disabled={isUpdating}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                                task.status === 'not_started'
                                  ? 'bg-[#e8dcc6] text-[#231815]'
                                  : 'text-[#574943] hover:bg-[#e8dcc6]/40'
                              }`}
                            >
                              Not Started
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(task, 'in_progress')}
                              disabled={isUpdating}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                                task.status === 'in_progress'
                                  ? 'bg-[#722f37] text-[#FAF7F2]'
                                  : 'text-[#574943] hover:bg-[#e8dcc6]/50 hover:text-[#722f37]'
                              }`}
                            >
                              In Progress
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(task, 'completed')}
                              disabled={isUpdating}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                                task.status === 'completed'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'text-[#574943] hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                            >
                              Completed
                            </button>

                            {(task.status !== 'not_started' || isCompleted) && (
                              <button
                                type="button"
                                onClick={() => handleResetTask(task)}
                                disabled={isUpdating}
                                title="Reset task"
                                className="p-1 text-[#574943] hover:text-[#231815] hover:bg-[#e8dcc6]/60 rounded-md cursor-pointer ml-1"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
