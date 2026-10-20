import React from 'react';
import { Sparkles } from 'lucide-react';

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
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 text-left cursor-pointer focus:outline-none"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-base font-bold text-slate-900">
                SkillBridge <span className="text-indigo-600">AI</span>
              </span>
            </button>
            <p className="text-xs text-slate-500 max-w-sm">
              Empowering students to analyze resumes, identify in-demand skill gaps, and match with ideal tech careers.
            </p>
          </div>

          {/* Quick Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-600">
            <button
              onClick={onNavigateHome}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
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
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={onNavigateDashboard}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <button
              onClick={onNavigateAnalyze}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Analyze Resume
            </button>
          </nav>
        </div>

        {/* Bottom line */}
        <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} SkillBridge AI. Built for students & early-career professionals.</p>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Free and privacy-respecting career tools</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
