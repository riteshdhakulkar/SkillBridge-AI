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
        className="fixed inset-0 bg-[#231815]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#FAF7F2] shadow-2xl border border-[#b7a89a]/50 transition-all z-10 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#b7a89a]/35 px-6 py-4 bg-[#e8dcc6]/40">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#722f37] text-[#FAF7F2] shadow-xs">
              {isRoadmap ? <Compass className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#231815]">
                {isRoadmap ? 'Personalized Learning Roadmap' : 'Interview Preparation Prompts'}
              </h2>
              <p className="text-xs text-[#574943]">
                {isRoadmap
                  ? 'Targeted milestones to close your identified skill gaps'
                  : 'Tailored technical & behavioral questions based on your resume'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#574943] hover:bg-[#e8dcc6]/60 hover:text-[#231815] transition-colors cursor-pointer"
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
              <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#e8dcc6]/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#722f37]">
                    <Sparkles className="h-4 w-4 text-[#722f37]" />
                    <span>Based on your saved analysis:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDemoSample(true)}
                    className="text-[11px] text-[#722f37] hover:underline cursor-pointer font-bold"
                  >
                    View Sample Preview
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-[#231815]">
                  <span className="font-bold text-[#231815]">{latestAnalysis?.jobTitle}</span>
                  {latestAnalysis?.companyName && (
                    <>
                      <span className="text-[#b7a89a]">·</span>
                      <span className="flex items-center gap-1 text-[#574943]">
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
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#722f37] text-[#FAF7F2] text-xs font-bold">
                          {i + 1}
                        </div>
                        {i < (latestAnalysis.learningRoadmap?.length ?? 0) - 1 && (
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
                                <span>{item}</span>
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
                <ol className="space-y-4 pt-1">
                  {latestAnalysis?.interviewQuestions?.map((q, i) => (
                    <li
                      key={i}
                      className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-4 space-y-1.5 shadow-2xs"
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
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ) : (
            /* Empty state or explicit demo view */
            <div className="space-y-4">
              {!hasRealData && (
                <div className="rounded-2xl border border-dashed border-[#b7a89a]/60 bg-[#e8dcc6]/30 p-6 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8dcc6] text-[#722f37] mb-2 border border-[#b7a89a]/40">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-[#231815]">
                    {isRoadmap ? 'No learning roadmaps saved yet' : 'No interview questions saved yet'}
                  </h3>
                  <p className="text-xs text-[#574943] mt-1 max-w-md mx-auto">
                    Evaluate your resume against a target position to generate tailored learning milestones and practice interview questions.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAnalyze();
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-4 py-2 text-xs font-bold text-[#FAF7F2] transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Analyze Resume Now</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#e8dcc6]" />
                  </button>
                </div>
              )}

              {/* Sample preview for illustration */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#574943] uppercase tracking-wider">
                    {hasRealData ? 'Sample Demo Preview' : 'Curriculum Example (Preview)'}
                  </span>
                  {hasRealData && (
                    <button
                      type="button"
                      onClick={() => setShowDemoSample(false)}
                      className="text-xs text-[#722f37] hover:underline cursor-pointer font-bold"
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
                        className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-4 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#722f37] uppercase tracking-wider text-[11px]">
                            {item.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === 'In Progress'
                                ? 'bg-[#e8dcc6]/60 text-[#722f37] border border-[#b7a89a]/50'
                                : 'bg-[#e8dcc6]/30 text-[#574943]'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <h4 className="font-display text-sm font-bold text-[#231815]">{item.title}</h4>
                        <p className="text-xs text-[#574943] leading-relaxed">{item.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {SAMPLE_INTERVIEW_QUESTIONS.map((q, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-4 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#722f37] uppercase tracking-wider text-[11px]">
                            {q.category}
                          </span>
                          <span className="text-[11px] text-[#574943] font-medium">Sample Prompt</span>
                        </div>
                        <p className="text-sm font-semibold text-[#231815]">"{q.question}"</p>
                        <div className="rounded-xl bg-[#e8dcc6]/40 p-2.5 text-[11px] text-[#574943] flex items-center gap-1.5 border border-[#b7a89a]/30">
                          <BookOpen className="h-3.5 w-3.5 text-[#722f37] shrink-0" />
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
        <div className="flex items-center justify-between border-t border-[#b7a89a]/35 bg-[#e8dcc6]/30 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-[#574943] hover:text-[#231815] cursor-pointer"
          >
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAnalyze();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-4 py-2 text-xs font-bold text-[#FAF7F2] transition-colors cursor-pointer shadow-xs"
          >
            <span>Scan Another Resume</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#e8dcc6]" />
          </button>
        </div>
      </div>
    </div>
  );
};
