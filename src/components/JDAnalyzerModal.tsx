import React, { useState } from 'react';
import {
  X,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  Briefcase,
  Layers,
  GraduationCap,
  Calendar,
  Compass,
} from 'lucide-react';
import { JDAnalysisResult } from '../types/analysis';
import { analyzeJDClientSide } from '../utils/clientAnalysisEngine';

interface JDAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyJDToAnalysis?: (jobDescription: string, targetTitle?: string) => void;
}

const SAMPLE_JD = `Role: Junior Full-Stack Developer
Company: NovaTech Solutions
Location: Remote / Hybrid

We are seeking a motivated Junior Full-Stack Developer to join our growing engineering squad. You will collaborate with senior engineers to design and deploy modern web applications.

Responsibilities:
- Build responsive, accessible user interfaces using React.js, TypeScript, and modern CSS frameworks (Tailwind CSS).
- Develop and maintain RESTful API microservices using Node.js, Express, and PostgreSQL/MySQL databases.
- Write unit and integration tests using Jest to maintain test coverage above 80%.
- Participate in agile sprints, daily standups, and peer code reviews via Git and GitHub.
- Containerize application components using Docker for local testing and CI/CD pipelines.

Qualifications:
- Bachelor's degree in Computer Science, IT, or equivalent practical experience.
- 0-2 years of software engineering experience or hands-on internship experience.
- Strong proficiency in JavaScript (ES6+), TypeScript, React, and Node.js.
- Familiarity with SQL databases (MySQL/PostgreSQL) and Git version control.
- Nice to have: Familiarity with Docker, MongoDB, Redis, and basic Cloud concepts (AWS/GCP).`;

export const JDAnalyzerModal: React.FC<JDAnalyzerModalProps> = ({
  isOpen,
  onClose,
  onApplyJDToAnalysis,
}) => {
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JDAnalysisResult | null>(null);
  const [copiedSkill, setCopiedSkill] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!jobDescription || jobDescription.trim().length < 20) {
      setError('Please provide a job description with at least 20 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let data: JDAnalysisResult | null = null;
      try {
        const res = await fetch('/api/analyze-jd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobDescription }),
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

      // If server didn't respond with JSON, use client synthesis
      if (!data) {
        data = analyzeJDClientSide(jobDescription);
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error deconstructing job description.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSkill(identifier);
    setTimeout(() => setCopiedSkill(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#FAF7F2] shadow-2xl border border-[#b7a89a]/50 z-10 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#b7a89a]/35 px-6 py-4 bg-[#e8dcc6]/35">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#722f37] text-[#FAF7F2] shadow-xs">
              <Search className="h-4 w-4 text-[#e8dcc6]" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#231815]">
                Instant Job Description (JD) Deconstructor
              </h2>
              <p className="text-xs text-[#574943]">
                Extract must-have technical skills, experience filters, and hiring expectations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#574943] hover:bg-[#e8dcc6]/50 hover:text-[#231815] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Input Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#231815]">
                Paste Target Job Posting
              </label>
              <button
                type="button"
                onClick={() => setJobDescription(SAMPLE_JD)}
                className="text-xs font-bold text-[#722f37] hover:underline cursor-pointer"
              >
                Load Sample Junior Full-Stack JD
              </button>
            </div>
            <textarea
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste any job description from LinkedIn, Indeed, Glassdoor, or company careers page..."
              className="w-full rounded-xl border border-[#b7a89a]/50 bg-white p-3.5 text-xs text-[#231815] focus:border-[#722f37] focus:outline-none focus:ring-2 focus:ring-[#722f37]/20 font-mono"
            />
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-5 py-2.5 text-xs font-bold text-[#FAF7F2] shadow-md shadow-[#722f37]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#e8dcc6]" />
                    <span>Deconstructing Job Specs...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-[#e8dcc6]" />
                    <span>Deconstruct Job Description</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Display */}
          {result && (
            <div className="space-y-5 pt-4 border-t border-stone-200">
              {/* Role Title Banner */}
              <div className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-[#722f37] px-2 py-0.5 text-[10px] font-bold text-[#FAF7F2]">
                      {result.seniority}
                    </span>
                    <span className="text-[11px] text-[#574943]">{result.experienceRequirement}</span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#231815] mt-1">{result.jobTitle}</h3>
                  <p className="text-[11px] text-[#574943] mt-0.5">{result.educationRequirement}</p>
                </div>

                {onApplyJDToAnalysis && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyJDToAnalysis(jobDescription, result.jobTitle);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-4 py-2 text-xs font-bold text-[#FAF7F2] shadow-sm transition-all cursor-pointer self-stretch sm:self-auto justify-center"
                  >
                    <span>Match Resume to This JD</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#e8dcc6]" />
                  </button>
                )}
              </div>

              {/* Must-Have Skills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#231815]">
                    Must-Have Hard Skills ({result.mustHaveSkills.length})
                  </span>
                  <span className="text-[10px] text-[#574943]">Critical for ATS screening</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.mustHaveSkills.map((s, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#b7a89a]/50 bg-[#e8dcc6]/60 px-2.5 py-1 text-xs font-bold text-[#722f37] shadow-2xs"
                    >
                      <span>{s.skill}</span>
                      <span className="rounded bg-[#722f37] text-[#FAF7F2] px-1.5 py-0.2 text-[9px] font-black uppercase">
                        {s.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nice-to-Have Skills */}
              {result.niceToHaveSkills?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#231815]">
                    Nice-to-Have / Bonus Competencies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.niceToHaveSkills.map((s, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg border border-[#b7a89a]/40 bg-[#FAF7F2] px-2.5 py-1 text-xs font-medium text-[#574943]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Responsibilities */}
              {result.responsibilities?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#231815]">
                    Core Work Responsibilities
                  </span>
                  <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-3.5 space-y-2">
                    {result.responsibilities.map((resp, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[#574943] leading-relaxed">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{resp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recruiter Strategy Advice */}
              {result.recruiterAdvice && (
                <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#e8dcc6]/35 p-4 space-y-1">
                  <span className="text-xs font-bold text-[#722f37] flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-[#722f37]" />
                    Recruiter Strategy Advice
                  </span>
                  <p className="text-xs text-[#574943] leading-relaxed">{result.recruiterAdvice}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#b7a89a]/35 bg-[#e8dcc6]/30 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#722f37] hover:bg-[#551b22] px-5 py-2 text-xs font-bold text-[#FAF7F2] transition-colors cursor-pointer shadow-xs"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};

