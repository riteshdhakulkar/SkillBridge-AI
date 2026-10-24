import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, XCircle, TrendingUp, Award, Zap } from 'lucide-react';

interface AestheticTransformationSliderProps {
  onAnalyzeClick: () => void;
}

interface CaseStudy {
  id: string;
  role: string;
  category: string;
  companyTarget: string;
  beforeScore: number;
  afterScore: number;
  beforeTitle: string;
  beforeBullet: string;
  beforeFlaw: string;
  afterTitle: string;
  afterBullet: string;
  afterFormula: string;
  keywordsAdded: string[];
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'swe',
    role: 'Full Stack Engineer',
    category: 'Engineering & Systems',
    companyTarget: 'Stripe, Datadog, Vercel',
    beforeScore: 54,
    afterScore: 92,
    beforeTitle: 'Original Generic Resume',
    beforeBullet: 'Responsible for building APIs and working on the backend database queries using Node and SQL.',
    beforeFlaw: 'Passive phrasing, zero quantitative metrics, no business impact shown.',
    afterTitle: 'Aesthetic High-Impact Bullet',
    afterBullet: 'Architected distributed GraphQL/Node microservices handling 4.2M daily calls, reducing p99 API latency by 43% and slashing AWS compute overhead by $38K/quarter.',
    afterFormula: 'Google XYZ Formula: Accomplished [X] measured by [Y] by doing [Z]',
    keywordsAdded: ['Distributed Systems', 'p99 Latency', 'GraphQL', 'AWS Cost Optimization'],
  },
  {
    id: 'pm',
    role: 'Product Manager',
    category: 'Product Strategy',
    companyTarget: 'Notion, Figma, Linear',
    beforeScore: 58,
    afterScore: 95,
    beforeTitle: 'Original Generic Resume',
    beforeBullet: 'Helped the design team launch the new user onboarding flow and talked to beta testers.',
    beforeFlaw: 'Vague collaboration verbs, no conversion metrics, no ownership documented.',
    afterTitle: 'Aesthetic High-Impact Bullet',
    afterBullet: 'Spearheaded zero-friction self-serve onboarding redesign across 120K signups, elevating day-30 trial-to-paid conversion from 4.1% to 8.9% (+$1.4M ARR).',
    afterFormula: 'Impact Driven: Led initiative [X] across cohort [Y] yielding [Z] metric',
    keywordsAdded: ['Product-Led Growth', 'Cohort Retention', 'Funnel Optimization', 'ARR Expansion'],
  },
  {
    id: 'ds',
    role: 'AI / ML Engineer',
    category: 'Applied Intelligence',
    companyTarget: 'OpenAI, Anthropic, Scale AI',
    beforeScore: 61,
    afterScore: 94,
    beforeTitle: 'Original Generic Resume',
    beforeBullet: 'Trained machine learning models using Python and PyTorch on internal customer support datasets.',
    beforeFlaw: 'Academic description without production serving or evaluation context.',
    afterTitle: 'Aesthetic High-Impact Bullet',
    afterBullet: 'Fine-tuned 8B parameter Llama 3 models using LoRA and vLLM inference streaming; boosted intent accuracy from 74% to 91.2% while trimming token generation latency by 2.4x.',
    afterFormula: 'Technical Authority: Fine-tuned [Model] via [Method] delivering [Accuracy & Speed]',
    keywordsAdded: ['LoRA Fine-Tuning', 'vLLM Serving', 'Quantization', 'Inference Optimization'],
  },
  {
    id: 'designer',
    role: 'Lead Product Designer',
    category: 'UX / Visual Systems',
    companyTarget: 'Airbnb, Apple, Linear',
    beforeScore: 49,
    afterScore: 91,
    beforeTitle: 'Original Generic Resume',
    beforeBullet: 'Created Figma components and coordinated with front-end engineers during design handoff.',
    beforeFlaw: 'Task-based description that treats senior design leadership as asset creation.',
    afterTitle: 'Aesthetic High-Impact Bullet',
    afterBullet: 'Engineered multi-brand design token architecture across 40+ production components, accelerating sprint feature velocity by 35% and unifying accessibility to WCAG AAA.',
    afterFormula: 'Design Systems Impact: Architected [System] reducing cycle-time [X] and achieving [Standard]',
    keywordsAdded: ['Design Tokens', 'WCAG AAA', 'Design System Architecture', 'Velocity Acceleration'],
  },
];

