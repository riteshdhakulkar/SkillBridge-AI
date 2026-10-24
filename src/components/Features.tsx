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
} from 'lucide-react';

interface FeaturesProps {
  onSelectFeature: (featureName: string) => void;
}

export const Features: React.FC<FeaturesProps> = ({ onSelectFeature }) => {
  const features = [
    {
      id: 'resume-analysis',
      title: 'AI Resume & ATS Match Scanner',
      icon: FileCheck2,
      badge: 'Core Engine',
      description:
        'Instant deep diagnostics against live job descriptions. Evaluates keyword overlap, catches formatting pitfalls, and generates an honest match readiness score.',
      capabilities: [
        'Deterministic semantic ATS scoring (0-100%)',
        'Keyword density & critical gap diagnosis',
        'Direct project evidence validation',
      ],
      ctaText: 'Scan My Resume',
    },
    {
      id: 'ats-resume-rewrite',
      title: 'Gap-Confirmed ATS Resume Studio',
      icon: Sparkles,
      badge: 'Recruiter-Ready',
      description:
        'Select which missing skills you know, confirm project context, and let AI seamlessly weave them into your real resume in Google XYZ format with 1-click vector PDF export.',
      capabilities: [
        'Before vs. After Score Surge gauge',
        '1-Click Role Switcher presets',
        'Clean multi-page vector PDF download',
      ],
      ctaText: 'Open Resume Studio',
    },
    {
      id: 'jd-scanner',
      title: 'Instant JD Keyword Deconstructor',
      icon: Search,
      badge: 'Job Intelligence',
      description:
        'Paste any job posting from LinkedIn, Indeed, or careers pages to instantly extract must-have hard skills, seniority level, and recruiter screening criteria.',
      capabilities: [
        'Critical vs. Nice-to-Have skill breakdown',
        'Experience & education qualification filters',
        '1-click auto-fill into Resume Match Engine',
      ],
      ctaText: 'Scan Job Posting',
    },
    {
      id: 'bullet-rewriter',
      title: 'Google XYZ Bullet Rewriter',
      icon: Zap,
      badge: 'High Impact',
      description:
        'Turn passive college project bullet points into measurable achievements: "Accomplished [X], measured by [Y], by doing [Z]" with 3 tailor-made variations.',
      capabilities: [
        'Hard metric & percentage suggestions',
        'Strong action verbs & technical precision',
        'Instant 1-click copy to clipboard',
      ],
      ctaText: 'Rewrite My Bullets',
    },
    {
      id: 'profile-outreach',
      title: 'LinkedIn, GitHub & Outreach Suite',
      icon: Share2,
      badge: 'Personal Brand',
      description:
        'Generate high-CTR LinkedIn headlines, recruiter-ready "About" summaries, GitHub bios, and personalized recruiter cold DMs and InMails in seconds.',
      capabilities: [
        '3 Algorithm-optimized LinkedIn headlines',
        'LinkedIn connection notes under 300 chars',
        'Cold emails with eye-catching subjects',
      ],
      ctaText: 'Generate Social Assets',
    },
    {
      id: 'mock-interview',
      title: 'STAR Technical Interview Prep',
      icon: MessageSquare,
      badge: 'Interview Ready',
      description:
        'Practice answering role-specific technical and behavioral questions. Receive immediate AI scoring (1-10) using the STAR methodology with tailored model answers.',
      capabilities: [
        'Grounded in your real resume projects',
        'Instant STAR scoring, strengths & critiques',
        'Upgraded recruiter-ready model answers',
      ],
      ctaText: 'Practice Interviews',
    },
    {
      id: 'cover-letter',
      title: 'Personalized AI Cover Letters',
      icon: Mail,
      badge: 'Tailored Pitch',
      description:
        'Generate compelling, personalized cover letters tailored to specific hiring managers. Highlights your academic milestones and directly addresses company needs.',
      capabilities: [
        'Tone selection: Confident, Enthusiastic, Formal',
        'Key hooks & attention-grabbing subject lines',
        '1-click export to PDF and text (.txt)',
      ],
      ctaText: 'Generate Cover Letter',
    },
    {
      id: 'learning-roadmaps',
      title: 'Roadmaps & Progress Tracker',
      icon: Compass,
      badge: 'Progress Tracker',
      description:
        'Transform skill gaps into structured learning milestones. Track task progress (Not Started, In Progress, Completed) with persistent database sync and progress bars.',
      capabilities: [
        'Step-by-step milestone sprint breakdown',
        'Curated free student learning resources',
        'Persistent database tracking',
      ],
      ctaText: 'View My Progress',
    },
  ];

  return (
    <section id="features" className="relative scroll-mt-16 bg-[#FAF7F2] py-24 border-b border-[#b7a89a]/35">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#b7a89a]/70 bg-[#e8dcc6]/45 px-4 py-1.5 text-xs font-semibold text-[#722f37] shadow-2xs backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#722f37]" />
            <span className="tracking-wider uppercase text-[11px] font-bold">Complete Career Suite</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#231815]">
            Everything Students Need to{' '}
            <span className="font-display italic font-normal text-[#722f37]">
              Land Tech Offers.
            </span>
          </h2>

          <p className="text-sm sm:text-base leading-relaxed text-[#574943]">
            A curated career suite designed to bridge your college coursework and projects directly into recruiter interviews with aesthetic clarity.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-[#722f37]/50 hover:shadow-xl hover:shadow-[#722f37]/10"
              >
                <div>
                  {/* Icon & Category Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8dcc6]/60 border border-[#b7a89a]/40 text-[#722f37] shadow-2xs transition-transform duration-300 group-hover:scale-105 group-hover:bg-[#722f37] group-hover:text-[#FAF7F2]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold text-[#722f37] bg-[#e8dcc6]/40 px-2.5 py-0.5 rounded-full border border-[#b7a89a]/50">
                      {feature.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-5 font-display text-base font-bold text-[#231815] group-hover:text-[#722f37] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#574943]">
                    {feature.description}
                  </p>

                  {/* Capabilities List */}
                  <div className="mt-5 border-t border-[#e8dcc6] pt-4">
                    <ul className="space-y-1.5">
                      {feature.capabilities.map((cap, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-[#574943]">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#722f37]" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="mt-6 pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectFeature(feature.title)}
                    className="group/btn inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#b7a89a]/60 bg-[#e8dcc6]/30 py-2.5 text-xs font-bold text-[#231815] shadow-2xs transition-all hover:bg-[#722f37] hover:text-[#FAF7F2] hover:border-[#722f37] active:scale-[0.98] cursor-pointer"
                  >
                    <span>{feature.ctaText}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#722f37] transition-transform group-hover/btn:translate-x-1 group-hover/btn:text-[#FAF7F2]" />
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
