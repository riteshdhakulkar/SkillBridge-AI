import React from 'react';
import {
  FileCheck2,
  Target,
  Compass,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  MessageSquare,
  Mail,
  GraduationCap,
  ShieldCheck,
  Download,
  Search,
  Share2,
  TrendingUp,
  Award,
  Check,
  Code2,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface FeaturesProps {
  onSelectFeature: (featureName: string) => void;
}

export const Features: React.FC<FeaturesProps> = ({ onSelectFeature }) => {
  return (
    <section id="features" className="relative scroll-mt-16 bg-[#FAF7F2] py-24 border-b border-[#b7a89a]/35">
      {/* Subtle ambient blooms */}
      <div className="absolute top-1/4 left-1/12 w-96 h-96 bg-[#e8dcc6]/30 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-1/4 right-1/12 w-96 h-96 bg-[#722f37]/5 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#b7a89a]/70 bg-[#e8dcc6]/50 px-4 py-1.5 text-xs font-bold text-[#722f37] shadow-2xs backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#722f37]" />
            <span className="tracking-wider uppercase text-[11px] font-bold">Curated Career Architecture</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#231815]">
            Everything Students Need to{' '}
            <span className="font-display italic font-normal text-[#722f37]">
              Land Tech Offers.
            </span>
          </h2>

          <p className="text-sm sm:text-base leading-relaxed text-[#574943]">
            A specialized career suite designed to bridge your college coursework and projects directly into recruiter interviews with aesthetic clarity.
          </p>
        </div>

        {/* Bento Grid Showcase */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* ═══════════════════════════════════════════════════════════════════
              CARD 1 (2 Columns): AI Resume & ATS Match Scanner [FLAGSHIP]
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 group relative flex flex-col justify-between rounded-3xl border border-[#b7a89a]/50 bg-gradient-to-br from-[#FAF7F2] via-[#FAF7F2] to-[#e8dcc6]/30 p-7 sm:p-8 shadow-sm transition-all duration-300 hover:border-[#722f37]/60 hover:shadow-xl hover:shadow-[#722f37]/10">
            <div>
              {/* Header & Tag */}
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#722f37] text-[#FAF7F2] shadow-md shadow-[#722f37]/20 transition-transform duration-300 group-hover:scale-105">
                  <FileCheck2 className="h-6 w-6 text-[#e8dcc6]" />
                </div>
                <span className="text-[11px] font-extrabold text-[#722f37] bg-[#e8dcc6]/70 px-3 py-1 rounded-full border border-[#b7a89a]/50 uppercase tracking-wider">
                  Core Diagnostic Engine
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="mt-6 font-display text-xl sm:text-2xl font-black text-[#231815] group-hover:text-[#722f37] transition-colors">
                AI Resume & ATS Match Scanner
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[#574943] max-w-xl">
                Instant deep diagnostics against live job descriptions. Evaluates keyword overlap, catches formatting pitfalls, and generates an honest match readiness score.
              </p>

              {/* Visual Micro-Widget: Live ATS Score Meter Preview */}
              <div className="mt-6 rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-4.5 shadow-2xs">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-black text-sm">
                      92%
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#231815]">High ATS Match Confidence</p>
                      <p className="text-[11px] text-[#574943]">18 of 20 target competencies verified with evidence</p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 border border-emerald-200">
                    <Check className="h-3 w-3" /> Interview Ready
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-3 w-full bg-[#e8dcc6]/50 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#722f37] h-1.5 rounded-full w-[92%]" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded-md bg-[#e8dcc6]/60 text-[#722f37] border border-[#b7a89a]/40">
                    Semantic Matching
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#e8dcc6]/60 text-[#722f37] border border-[#b7a89a]/40">
                    Zero Formatting Pitfalls
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#e8dcc6]/60 text-[#722f37] border border-[#b7a89a]/40">
                    Direct Project Evidence
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-7 pt-2">
              <button
                type="button"
                onClick={() => onSelectFeature('AI Resume & ATS Match Scanner')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-6 py-3 text-xs font-bold text-[#FAF7F2] shadow-md shadow-[#722f37]/25 transition-all cursor-pointer active:scale-95"
              >
                <span>Scan My Resume Now</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#e8dcc6]" />
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              CARD 2 (1 Column): Instant JD Keyword Deconstructor
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#722f37]/50 hover:shadow-lg">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8dcc6]/60 border border-[#b7a89a]/40 text-[#722f37] transition-all group-hover:bg-[#722f37] group-hover:text-[#FAF7F2]">
                  <Search className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-[#722f37] bg-[#e8dcc6]/50 px-2 py-0.5 rounded-full border border-[#b7a89a]/50">
                  JD Intelligence
                </span>
              </div>

              <h3 className="mt-5 font-display text-base font-bold text-[#231815] group-hover:text-[#722f37] transition-colors">
                Instant JD Deconstructor
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#574943]">
                Extract must-have hard skills, seniority levels, and recruiter filters directly from any job link.
              </p>

              {/* Visual Micro-Widget: Extracted tag cloud */}
              <div className="mt-4 rounded-xl border border-[#b7a89a]/35 bg-[#e8dcc6]/25 p-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#722f37] block">
                  Must-Have Hard Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#b7a89a]/40 text-[10px] font-bold text-[#231815]">
                    TypeScript
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#b7a89a]/40 text-[10px] font-bold text-[#231815]">
                    GraphQL
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#b7a89a]/40 text-[10px] font-bold text-[#231815]">
                    PostgreSQL
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#722f37] text-[#FAF7F2] text-[10px] font-bold">
                    +4 More
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <button
                type="button"
                onClick={() => onSelectFeature('Instant JD Keyword Deconstructor')}
                className="group/btn inline-flex w-full items-center justify-between rounded-xl border border-[#b7a89a]/50 bg-[#e8dcc6]/30 px-3.5 py-2 text-xs font-bold text-[#231815] transition-all hover:bg-[#722f37] hover:text-[#FAF7F2] hover:border-[#722f37] cursor-pointer"
              >
                <span>Deconstruct Job Description</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#722f37] group-hover/btn:text-[#FAF7F2]" />
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              CARD 3 (1 Column): Gap-Confirmed ATS Resume Studio
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#722f37]/50 hover:shadow-lg">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8dcc6]/60 border border-[#b7a89a]/40 text-[#722f37] transition-all group-hover:bg-[#722f37] group-hover:text-[#FAF7F2]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-[#722f37] bg-[#e8dcc6]/50 px-2 py-0.5 rounded-full border border-[#b7a89a]/50">
                  Vector Studio
                </span>
              </div>

              <h3 className="mt-5 font-display text-base font-bold text-[#231815] group-hover:text-[#722f37] transition-colors">
                ATS Resume Studio
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#574943]">
                Confirm project context for missing skills and let AI weave them into your real resume with vector PDF export.
              </p>

              {/* Visual Micro-Widget: Score surge indicator */}
              <div className="mt-4 rounded-xl border border-[#b7a89a]/35 bg-[#e8dcc6]/25 p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#574943] block">Score Surge</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-bold text-rose-600 line-through">58%</span>
                    <span className="text-xs font-black text-emerald-700">➔ 95%</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#722f37] bg-[#FAF7F2] px-2 py-1 rounded-md border border-[#b7a89a]/40">
                  <Download className="h-3 w-3" /> Vector PDF
                </span>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <button
                type="button"
                onClick={() => onSelectFeature('Gap-Confirmed ATS Resume Studio')}
                className="group/btn inline-flex w-full items-center justify-between rounded-xl border border-[#b7a89a]/50 bg-[#e8dcc6]/30 px-3.5 py-2 text-xs font-bold text-[#231815] transition-all hover:bg-[#722f37] hover:text-[#FAF7F2] hover:border-[#722f37] cursor-pointer"
              >
                <span>Open Resume Studio</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#722f37] group-hover/btn:text-[#FAF7F2]" />
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              CARD 4 (1 Column): Google XYZ Bullet Rewriter
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#722f37]/50 hover:shadow-lg">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8dcc6]/60 border border-[#b7a89a]/40 text-[#722f37] transition-all group-hover:bg-[#722f37] group-hover:text-[#FAF7F2]">
                  <Zap className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-[#722f37] bg-[#e8dcc6]/50 px-2 py-0.5 rounded-full border border-[#b7a89a]/50">
                  XYZ Formula
                </span>
              </div>

              <h3 className="mt-5 font-display text-base font-bold text-[#231815] group-hover:text-[#722f37] transition-colors">
                Google XYZ Bullet Rewriter
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#574943]">
                Turn passive college descriptions into measurable high-offer accomplishments recruiters look for.
              </p>

              {/* Visual Micro-Widget: Before/After pill */}
              <div className="mt-4 rounded-xl border border-[#b7a89a]/35 bg-[#e8dcc6]/25 p-3 space-y-1.5 text-[11px]">
                <p className="text-rose-700/90 italic truncate">✕ Built an internal backend API</p>
                <p className="text-emerald-800 font-bold truncate">✓ Architected GraphQL API cutting p99 by 43%</p>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <button
                type="button"
                onClick={() => onSelectFeature('Google XYZ Bullet Rewriter')}
                className="group/btn inline-flex w-full items-center justify-between rounded-xl border border-[#b7a89a]/50 bg-[#e8dcc6]/30 px-3.5 py-2 text-xs font-bold text-[#231815] transition-all hover:bg-[#722f37] hover:text-[#FAF7F2] hover:border-[#722f37] cursor-pointer"
              >
                <span>Rewrite My Bullets</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#722f37] group-hover/btn:text-[#FAF7F2]" />
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              CARD 5 (1 Column): LinkedIn, GitHub & Outreach Suite
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#722f37]/50 hover:shadow-lg">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8dcc6]/60 border border-[#b7a89a]/40 text-[#722f37] transition-all group-hover:bg-[#722f37] group-hover:text-[#FAF7F2]">
                  <Share2 className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-[#722f37] bg-[#e8dcc6]/50 px-2 py-0.5 rounded-full border border-[#b7a89a]/50">
                  Personal Brand
                </span>
              </div>

              <h3 className="mt-5 font-display text-base font-bold text-[#231815] group-hover:text-[#722f37] transition-colors">
                LinkedIn & GitHub Suite
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#574943]">
                Generate high-CTR LinkedIn headlines, GitHub bios, and recruiter cold DMs that actually get responses.
              </p>

              {/* Visual Micro-Widget: Social preview badge */}
              <div className="mt-4 rounded-xl border border-[#b7a89a]/35 bg-[#e8dcc6]/25 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#722f37]">
                  <span className="w-2 h-2 rounded-full bg-[#722f37]" />
                  <span>High-CTR Headline:</span>
                </div>
                <p className="text-[11px] text-[#231815] font-medium truncate">
                  "Full Stack Engineer | Distributed Systems & Node"
                </p>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <button
                type="button"
                onClick={() => onSelectFeature('LinkedIn, GitHub & Outreach Suite')}
                className="group/btn inline-flex w-full items-center justify-between rounded-xl border border-[#b7a89a]/50 bg-[#e8dcc6]/30 px-3.5 py-2 text-xs font-bold text-[#231815] transition-all hover:bg-[#722f37] hover:text-[#FAF7F2] hover:border-[#722f37] cursor-pointer"
              >
                <span>Generate Social Assets</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#722f37] group-hover/btn:text-[#FAF7F2]" />
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              CARD 6 (2 Columns): STAR Technical Interview Prep
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 group relative flex flex-col justify-between rounded-3xl border border-[#b7a89a]/50 bg-gradient-to-br from-[#FAF7F2] via-[#FAF7F2] to-[#e8dcc6]/30 p-7 sm:p-8 shadow-sm transition-all duration-300 hover:border-[#722f37]/60 hover:shadow-xl hover:shadow-[#722f37]/10">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#722f37] text-[#FAF7F2] shadow-md shadow-[#722f37]/20 transition-transform duration-300 group-hover:scale-105">
                  <MessageSquare className="h-6 w-6 text-[#e8dcc6]" />
                </div>
                <span className="text-[11px] font-extrabold text-[#722f37] bg-[#e8dcc6]/70 px-3 py-1 rounded-full border border-[#b7a89a]/50 uppercase tracking-wider">
                  Interactive Simulator
                </span>
              </div>

              <h3 className="mt-6 font-display text-xl sm:text-2xl font-black text-[#231815] group-hover:text-[#722f37] transition-colors">
                STAR Technical Interview Prep
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[#574943] max-w-xl">
                Practice answering role-specific technical and behavioral questions grounded in your projects. Receive instant STAR scoring (1-10) with verified model answers.
              </p>

              {/* Visual Micro-Widget: Simulated mock interview dialog */}
              <div className="mt-6 rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-4.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#722f37]">
                    Simulated Question & Evaluation
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#722f37] text-[#FAF7F2] text-[10px] font-bold px-2 py-0.5">
                    ★ 9.4/10 STAR Score
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#231815] italic">
                  "Walk me through a performance bottleneck you diagnosed in your distributed marketplace app."
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded-md bg-[#e8dcc6]/60 text-[#722f37] border border-[#b7a89a]/40">
                    S: Situation Clarified
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#e8dcc6]/60 text-[#722f37] border border-[#b7a89a]/40">
                    T: Task Scope Defined
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#e8dcc6]/60 text-[#722f37] border border-[#b7a89a]/40">
                    A: Action Executed
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    R: 43% Metric Result
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-7 pt-2">
              <button
                type="button"
                onClick={() => onSelectFeature('STAR Technical Interview Prep')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-6 py-3 text-xs font-bold text-[#FAF7F2] shadow-md shadow-[#722f37]/25 transition-all cursor-pointer active:scale-95"
              >
                <span>Launch Interview Practice</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#e8dcc6]" />
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              CARD 7 (2 Columns): Personalized AI Cover Letters
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 group relative flex flex-col justify-between rounded-3xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-7 shadow-xs transition-all duration-300 hover:border-[#722f37]/50 hover:shadow-lg">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8dcc6]/60 border border-[#b7a89a]/40 text-[#722f37] transition-all group-hover:bg-[#722f37] group-hover:text-[#FAF7F2]">
                  <Mail className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-[#722f37] bg-[#e8dcc6]/50 px-2.5 py-0.5 rounded-full border border-[#b7a89a]/50">
                  Tailored Pitch Engine
                </span>
              </div>

              <h3 className="mt-5 font-display text-xl font-bold text-[#231815] group-hover:text-[#722f37] transition-colors">
                Personalized AI Cover Letters
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#574943]">
                Generate compelling letters tailored to specific hiring managers, highlighting coursework and directly addressing company needs.
              </p>

              {/* Visual Micro-Widget: Letterhead snippet */}
              <div className="mt-4 rounded-2xl border border-[#b7a89a]/35 bg-[#e8dcc6]/20 p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-display italic font-bold text-[#722f37]">Dear Engineering Hiring Team,</span>
                  <div className="flex gap-1.5">
                    <span className="rounded-md bg-[#FAF7F2] border border-[#b7a89a]/40 px-2 py-0.5 text-[9px] font-bold text-[#231815]">Confident Tone</span>
                    <span className="rounded-md bg-[#FAF7F2] border border-[#b7a89a]/40 px-2 py-0.5 text-[9px] font-bold text-[#231815]">PDF & TXT</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#574943] leading-relaxed line-clamp-2">
                  "I was drawn to your team's work on low-latency microservices, an area directly mirroring my hands-on project building distributed GraphQL APIs..."
                </p>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <button
                type="button"
                onClick={() => onSelectFeature('Personalized AI Cover Letters')}
                className="group/btn inline-flex w-full items-center justify-between rounded-xl border border-[#b7a89a]/50 bg-[#e8dcc6]/30 px-4 py-2.5 text-xs font-bold text-[#231815] transition-all hover:bg-[#722f37] hover:text-[#FAF7F2] hover:border-[#722f37] cursor-pointer"
              >
                <span>Draft Custom Cover Letter</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#722f37] group-hover/btn:text-[#FAF7F2]" />
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              CARD 8 (2 Columns): Roadmaps & Progress Tracker
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 group relative flex flex-col justify-between rounded-3xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-7 shadow-xs transition-all duration-300 hover:border-[#722f37]/50 hover:shadow-lg">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8dcc6]/60 border border-[#b7a89a]/40 text-[#722f37] transition-all group-hover:bg-[#722f37] group-hover:text-[#FAF7F2]">
                  <Compass className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-[#722f37] bg-[#e8dcc6]/50 px-2.5 py-0.5 rounded-full border border-[#b7a89a]/50">
                  Persistent Sync
                </span>
              </div>

              <h3 className="mt-5 font-display text-xl font-bold text-[#231815] group-hover:text-[#722f37] transition-colors">
                Roadmaps & Milestone Tracker
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#574943]">
                Transform skill gaps into structured learning milestones. Track task progress (Not Started, In Progress, Completed) with persistent database sync.
              </p>

              {/* Visual Micro-Widget: Milestone Sprint tracker */}
              <div className="mt-4 rounded-2xl border border-[#b7a89a]/35 bg-[#e8dcc6]/20 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#231815]">Sprint Milestone Progression</span>
                  <span className="font-bold text-[#722f37]">75% Completed</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#574943] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      1. Distributed Systems & Database Indexing
                    </span>
                    <span className="font-bold text-emerald-700">Done ✓</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#231815] font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#722f37]" />
                      2. STAR Mock Interview Defense
                    </span>
                    <span className="font-bold text-[#722f37]">In Progress</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <button
                type="button"
                onClick={() => onSelectFeature('Roadmaps & Progress Tracker')}
                className="group/btn inline-flex w-full items-center justify-between rounded-xl border border-[#b7a89a]/50 bg-[#e8dcc6]/30 px-4 py-2.5 text-xs font-bold text-[#231815] transition-all hover:bg-[#722f37] hover:text-[#FAF7F2] hover:border-[#722f37] cursor-pointer"
              >
                <span>Track My Learning Milestones</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#722f37] group-hover/btn:text-[#FAF7F2]" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
