import React, { useEffect, useState } from 'react';
import {
  X,
  Compass,
  Sparkles,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Building2,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { SavedAnalysis } from '../types/analysis';
import { SAMPLE_ROADMAP_MILESTONES, SAMPLE_INTERVIEW_QUESTIONS } from '../data/sampleData';

interface QuickActionModalProps {
  type: 'roadmap' | 'interview' | null;
  onClose: () => void;
  onOpenAnalyze: () => void;
  latestAnalysis?: SavedAnalysis | null;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  type,
  onClose,
  onOpenAnalyze,
  latestAnalysis,
}) => {
  const [showDemoSample, setShowDemoSample] = useState(false);

  useEffect(() => {
    setShowDemoSample(false);
  }, [type, latestAnalysis]);

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
  const hasRealRoadmap = Boolean(latestAnalysis && latestAnalysis.learningRoadmap?.length > 0);
  const hasRealInterview = Boolean(latestAnalysis && latestAnalysis.interviewQuestions?.length > 0);
  const hasRealData = isRoadmap ? hasRealRoadmap : hasRealInterview;

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
          {hasRealData && !showDemoSample ? (
            /* Real data mode from saved analyses */
            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                    <Sparkles className="h-4 w-4" />
                    <span>Based on your saved analysis:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDemoSample(true)}
                    className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
                  >
                    View Sample Preview
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-slate-700">
                  <span className="font-semibold">{latestAnalysis?.jobTitle}</span>
                  {latestAnalysis?.companyName && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Building2 className="h-3 w-3" />
                        {latestAnalysis.companyName}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {isRoadmap ? (
                <ol className="space-y-4 pt-1">
                  {latestAnalysis?.learningRoadmap?.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                          {i + 1}
                        </div>
                        {i < (latestAnalysis.learningRoadmap?.length ?? 0) - 1 && (
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
                                <span>{item}</span>
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
                <ol className="space-y-4 pt-1">
                  {latestAnalysis?.interviewQuestions?.map((q, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5 shadow-2xs"
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
              )}
            </div>
          ) : (
            /* Empty state or explicit demo view */
            <div className="space-y-4">
              {!hasRealData && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-2">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {isRoadmap ? 'No learning roadmaps saved yet' : 'No interview questions saved yet'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Evaluate your resume against a target position to generate tailored learning milestones and practice interview questions.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAnalyze();
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    <span>Analyze Resume Now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Sample preview for illustration */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {hasRealData ? 'Sample Demo Preview' : 'Curriculum Example (Preview)'}
                  </span>
                  {hasRealData && (
                    <button
                      type="button"
                      onClick={() => setShowDemoSample(false)}
                      className="text-xs text-indigo-600 hover:underline cursor-pointer"
                    >
                      Return to your saved evaluation
                    </button>
                  )}
                </div>

                {isRoadmap ? (
                  <div className="space-y-3">
                    {SAMPLE_ROADMAP_MILESTONES.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2 opacity-80"
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
                        <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {SAMPLE_INTERVIEW_QUESTIONS.map((q, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2 opacity-80"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-indigo-600 uppercase tracking-wider text-[11px]">
                            {q.category}
                          </span>
                          <span className="text-[11px] text-slate-400">Sample Prompt</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">"{q.question}"</p>
                        <div className="rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600 flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span>{q.relevance}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
