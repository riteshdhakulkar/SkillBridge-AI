import React from 'react';
import {
  Search,
  Share2,
  Mail,
  TrendingUp,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileCheck2,
  Bookmark,
} from 'lucide-react';

interface CareerToolsSectionProps {
  onOpenJDScanner: () => void;
  onOpenProfileAssets: () => void;
  onOpenOutreach: () => void;
  onNavigateAnalyze: () => void;
}

export const CareerToolsSection: React.FC<CareerToolsSectionProps> = ({
  onOpenJDScanner,
  onOpenProfileAssets,
  onOpenOutreach,
  onNavigateAnalyze,
}) => {
  const tools = [
    {
      id: 'jd-scanner',
      index: '01',
      title: 'Instant JD Keyword Scanner',
      badge: 'Job Intelligence',
      icon: Search,
      description:
        'Deconstruct any tech job posting in seconds. Extract non-negotiable hard skills, seniority bars, and hidden ATS keywords before applying.',
      bullets: [
        'Must-Have vs. Nice-to-Have breakdown',
        'Seniority & qualification detection',
        '1-click auto-fill into ATS scanner',
      ],
      actionText: 'Launch JD Scanner',
      onClick: onOpenJDScanner,
    },
    {
      id: 'profile-assets',
      index: '02',
      title: 'LinkedIn & GitHub Optimizer',
      badge: 'Personal Brand',
      icon: Share2,
      description:
        'Translate real engineering projects into 3 high-CTR LinkedIn headlines, a compelling 3-paragraph recruiter "About" story, and punchy GitHub bio blurbs.',
      bullets: [
        '3 Algorithm-optimized LinkedIn headlines',
        'Story-driven first-person "About" bio',
        'GitHub pinned repository showcases',
      ],
      actionText: 'Generate Profile Copy',
      onClick: onOpenProfileAssets,
    },
    {
      id: 'recruiter-outreach',
      index: '03',
      title: 'Recruiter Cold Outreach & DMs',
      badge: 'Networking Suite',
      icon: Mail,
      description:
        'Generate high-conversion LinkedIn connection notes (<300 chars), recruiter InMails, and cold emails to engineering managers with zero fluff.',
      bullets: [
        'Connection notes under 300 characters',
        'Technical Recruiter InMail pitches',
        'Post-interview thank you notes',
      ],
      actionText: 'Draft Recruiter DMs',
      onClick: onOpenOutreach,
    },
    {
      id: 'score-surge',
      index: '04',
      title: 'ATS Score Surge & Diff Inspector',
      badge: 'ATS Engine',
      icon: TrendingUp,
      description:
        'Compare your baseline resume score directly against your ATS-optimized version with newly woven keywords and Google XYZ metric-driven bullet points.',
      bullets: [
        'Before vs. After score comparison',
        'Keyword alignment & XYZ diagnostics',
        'Recruiter-ready vector PDF export',
      ],
      actionText: 'Analyze & Surge Score',
      onClick: onNavigateAnalyze,
    },
  ];

  return (
    <section className="relative bg-[#FAF7F2] py-20 sm:py-28 border-b border-[#b7a89a]/35 overflow-hidden">
      {/* Ambient background bloom in Mocha Cream & Burgundy */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(232, 220, 198, 0.6), rgba(114, 47, 55, 0.12), transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header with Designer Typography */}
        <div className="mx-auto max-w-2xl text-center space-y-4 mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#b7a89a]/70 bg-[#e8dcc6]/45 px-4 py-1.5 text-xs font-semibold text-[#722f37] shadow-2xs backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#722f37]" />
            <span className="tracking-wider uppercase text-[11px] font-bold">The Career Accelerator Suite</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#231815]">
            Crafted for Ambition,{' '}
            <span className="font-display italic font-normal text-[#722f37]">
              Engineered to Convert.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-[#574943] leading-relaxed">
            Every step from deconstructing job descriptions to polishing your personal brand and cold-pitching hiring managers — integrated into one aesthetic experience.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-[#722f37]/50 hover:shadow-xl hover:shadow-[#722f37]/10"
              >
                <div>
                  {/* Top Bar: Icon, Index & Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8dcc6]/60 border border-[#b7a89a]/40 text-[#722f37] shadow-2xs transition-transform duration-300 group-hover:scale-105 group-hover:bg-[#722f37] group-hover:text-[#FAF7F2]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display italic text-xs font-bold text-[#b7a89a]">
                        {tool.index}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#b7a89a]/50 bg-[#e8dcc6]/40 text-[#722f37]">
                        {tool.badge}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-5 font-display text-lg font-bold text-[#231815] group-hover:text-[#722f37] transition-colors">
                    {tool.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#574943] leading-relaxed">
                    {tool.description}
                  </p>

                  {/* Bullet Points */}
                  <div className="mt-5 pt-4 border-t border-[#e8dcc6]">
                    <ul className="space-y-2">
                      {tool.bullets.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-[#574943]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#722f37] shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-6 pt-2">
                  <button
                    type="button"
                    onClick={tool.onClick}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#722f37] hover:bg-[#551b22] py-2.5 text-xs font-bold text-[#FAF7F2] shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span>{tool.actionText}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#e8dcc6] transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
