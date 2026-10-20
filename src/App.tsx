import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { DashboardPage } from './components/DashboardPage';
import { ResumeAnalysisPage } from './components/ResumeAnalysisPage';
import { AuthModal } from './components/AuthModal';
import { User } from './types/analysis';
import { Sparkles, Lock, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard' | 'analyze'>('home');
  const [targetRoleContext, setTargetRoleContext] = useState<string | undefined>(undefined);
  const [dashboardRefreshToken, setDashboardRefreshToken] = useState<number>(0);

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Check active session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.user) {
            setCurrentUser(json.user);
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setAuthChecking(false);
      }
    }
    checkSession();
  }, []);

  const handleNavigateHome = () => {
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateDashboard = () => {
    if (!currentUser) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }
    setCurrentPage('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateAnalyze = (role?: string) => {
    if (!currentUser) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }
    setTargetRoleContext(role);
    setCurrentPage('analyze');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalysisSaved = (_savedId?: number) => {
    setDashboardRefreshToken((prev) => prev + 1);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setCurrentUser(null);
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreFeatures = () => {
    if (currentPage !== 'home') {
      setCurrentPage('home');
      setTimeout(() => {
        const el = document.getElementById('features');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      const el = document.getElementById('features');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-500 text-sm">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Loading SkillBridge AI...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 flex flex-col font-sans antialiased">
      {/* Top Navigation Bar */}
      <Navbar
        currentPage={currentPage}
        currentUser={currentUser}
        onNavigateHome={handleNavigateHome}
        onNavigateDashboard={handleNavigateDashboard}
        onNavigateAnalyze={() => handleNavigateAnalyze()}
        onOpenLogin={() => {
          setAuthModalMode('login');
          setAuthModalOpen(true);
        }}
        onOpenSignup={() => {
          setAuthModalMode('signup');
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <>
            {/* Landing Page Hero Section */}
            <Hero
              onAnalyzeClick={() => {
                if (!currentUser) {
                  setAuthModalMode('signup');
                  setAuthModalOpen(true);
                } else {
                  handleNavigateAnalyze();
                }
              }}
              onExploreClick={handleExploreFeatures}
            />

            {/* Feature Cards Section */}
            <Features
              onSelectFeature={() => {
                if (!currentUser) {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                } else {
                  handleNavigateAnalyze();
                }
              }}
            />
          </>
        )}

        {currentPage === 'dashboard' && (
          currentUser ? (
            <DashboardPage
              onOpenAnalyze={(role) => handleNavigateAnalyze(role)}
              refreshToken={dashboardRefreshToken}
            />
          ) : (
            <div className="mx-auto max-w-md px-4 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
                <Lock className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Please sign in or create an account to access your personal dashboard and saved resume analyses.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <LogIn className="h-4 w-4 text-slate-500" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('signup');
                    setAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                </button>
              </div>
            </div>
          )
        )}

        {currentPage === 'analyze' && (
          currentUser ? (
            <ResumeAnalysisPage
              onNavigateDashboard={handleNavigateDashboard}
              initialRole={targetRoleContext}
              onAnalysisSaved={handleAnalysisSaved}
            />
          ) : (
            <div className="mx-auto max-w-md px-4 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
                <Lock className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Please sign in or create an account to run resume evaluations and save your analyses.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <LogIn className="h-4 w-4 text-slate-500" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('signup');
                    setAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setCurrentPage('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Reusable Simple Footer */}
      <Footer
        onNavigateAnalyze={() => {
          if (!currentUser) {
            setAuthModalMode('login');
            setAuthModalOpen(true);
          } else {
            handleNavigateAnalyze();
          }
        }}
        onNavigateDashboard={handleNavigateDashboard}
        onNavigateHome={handleNavigateHome}
      />
    </div>
  );
}
