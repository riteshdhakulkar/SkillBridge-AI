import React, { useEffect } from 'react';
import {
  X,
  Compass,
  Briefcase,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  MessageSquare,
} from 'lucide-react';
import { SAMPLE_ROADMAP_MILESTONES, SAMPLE_INTERVIEW_QUESTIONS } from '../data/sampleData';

interface QuickActionModalProps {
  type: 'roadmap' | 'interview' | null;
  onClose: () => void;
  onOpenAnalyze: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  type,
  onClose,
  onOpenAnalyze,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (type) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [type, onClose]);

  if (!type) return null;

  const isRoadmap = type === 'roadmap';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 transition-all z-10 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              {isRoadmap ? <Compass className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isRoadmap ? 'Personalized Learning Roadmap' : 'Interview Preparation Prompts'}
              </h2>
              <p className="text-xs text-slate-500">
                {isRoadmap
                  ? 'Targeted milestones to close your identified skill gaps'
                  : 'Tailored technical & behavioral questions based on your resume'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {isRoadmap ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                  <Sparkles className="h-4 w-4" />
                  <span>Targeted Curriculum</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  These 3 prioritized milestones directly address the skill gaps identified in your recent software engineering resume scans.
                </p>
              </div>

              <div className="space-y-3">
                {SAMPLE_ROADMAP_MILESTONES.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-600 uppercase tracking-wider text-[11px]">
                        {item.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          item.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.status === 'In Progress'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Estimated time: {item.timeEstimate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                  <Sparkles className="h-4 w-4" />
                  <span>AI-Grounded Interview Prep</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Practice questions tailored specifically to technical concepts found in your resume and target job requirements.
                </p>
              </div>

              <div className="space-y-3">
                {SAMPLE_INTERVIEW_QUESTIONS.map((q, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-600 uppercase tracking-wider text-[11px]">
                        {q.category}
                      </span>
                      <span className="text-[11px] text-slate-400">Question {idx + 1} of 3</span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900">"{q.question}"</p>

                    <div className="rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span>{q.relevance}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAnalyze();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <span>Scan Another Resume</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
