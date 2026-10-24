import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { CareerToolsSection } from './components/CareerToolsSection';
import { AestheticTransformationSlider } from './components/AestheticTransformationSlider';
import { Footer } from './components/Footer';
import { DashboardPage } from './components/DashboardPage';
import { ResumeAnalysisPage } from './components/ResumeAnalysisPage';
import { ProgressPage } from './components/ProgressPage';
import { AuthModal } from './components/AuthModal';
import { JDAnalyzerModal } from './components/JDAnalyzerModal';
import { ProfileAssetsModal } from './components/ProfileAssetsModal';
import { RecruiterOutreachModal } from './components/RecruiterOutreachModal';
import { User } from './types/analysis';
import { Sparkles, Lock, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard' | 'analyze' | 'progress'>(() => {
    try {
      const saved = sessionStorage.getItem('skillbridge_nav_page') as 'home' | 'dashboard' | 'analyze' | 'progress' | null;
      if (saved && ['home', 'dashboard', 'analyze', 'progress'].includes(saved)) {
        return saved;
      }
      if (localStorage.getItem('skillbridge_active_analysis')) {
        return 'analyze';
      }
    } catch {
      // storage error fallback
    }
    return 'home';
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('skillbridge_nav_page', currentPage);
    } catch {
      // storage error fallback
    }
  }, [currentPage]);
  const [targetRoleContext, setTargetRoleContext] = useState<string | undefined>(undefined);
  const [dashboardRefreshToken, setDashboardRefreshToken] = useState<number>(0);

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Career Accelerator Tools State
  const [jdModalOpen, setJdModalOpen] = useState<boolean>(false);
  const [profileAssetsModalOpen, setProfileAssetsModalOpen] = useState<boolean>(false);
  const [outreachModalOpen, setOutreachModalOpen] = useState<boolean>(false);

  // Check active session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && json.user) {
            setCurrentUser(json.user);
            try {
              localStorage.setItem('skillbridge_auth_user', JSON.stringify(json.user));
            } catch {}
            setAuthChecking(false);
            return;
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      }

      // Fallback for static environments (e.g. Vercel)
      try {
        const saved = localStorage.getItem('skillbridge_auth_user');
        if (saved) {
          setCurrentUser(JSON.parse(saved));
        }
      } catch {}

      setAuthChecking(false);
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

  const handleNavigateProgress = () => {
    if (!currentUser) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }
    setCurrentPage('progress');
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
    try {
      localStorage.removeItem('skillbridge_auth_user');
    } catch {}
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
      <div className="min-h-screen bg-[#FBFBF9] flex items-center justify-center text-stone-500 text-sm">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <span className="font-medium text-stone-700">Loading SkillBridge AI...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#231815] selection:bg-[#e8dcc6] selection:text-[#722f37] flex flex-col font-sans antialiased">
      {/* Top Navigation Bar */}
      <Navbar
        currentPage={currentPage}
        currentUser={currentUser}
        onNavigateHome={handleNavigateHome}
        onNavigateDashboard={handleNavigateDashboard}
        onNavigateAnalyze={() => handleNavigateAnalyze()}
        onNavigateProgress={handleNavigateProgress}
        onOpenLogin={() => {
          setAuthModalMode('login');
          setAuthModalOpen(true);
        }}
        onOpenSignup={() => {
          setAuthModalMode('signup');
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenJDScanner={() => setJdModalOpen(true)}
        onOpenProfileAssets={() => setProfileAssetsModalOpen(true)}
        onOpenOutreach={() => setOutreachModalOpen(true)}
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

            {/* Interactive Before & After Transformation Slider */}
            <AestheticTransformationSlider
              onAnalyzeClick={() => {
                if (!currentUser) {
                  setAuthModalMode('signup');
                  setAuthModalOpen(true);
                } else {
                  handleNavigateAnalyze();
                }
              }}
            />

            {/* Career Accelerator Tools Showcase */}
            <CareerToolsSection
              onOpenJDScanner={() => setJdModalOpen(true)}
              onOpenProfileAssets={() => setProfileAssetsModalOpen(true)}
              onOpenOutreach={() => setOutreachModalOpen(true)}
              onNavigateAnalyze={() => handleNavigateAnalyze()}
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
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8dcc6]/60 text-[#722f37] mb-4 border border-[#b7a89a]/50 shadow-xs">
                <Lock className="h-7 w-7 text-[#722f37]" />
              </div>
              <h2 className="font-display text-2xl font-bold text-[#231815]">Sign In Required</h2>
              <p className="mt-2 text-xs text-[#574943] leading-relaxed">
                Please sign in or create an account to access your personal dashboard and saved resume analyses.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#b7a89a]/60 bg-[#FAF7F2] px-5 py-2.5 text-xs font-bold text-[#231815] hover:bg-[#e8dcc6]/40 transition-colors cursor-pointer"
                >
                  <LogIn className="h-4 w-4 text-[#722f37]" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('signup');
                    setAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-5 py-2.5 text-xs font-bold text-[#FAF7F2] shadow-md shadow-[#722f37]/20 transition-colors cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 text-[#e8dcc6]" />
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
              onOpenProfileAssets={() => setProfileAssetsModalOpen(true)}
              onOpenOutreach={() => setOutreachModalOpen(true)}
            />
          ) : (
            <div className="mx-auto max-w-md px-4 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8dcc6]/60 text-[#722f37] mb-4 border border-[#b7a89a]/50 shadow-xs">
                <Lock className="h-7 w-7 text-[#722f37]" />
              </div>
              <h2 className="font-display text-2xl font-bold text-[#231815]">Sign In Required</h2>
              <p className="mt-2 text-xs text-[#574943] leading-relaxed">
                Please sign in or create an account to run resume evaluations and save your analyses.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#b7a89a]/60 bg-[#FAF7F2] px-5 py-2.5 text-xs font-bold text-[#231815] hover:bg-[#e8dcc6]/40 transition-colors cursor-pointer"
                >
                  <LogIn className="h-4 w-4 text-[#722f37]" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('signup');
                    setAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-5 py-2.5 text-xs font-bold text-[#FAF7F2] shadow-md shadow-[#722f37]/20 transition-colors cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 text-[#e8dcc6]" />
                  <span>Create Account</span>
                </button>
              </div>
            </div>
          )
        )}

        {currentPage === 'progress' && (
          currentUser ? (
            <ProgressPage
              onNavigateAnalyze={handleNavigateAnalyze}
              onNavigateDashboard={handleNavigateDashboard}
            />
          ) : (
            <div className="mx-auto max-w-md px-4 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8dcc6]/60 text-[#722f37] mb-4 border border-[#b7a89a]/50 shadow-xs">
                <Lock className="h-7 w-7 text-[#722f37]" />
              </div>
              <h2 className="font-display text-2xl font-bold text-[#231815]">Sign In Required</h2>
              <p className="mt-2 text-xs text-[#574943] leading-relaxed">
                Please sign in or create an account to view and track your personalized skill progress.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#b7a89a]/60 bg-[#FAF7F2] px-5 py-2.5 text-xs font-bold text-[#231815] hover:bg-[#e8dcc6]/40 transition-colors cursor-pointer"
                >
                  <LogIn className="h-4 w-4 text-[#722f37]" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('signup');
                    setAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-5 py-2.5 text-xs font-bold text-[#FAF7F2] shadow-md shadow-[#722f37]/20 transition-colors cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 text-[#e8dcc6]" />
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

      {/* Feature 2: Instant Job Description Deconstructor */}
      <JDAnalyzerModal
        isOpen={jdModalOpen}
        onClose={() => setJdModalOpen(false)}
        onApplyJDToAnalysis={(jd, role) => {
          if (!currentUser) {
            setAuthModalMode('login');
            setAuthModalOpen(true);
          } else {
            handleNavigateAnalyze(role);
            try {
              sessionStorage.setItem('skillbridge_prefilled_jd', jd);
            } catch {}
          }
        }}
      />

      {/* Feature 3: LinkedIn & GitHub Profile Optimizer */}
      <ProfileAssetsModal
        isOpen={profileAssetsModalOpen}
        onClose={() => setProfileAssetsModalOpen(false)}
        candidateName={currentUser?.fullName || 'Ritesh Dhakulkar'}
        targetTitle={targetRoleContext || 'Junior Full-Stack Developer'}
      />

      {/* Feature 4: Recruiter Cold Outreach Generator */}
      <RecruiterOutreachModal
        isOpen={outreachModalOpen}
        onClose={() => setOutreachModalOpen(false)}
        defaultCandidateName={currentUser?.fullName || 'Ritesh Dhakulkar'}
        defaultRole={targetRoleContext || 'Junior Full-Stack Developer'}
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
