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
  Zap,
  ShieldCheck,
  Award,
  GraduationCap,
  Star,
  Layers,
} from 'lucide-react';

interface HeroProps {
  onAnalyzeClick: () => void;
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onAnalyzeClick,
  onExploreClick,
}) => {
  const [activeTab, setActiveTab] = useState<'match' | 'gaps' | 'xyz'>('match');
  const [demoIntegrated, setDemoIntegrated] = useState(false);
  const [copiedBullet, setCopiedBullet] = useState(false);

  return (
    <section className="relative overflow-hidden bg-[#FAF7F2] pt-12 pb-20 md:pt-20 md:pb-32">
      {/* Ambient background glows - Deep Burgundy (#722f37) & Mocha Cream (#e8dcc6) */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[650px] w-[1100px] -translate-x-1/2 opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(114, 47, 55, 0.18), rgba(232, 220, 198, 0.45), rgba(183, 168, 154, 0.2), transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-32 -z-10 h-[500px] w-[500px] opacity-35 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(114, 47, 55, 0.15), rgba(232, 220, 198, 0.35), transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 -left-24 -z-10 h-[450px] w-[450px] opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(183, 168, 154, 0.35), rgba(232, 220, 198, 0.4), transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Subtle Aesthetic Dot Mesh in Cosmic Latte */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-aesthetic-dots opacity-40" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Editorial Headline, Subtitle, and CTAs */}
          <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
            {/* Aesthetic Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b7a89a]/70 bg-[#e8dcc6]/45 px-4 py-1.5 text-xs font-semibold text-[#722f37] shadow-2xs backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-[#722f37] animate-pulse" />
              <Sparkles className="h-3.5 w-3.5 text-[#722f37]" />
              <span className="tracking-wide">✦ Editorial Career & ATS Engine for Students</span>
            </div>

            {/* Main Headline with Designer Serif typography */}
            <h1 className="text-4xl font-extrabold tracking-tight text-[#231815] sm:text-5xl md:text-6xl lg:leading-[1.12]">
              Turn College Projects Into{' '}
              <span className="font-display italic font-normal text-[#722f37] block sm:inline underline decoration-[#e8dcc6] decoration-wavy decoration-2">
                Recruiter Magnets.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-[#574943] sm:text-lg lg:mx-0 font-normal">
              Break past standard robotic filters with an aesthetic resume experience. SkillBridge AI matches your coursework and projects directly against target tech jobs, crafts recruiter-ready Google XYZ bullets, fills missing keywords, and prepares you for real technical rounds.
            </p>

            {/* CTA Buttons in Deep Burgundy & Mocha Cream */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                type="button"
                onClick={onAnalyzeClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-[#722f37] px-8 py-4 text-sm font-bold text-[#FAF7F2] shadow-lg shadow-[#722f37]/25 transition-all duration-300 hover:bg-[#551b22] hover:shadow-xl hover:shadow-[#722f37]/35 active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-[#e8dcc6]" />
                <span>Analyze My Resume (Free)</span>
                <ArrowRight className="h-4 w-4 text-[#e8dcc6]" />
              </button>

              <button
                type="button"
                onClick={onExploreClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-[#b7a89a]/80 bg-[#FAF7F2]/90 px-7 py-4 text-sm font-semibold text-[#231815] shadow-2xs backdrop-blur-sm transition-all duration-200 hover:bg-[#e8dcc6]/60 hover:border-[#722f37]/50 active:scale-[0.98] cursor-pointer"
              >
                <Compass className="h-4 w-4 text-[#722f37]" />
                <span>Explore Capabilities</span>
              </button>
            </div>

            {/* Aesthetic Value Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-3 pt-3 text-xs font-medium text-[#574943]">
              <div className="flex items-center gap-1.5 bg-[#FAF7F2] px-3.5 py-1.5 rounded-full border border-[#b7a89a]/60 shadow-2xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#722f37]" />
                <span>100% Vector ATS PDF</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#FAF7F2] px-3.5 py-1.5 rounded-full border border-[#b7a89a]/60 shadow-2xs">
                <Zap className="h-3.5 w-3.5 text-[#722f37]" />
                <span>Before vs. After Score Diff</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#FAF7F2] px-3.5 py-1.5 rounded-full border border-[#b7a89a]/60 shadow-2xs">
                <ShieldCheck className="h-3.5 w-3.5 text-[#722f37]" />
                <span>JD Keyword Scanner</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#FAF7F2] px-3.5 py-1.5 rounded-full border border-[#b7a89a]/60 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-[#722f37]" />
                <span>LinkedIn & GitHub Optimizer</span>
              </div>
            </div>
          </div>

          {/* Right Column: Aesthetic Candidate Dossier Showcase Card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto w-full max-w-lg rounded-3xl p-[1.5px] bg-gradient-to-b from-[#722f37]/35 via-[#b7a89a]/50 to-[#e8dcc6]/30 shadow-2xl shadow-[#722f37]/10">
              {/* Floating decorative badge */}
              <div className="absolute -top-3.5 -right-2 z-20 flex items-center gap-1.5 rounded-full bg-[#722f37] text-[#FAF7F2] px-3.5 py-1 text-[11px] font-bold shadow-md shadow-[#722f37]/20 border border-[#FAF7F2]/30">
                <Star className="h-3 w-3 fill-[#e8dcc6] text-[#e8dcc6]" />
                <span>+28% Score Surge</span>
              </div>

              <div className="rounded-[22px] bg-[#FAF7F2]/95 backdrop-blur-xl p-6 sm:p-7 shadow-xs border border-[#b7a89a]/40">
                {/* Header inside sample card */}
                <div className="flex items-start justify-between border-b border-[#e8dcc6] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#722f37] bg-[#e8dcc6]/60 px-2 py-0.5 rounded-md border border-[#b7a89a]/50">
                        <Sparkles className="h-2.5 w-2.5 text-[#722f37]" />
                        Live Candidate Dossier
                      </span>
                    </div>
                    <h3 className="mt-1.5 font-display text-lg font-bold text-[#231815]">
                      Junior Full-Stack Developer
                    </h3>
                    <p className="text-xs text-[#574943]">
                      Evaluated against senior engineering standards
                    </p>
                  </div>

                  {/* Circular Radial Score Widget in Deep Burgundy */}
                  <div className="flex flex-col items-center">
                    <div className="relative flex h-14 w-14 items-center justify-center">
                      <svg className="h-14 w-14 -rotate-90 transform" viewBox="0 0 36 36">
                        <path
                          className="text-[#e8dcc6]/60"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-[#722f37] transition-all duration-1000 ease-out"
                          strokeDasharray={`${demoIntegrated ? 95 : 88}, 100`}
                          strokeLinecap="round"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-sm font-extrabold text-[#231815]">
                          {demoIntegrated ? '95%' : '88%'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-[#722f37] tracking-wider mt-0.5">
                      ATS Ready
                    </span>
                  </div>
                </div>

                {/* Interactive preview tabs */}
                <div className="mt-4 flex rounded-xl bg-[#e8dcc6]/40 p-1 text-xs font-semibold border border-[#b7a89a]/30">
                  <button
                    type="button"
                    onClick={() => setActiveTab('match')}
                    className={`flex-1 rounded-lg py-1.5 transition-all text-center cursor-pointer ${
                      activeTab === 'match'
                        ? 'bg-[#FAF7F2] text-[#722f37] shadow-2xs font-bold border border-[#b7a89a]/40'
                        : 'text-[#574943] hover:text-[#231815]'
                    }`}
                  >
                    Matched (6)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('gaps')}
                    className={`flex-1 rounded-lg py-1.5 transition-all text-center cursor-pointer ${
                      activeTab === 'gaps'
                        ? 'bg-[#FAF7F2] text-[#722f37] shadow-2xs font-bold border border-[#b7a89a]/40'
                        : 'text-[#574943] hover:text-[#231815]'
                    }`}
                  >
                    Missing Gaps (2)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('xyz')}
                    className={`flex-1 rounded-lg py-1.5 transition-all text-center cursor-pointer ${
                      activeTab === 'xyz'
                        ? 'bg-[#FAF7F2] text-[#722f37] shadow-2xs font-bold border border-[#b7a89a]/40'
                        : 'text-[#574943] hover:text-[#231815]'
                    }`}
                  >
                    XYZ Bullets
                  </button>
                </div>

                {/* Dynamic Tab Content */}
                <div className="mt-4 min-h-[200px]">
                  {activeTab === 'match' && (
                    <div className="space-y-2 animate-in fade-in duration-150">
                      <p className="text-[11px] font-medium text-[#574943]">
                        Found in your resume & confirmed against job spec:
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between rounded-xl border border-[#b7a89a]/35 bg-[#e8dcc6]/25 p-2.5">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#722f37]" />
                            <span className="text-xs font-bold text-[#231815]">
                              React, TypeScript & Redux
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-[#722f37] bg-[#FAF7F2] border border-[#b7a89a]/40 px-2 py-0.5 rounded-full">
                            High Overlap
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-[#b7a89a]/35 bg-[#e8dcc6]/25 p-2.5">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#722f37]" />
                            <span className="text-xs font-bold text-[#231815]">
                              Node.js & Express REST APIs
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-[#722f37] bg-[#FAF7F2] border border-[#b7a89a]/40 px-2 py-0.5 rounded-full">
                            Project Grounded
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-[#b7a89a]/35 bg-[#e8dcc6]/25 p-2.5">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#722f37]" />
                            <span className="text-xs font-bold text-[#231815]">
                              MySQL & MongoDB Data Modeling
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-[#722f37] bg-[#FAF7F2] border border-[#b7a89a]/40 px-2 py-0.5 rounded-full">
                            Database Ready
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'gaps' && (
                    <div className="space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-medium text-[#574943]">
                          Critical job requirements to integrate:
                        </p>
                        <button
                          type="button"
                          onClick={() => setDemoIntegrated(!demoIntegrated)}
                          className="text-[11px] font-bold text-[#722f37] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>{demoIntegrated ? 'Reset Demo' : '1-Click Weave Gaps'}</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div
                          className={`rounded-xl border p-2.5 transition-all ${
                            demoIntegrated
                              ? 'border-[#722f37]/40 bg-[#FAF7F2]'
                              : 'border-[#b7a89a]/60 bg-[#e8dcc6]/35'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {demoIntegrated ? (
                                <CheckCircle2 className="h-4 w-4 text-[#722f37]" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-[#722f37]" />
                              )}
                              <span className="text-xs font-bold text-[#231815]">
                                Docker & Containerization
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                demoIntegrated
                                  ? 'bg-[#722f37] text-white border-transparent'
                                  : 'bg-[#FAF7F2] text-[#722f37] border-[#b7a89a]/50'
                              }`}
                            >
                              {demoIntegrated ? 'Integrated in Project' : 'High Priority'}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#574943] pl-6 leading-relaxed">
                            {demoIntegrated
                              ? 'Seamlessly woven into RetailGenie project bullets.'
                              : 'Required for microservice deployments.'}
                          </p>
                        </div>

                        <div
                          className={`rounded-xl border p-2.5 transition-all ${
                            demoIntegrated
                              ? 'border-[#722f37]/40 bg-[#FAF7F2]'
                              : 'border-[#b7a89a]/60 bg-[#e8dcc6]/35'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {demoIntegrated ? (
                                <CheckCircle2 className="h-4 w-4 text-[#722f37]" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-[#722f37]" />
                              )}
                              <span className="text-xs font-bold text-[#231815]">
                                Automated Unit Testing (Jest)
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                demoIntegrated
                                  ? 'bg-[#722f37] text-white border-transparent'
                                  : 'bg-[#FAF7F2] text-[#722f37] border-[#b7a89a]/50'
                              }`}
                            >
                              {demoIntegrated ? 'Integrated in Project' : 'Medium Priority'}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#574943] pl-6 leading-relaxed">
                            {demoIntegrated
                              ? 'Added 85% test coverage metric to project bullets.'
                              : 'Required for enterprise code reliability.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'xyz' && (
                    <div className="space-y-2 animate-in fade-in duration-150">
                      <p className="text-[11px] font-medium text-[#574943]">
                        Google XYZ Formula: Accomplished [X], measured by [Y], by doing [Z]
                      </p>
                      <div className="rounded-xl border border-[#b7a89a]/50 bg-[#e8dcc6]/30 p-3 space-y-2">
                        <span className="text-[10px] font-bold uppercase text-[#722f37] tracking-wider">
                          Before (Weak Student Bullet):
                        </span>
                        <p className="text-xs text-[#574943]/80 line-through">
                          "Worked on backend API using Node.js and helped improve speed."
                        </p>
                        <div className="pt-2 border-t border-[#b7a89a]/40">
                          <span className="text-[10px] font-bold uppercase text-[#722f37] tracking-wider">
                            After (SkillBridge XYZ Rewrite):
                          </span>
                          <p className="text-xs font-medium text-[#231815] leading-relaxed mt-0.5">
                            "Architected RESTful APIs with Node.js and PostgreSQL indexing,{' '}
                            <span className="font-bold text-[#722f37] bg-[#e8dcc6]/70 px-1 py-0.5 rounded">
                              reducing query latency by 42%
                            </span>{' '}
                            across 500+ daily requests."
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Interactive Card Action Button */}
                <div className="mt-5 pt-3 border-t border-[#e8dcc6]">
                  <button
                    type="button"
                    onClick={onAnalyzeClick}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#722f37] hover:bg-[#551b22] text-[#FAF7F2] py-2.5 text-xs font-bold shadow-md shadow-[#722f37]/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#e8dcc6]" />
                    <span>Run Your Own Resume Now</span>
                    <ChevronRight className="h-3.5 w-3.5 text-[#e8dcc6]/70" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aesthetic Editorial Ticker Marquee */}
      <div className="mt-16 border-y border-[#b7a89a]/40 bg-[#e8dcc6]/35 py-3.5 backdrop-blur-sm overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[#722f37]/80 overflow-x-auto gap-8 whitespace-nowrap scrollbar-none">
          <div className="flex items-center gap-8 animate-shimmer">
            <span className="flex items-center gap-2">✦ STANFORD TO STARTUPS</span>
            <span className="text-[#b7a89a]">•</span>
            <span className="flex items-center gap-2">✦ GOOGLE XYZ IMPACT BULLETS</span>
            <span className="text-[#b7a89a]">•</span>
            <span className="flex items-center gap-2">✦ DETERMINISTIC ATS SCORING</span>
            <span className="text-[#b7a89a]">•</span>
            <span className="flex items-center gap-2">✦ ZERO AI HALLUCINATIONS</span>
            <span className="text-[#b7a89a]">•</span>
            <span className="flex items-center gap-2">✦ 1-CLICK ATS VECTOR PDF</span>
            <span className="text-[#b7a89a]">•</span>
            <span className="flex items-center gap-2">✦ LINKEDIN HEADLINE CRAFTER</span>
          </div>
        </div>
      </div>
    </section>
  );
};
