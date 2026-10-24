import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  Copy,
  Check,
} from 'lucide-react';
import { InterviewEvaluationResult } from '../types/analysis';
import { evaluateInterviewAnswerClientSide } from '../utils/clientAnalysisEngine';

interface MockInterviewPracticeProps {
  question: string;
  topic: string;
  expectedFocus: string;
  suggestedModelAnswer?: string;
  targetRole?: string;
}

export const MockInterviewPractice: React.FC<MockInterviewPracticeProps> = ({
  question,
  topic,
  expectedFocus,
  suggestedModelAnswer,
  targetRole,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<InterviewEvaluationResult | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedUpgraded, setCopiedUpgraded] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setCandidateAnswer((prev) => `${prev} ${transcript}`.trim());
          }
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e);
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your answer in the box.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
      }
    }
  };

  const handleSubmitAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!candidateAnswer.trim() || isEvaluating) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsEvaluating(true);
    setEvalError(null);

    try {
      let data: InterviewEvaluationResult | null = null;
      try {
        const res = await fetch('/api/evaluate-interview-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            topic,
            expectedFocus,
            candidateAnswer: candidateAnswer.trim(),
            targetRole: targetRole || 'Software Engineering',
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && json.data) {
            data = json.data;
          }
        }
      } catch {
        // Backend offline / Vercel static mode
      }

      if (!data) {
        data = evaluateInterviewAnswerClientSide({
          question,
          topic,
          expectedFocus,
          candidateAnswer: candidateAnswer.trim(),
          targetRole: targetRole || 'Software Engineering',
        });
      }

      setEvaluation(data);
    } catch (err: any) {
      setEvalError(err.message || 'Failed to evaluate answer. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyUpgraded = () => {
    if (!evaluation?.upgradedAnswer) return;
    navigator.clipboard?.writeText(evaluation.upgradedAnswer);
    setCopiedUpgraded(true);
    setTimeout(() => setCopiedUpgraded(false), 2000);
  };

  const getVerdictTheme = (score: number) => {
    if (score >= 8) {
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        badge: 'bg-emerald-600 text-white',
        label: 'Strong Hire Alignment',
      };
    }
    if (score >= 6) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        badge: 'bg-amber-600 text-white',
        label: 'Hire Alignment (Good Foundation)',
      };
    }
    if (score >= 4) {
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        badge: 'bg-orange-600 text-white',
        label: 'Needs Practice (Add Metrics & Depth)',
      };
    }
    return {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      badge: 'bg-rose-600 text-white',
      label: 'Developing (Lacks Technical Specifics)',
    };
  };

  return (
    <div className="rounded-xl border border-amber-200/80 bg-white shadow-2xs overflow-hidden mt-3">
      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-50/70 via-stone-50 to-white hover:bg-amber-50/80 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-stone-900 text-white shadow-2xs">
            <Mic className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-900">
              Interactive Mock Practice & AI Scoring
            </span>
            <span className="text-[11px] text-stone-500 ml-2 hidden sm:inline">
              (Type or speak your answer for instant 1–10 grading)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {evaluation && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
              Score: {evaluation.score}/10
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-stone-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-stone-400" />
          )}
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-stone-200 space-y-4 animate-in fade-in duration-150">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Your Spoken or Written Response:
              </label>
              <button
                type="button"
                onClick={toggleRecording}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Toggle Voice Speech-to-Text"
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-3.5 w-3.5" />
                    <span>Listening... (Click to stop)</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5 text-amber-700" />
                    <span>Voice Input</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              value={candidateAnswer}
              onChange={(e) => setCandidateAnswer(e.target.value)}
              placeholder="Structure your response using the STAR method (Situation, Task, Action, Result). Mention the tools, architecture, and measurable outcomes..."
              rows={4}
              className="w-full rounded-xl border border-stone-200 p-3 text-xs text-stone-800 placeholder-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
            />

            {evalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{evalError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-stone-400">
                {candidateAnswer.trim().split(/\s+/).filter(Boolean).length} words
              </span>
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={!candidateAnswer.trim() || isEvaluating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                    <span>Evaluating Answer...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Get AI Feedback & Score</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Evaluation Results Card */}
          {evaluation && (
            <div className="space-y-4 pt-3 border-t border-stone-200 animate-in fade-in duration-200">
              {(() => {
                const theme = getVerdictTheme(evaluation.score);
                return (
                  <div className={`rounded-xl border ${theme.border} ${theme.bg} p-4 space-y-2`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${theme.badge}`}>
                          Score: {evaluation.score} / 10
                        </span>
                        <span className={`text-xs font-bold ${theme.text}`}>
                          {theme.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-stone-500">
                        Verdict: {evaluation.verdict}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>What You Did Well:</span>
                  </div>
                  <ul className="text-xs text-stone-700 space-y-1.5 list-disc pl-4">
                    {evaluation.strengths.map((s, idx) => (
                      <li key={idx} className="leading-relaxed">{s}</li>
                    ))}
                  </ul>
                </div>

                {/* Critical Improvements */}
                <div className="rounded-xl border border-amber-200/90 bg-amber-50/50 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                    <span>Areas to Elevate:</span>
                  </div>
                  <ul className="text-xs text-stone-700 space-y-1.5 list-disc pl-4">
                    {evaluation.improvements.map((imp, idx) => (
                      <li key={idx} className="leading-relaxed">{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Missing Technical Keywords */}
              {evaluation.missingKeywords?.length > 0 && (
                <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3.5 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Recommended Technical Keywords to Mention:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {evaluation.missingKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-white border border-stone-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800 shadow-2xs"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Upgraded 10/10 Model Response */}
              <div className="rounded-xl bg-gradient-to-br from-amber-50/70 via-stone-50 to-white p-4 border border-amber-200/80 text-xs text-stone-800 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between gap-2 border-b border-amber-100 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-stone-950">
                    <Award className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-900">
                      Upgraded 10/10 Model Answer (Personalized for Your Idea)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpgraded}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 hover:text-amber-950 bg-white hover:bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/80 transition-colors shadow-2xs cursor-pointer"
                  >
                    {copiedUpgraded ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-amber-700" />
                        <span>Copy Model Answer</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="leading-relaxed text-stone-700 font-normal whitespace-pre-line">
                  {evaluation.upgradedAnswer}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