export const AestheticTransformationSlider: React.FC<AestheticTransformationSliderProps> = ({
  onAnalyzeClick,
}) => {
  const [selectedCase, setSelectedCase] = useState<CaseStudy>(CASE_STUDIES[0]);

  return (
    <section className="py-20 bg-[#FAF7F2] border-t border-b border-[#b7a89a]/30 relative overflow-hidden">
      {/* Background aesthetic blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e8dcc6]/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#722f37]/5 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8dcc6]/60 border border-[#b7a89a]/50 text-[#722f37] text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-[#722f37]" />
            <span>Interactive Transformation Case Studies</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#231815] tracking-tight">
            From Bland Bullet Points to <span className="italic text-[#722f37]">High-Offer Magnetic Résumés</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#574943] leading-relaxed">
            See how SkillBridge AI rewrites weak, passive resume statements into verified Google XYZ accomplishment formulas that recruiters fight over.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {CASE_STUDIES.map((c) => {
            const isSelected = c.id === selectedCase.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCase(c)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#722f37] text-[#FAF7F2] shadow-md shadow-[#722f37]/20 scale-102'
                    : 'bg-[#FAF7F2] text-[#574943] border border-[#b7a89a]/40 hover:bg-[#e8dcc6]/40 hover:text-[#231815]'
                }`}
              >
                {c.role}
              </button>
            );
          })}
        </div>

        {/* Interactive Comparison Card */}
        <div className="mt-8 rounded-3xl border border-[#b7a89a]/40 bg-[#FAF7F2] shadow-xl overflow-hidden">
          {/* Card Meta Bar */}
          <div className="px-6 py-4 bg-[#e8dcc6]/40 border-b border-[#b7a89a]/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[#722f37]">{selectedCase.category}</span>
              <span className="text-[#b7a89a]">•</span>
              <span className="text-[#574943]">Target Companies: <strong>{selectedCase.companyTarget}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#722f37]/10 text-[#722f37] px-2.5 py-0.5 font-bold">
                <TrendingUp className="h-3 w-3" />
                Score Surge: +{selectedCase.afterScore - selectedCase.beforeScore} pts
              </span>
            </div>
          </div>

          {/* Side by side comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#b7a89a]/30">
            {/* Before (Weak / Generic) */}
            <div className="p-6 sm:p-8 bg-rose-50/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
                    <XCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-rose-800">
                      Before SkillBridge
                    </h3>
                    <p className="text-[11px] text-[#574943]">{selectedCase.beforeTitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-rose-600 tabular-nums">
                    {selectedCase.beforeScore}%
                  </span>
                  <span className="block text-[10px] text-[#574943] font-bold">ATS Match</span>
                </div>
              </div>

              {/* Bullet quote */}
              <div className="rounded-2xl border border-rose-200/80 bg-white/80 p-4 shadow-2xs">
                <p className="text-xs sm:text-sm text-[#231815] italic leading-relaxed">
                  "{selectedCase.beforeBullet}"
                </p>
              </div>

              {/* Identified flaws */}
              <div className="mt-4 p-3 rounded-xl bg-rose-100/50 border border-rose-200/50">
                <p className="text-[11px] text-rose-900 leading-snug">
                  <strong>Why it gets rejected:</strong> {selectedCase.beforeFlaw}
                </p>
              </div>
            </div>

            {/* After (Optimized / Aesthetic) */}
            <div className="p-6 sm:p-8 bg-emerald-50/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-800">
                      After SkillBridge AI
                    </h3>
                    <p className="text-[11px] text-[#574943]">{selectedCase.afterTitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-700 tabular-nums">
                    {selectedCase.afterScore}%
                  </span>
                  <span className="block text-[10px] text-emerald-700 font-bold">ATS High-Match</span>
                </div>
              </div>

              {/* Bullet quote */}
              <div className="rounded-2xl border border-emerald-300/80 bg-white p-4 shadow-2xs">
                <p className="text-xs sm:text-sm text-[#231815] font-medium leading-relaxed">
                  "{selectedCase.afterBullet}"
                </p>
              </div>

              {/* Formula & Keywords */}
              <div className="mt-4 p-3 rounded-xl bg-[#e8dcc6]/50 border border-[#b7a89a]/40 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#722f37]">
                  <Award className="h-3.5 w-3.5" />
                  <span>{selectedCase.afterFormula}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedCase.keywordsAdded.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#b7a89a]/50 text-[10px] font-bold text-[#231815]"
                    >
                      +{kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="p-6 bg-gradient-to-r from-[#e8dcc6]/60 via-[#FAF7F2] to-[#e8dcc6]/60 border-t border-[#b7a89a]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h4 className="font-display text-base font-bold text-[#231815]">
                Ready to elevate your resume to a {selectedCase.afterScore}% score?
              </h4>
              <p className="text-xs text-[#574943]">
                Upload your existing PDF or paste any target role to get an immediate aesthetic overhaul.
              </p>
            </div>
            <button
              type="button"
              onClick={onAnalyzeClick}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-6 py-3 text-xs sm:text-sm font-bold text-[#FAF7F2] shadow-md shadow-[#722f37]/25 transition-all cursor-pointer active:scale-95"
            >
              <Zap className="h-4 w-4 text-[#e8dcc6]" />
              <span>Transform My Resume Now</span>
              <ArrowRight className="h-4 w-4 text-[#e8dcc6]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

