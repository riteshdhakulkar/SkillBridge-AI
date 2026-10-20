import React, { useState } from 'react';
import {
  FileText,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Briefcase,
  Compass,
  ChevronRight,
} from 'lucide-react';

interface HeroProps {
  onAnalyzeClick: () => void;
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onAnalyzeClick,
  onExploreClick,
}) => {
  const [activeTab, setActiveTab] = useState<'match' | 'gaps' | 'roadmap'>('match');

  return (
    <section className="relative overflow-hidden bg-white pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Subtle background ambient gradients */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 opacity-30 blur-3xl [background:radial-gradient(ellipse_at_center,_var(--color-indigo-200),_var(--color-violet-100),_transparent_70%)]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Heading, Subtitle, and CTA Buttons */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            {/* Subtle Tagline / Platform indicator */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/70 px-3.5 py-1 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>AI-Powered Career & Skill Matching for Students</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:leading-[1.15]">
              Bridge Your Skills to Your{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">
                Next Opportunity.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl lg:mx-0">
              SkillBridge AI analyzes your resume against live industry job descriptions, identifies your competitive edge, and maps out the exact skills you need to land interviews.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                type="button"
                onClick={onAnalyzeClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 active:scale-[0.98] cursor-pointer"
              >
                <FileText className="h-5 w-5" />
                <span>Analyze My Resume</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onExploreClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 shadow-xs transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 active:scale-[0.98] cursor-pointer"
              >
                <Compass className="h-5 w-5 text-slate-500" />
                <span>Explore Features</span>
              </button>
            </div>

            {/* Trust and Key Value Points */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 pt-4 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                <span>Instant ATS Readiness Score</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                <span>Targeted Skill Gap Detection</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                <span>Free for Students</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Live Preview Card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-100 transition-all">
              {/* Header inside sample card */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                      Sample Analysis
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">Target Role</span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-slate-900">
                    Junior Software Engineer
                  </h3>
                  <p className="text-xs text-slate-500">
                    Resume: Alex_Chen_ComputerScience.pdf
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-baseline gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-indigo-700">
                    <span className="text-xl font-bold tabular-nums">88</span>
                    <span className="text-xs font-semibold">%</span>
                  </div>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                    Match Score
                  </p>
                </div>
              </div>

              {/* Interactive preview tabs */}
              <div className="mt-4 flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('match')}
                  className={`flex-1 rounded-md py-1.5 transition-all text-center cursor-pointer ${
                    activeTab === 'match'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Matched Skills
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('gaps')}
                  className={`flex-1 rounded-md py-1.5 transition-all text-center cursor-pointer ${
                    activeTab === 'gaps'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Skill Gaps (2)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('roadmap')}
                  className={`flex-1 rounded-md py-1.5 transition-all text-center cursor-pointer ${
                    activeTab === 'roadmap'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Next Steps
                </button>
              </div>

              {/* Dynamic Tab Content */}
              <div className="mt-4 min-h-[220px]">
                {activeTab === 'match' && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <p className="text-xs text-slate-500">
                      Skills found in resume matching job requirements:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs font-semibold text-slate-800">
                            React & TypeScript
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-emerald-700">
                          Strong match
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs font-semibold text-slate-800">
                            Python & Data Structures
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-emerald-700">
                          Academic project
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs font-semibold text-slate-800">
                            Git & Collaborative Workflows
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-emerald-700">
                          Demonstrated
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'gaps' && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <p className="text-xs text-slate-500">
                      High-impact skills missing from candidate resume:
                    </p>
                    <div className="space-y-2">
                      <div className="rounded-lg border border-amber-200/80 bg-amber-50/40 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-bold text-slate-800">
                              Docker & Containerization
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-amber-700">
                            Required by 74% of postings
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600">
                          Add a containerized demo project or Dockerfile to your GitHub repo.
                        </p>
                      </div>

                      <div className="rounded-lg border border-amber-200/80 bg-amber-50/40 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-bold text-slate-800">
                              RESTful API Integration
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-amber-700">
                            Core requirement
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600">
                          Highlight asynchronous API handling and schema validation in project bullets.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'roadmap' && (
                  <div className="space-y-2.5 animate-in fade-in duration-150">
                    <p className="text-xs text-slate-500">
                      Recommended 2-week learning milestones:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/80 p-2.5">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                          1
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            Deploy a full-stack app with Docker Compose
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Estimated time: 4 hours · Practice project
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/80 p-2.5">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                          2
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            Refactor resume bullet points using STAR format
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Boost ATS parser readability score to 95%+
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action trigger footer inside preview card */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Ready to test with your own profile?
                </span>
                <button
                  type="button"
                  onClick={onAnalyzeClick}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  <span>Upload your resume</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
