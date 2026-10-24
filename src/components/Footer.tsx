import React from 'react';
import { Sparkles, Code2, Heart } from 'lucide-react';

interface FooterProps {
  onNavigateAnalyze: () => void;
  onNavigateDashboard: () => void;
  onNavigateHome: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateAnalyze,
  onNavigateDashboard,
  onNavigateHome,
}) => {
  return (
    <footer className="border-t border-[#b7a89a]/35 bg-[#FAF7F2]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 text-left cursor-pointer focus:outline-none"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#722f37] text-[#FAF7F2] shadow-xs">
                <Sparkles className="h-4 w-4 text-[#e8dcc6]" />
              </div>
              <span className="font-display text-lg font-bold text-[#231815]">
                SkillBridge <span className="text-[#722f37]">AI</span>
              </span>
            </button>
            <p className="text-xs text-[#574943] max-w-sm">
              Empowering students to analyze resumes, identify in-demand skill gaps, and match with ideal tech careers.
            </p>
          </div>

          {/* Quick Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-[#574943]">
            <button
              onClick={onNavigateHome}
              className="hover:text-[#722f37] transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigateHome();
                setTimeout(() => {
                  const el = document.getElementById('features');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="hover:text-[#722f37] transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={onNavigateDashboard}
              className="hover:text-[#722f37] transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <button
              onClick={onNavigateAnalyze}
              className="hover:text-[#722f37] transition-colors cursor-pointer"
            >
              Analyze Resume
            </button>
          </nav>
        </div>

        {/* Bottom line */}
        <div className="mt-8 pt-8 border-t border-[#b7a89a]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#574943]">
          <p>© {new Date().getFullYear()} SkillBridge AI. Designed for ambitious students & engineers.</p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b7a89a]/50 bg-[#e8dcc6]/35 px-3.5 py-1 text-xs text-[#231815] shadow-2xs">
              <Code2 className="h-3.5 w-3.5 text-[#722f37]" />
              <span>Developed with care by</span>
              <a
                href="https://riteshdhakulkarportfolio.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#722f37] hover:underline transition-colors"
              >
                Ritesh Dhakulkar
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
