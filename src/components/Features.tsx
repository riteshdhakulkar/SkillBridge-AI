import React from 'react';
import {
  FileCheck2,
  Target,
  Compass,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface FeaturesProps {
  onSelectFeature: (featureName: string) => void;
}

export const Features: React.FC<FeaturesProps> = ({ onSelectFeature }) => {
  const features = [
    {
      id: 'resume-analysis',
      title: 'AI Resume Analysis',
      icon: FileCheck2,
      description:
        'Instant deep diagnostics of your resume. Catch ATS formatting pitfalls, weak action verbs, and missing role keywords before recruiters see them.',
      capabilities: [
        'ATS formatting & parsing validation',
        'STAR-method bullet point optimizer',
        'Keyword density & relevance scoring',
      ],
      badge: 'Core Scanner',
      ctaText: 'Scan My Resume',
    },
    {
      id: 'job-matching',
      title: 'Smart Job Matching',
      icon: Target,
      description:
        'Evaluate your profile directly against actual job postings. Understand exact qualification overlap and see how competitive your application is.',
      capabilities: [
        'Job description skill extraction',
        'Weighted match rate calculation',
        'Must-have vs nice-to-have breakdown',
      ],
      badge: 'Semantic Matching',
      ctaText: 'Compare with Jobs',
    },
    {
      id: 'learning-roadmaps',
      title: 'Personalized Learning Roadmaps',
      icon: Compass,
      description:
        'Turn your identified skill gaps into step-by-step learning sprints. Get curated tutorials, open-source projects, and portfolio-worthy tasks.',
      capabilities: [
        'Tailored milestone timelines',
        'Curated free student learning paths',
        'Practical portfolio project prompts',
      ],
      badge: 'Skill Growth',
      ctaText: 'View Learning Paths',
    },
  ];

  return (
    <section id="features" className="relative scroll-mt-16 bg-slate-50/70 py-20 border-y border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Platform Capabilities</span>
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Everything Students Need to Stand Out
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Purpose-built tools designed to demystify technical hiring criteria and turn your college experience into an interview magnet.
          </p>
        </div>

        {/* Feature Cards Grid (3 cards) */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <div>
                  {/* Icon & Category Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">
                      {feature.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {feature.description}
                  </p>

                  {/* Capabilities List */}
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <ul className="space-y-2.5">
                      {feature.capabilities.map((cap, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Action Link */}
                <div className="mt-8 pt-4">
                  <button
                    type="button"
                    onClick={() => onSelectFeature(feature.title)}
                    className="group/btn inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 active:scale-[0.99] cursor-pointer"
                  >
                    <span>{feature.ctaText}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
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
