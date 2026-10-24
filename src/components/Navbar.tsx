import React, { useState } from 'react';
import {
  Sparkles,
  Menu,
  X,
  FileText,
  LayoutDashboard,
  ArrowRight,
  User as UserIcon,
  LogOut,
  LogIn,
  UserPlus,
  ListTodo,
} from 'lucide-react';
import { User } from '../types/analysis';

interface NavbarProps {
  currentPage: 'home' | 'dashboard' | 'analyze' | 'progress';
  onNavigateProgress: () => void;
  currentUser: User | null;
  onNavigateHome: () => void;
  onNavigateDashboard: () => void;
  onNavigateAnalyze: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onLogout: () => void;
  onOpenJDScanner?: () => void;
  onOpenProfileAssets?: () => void;
  onOpenOutreach?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  currentUser,
  onNavigateHome,
  onNavigateDashboard,
  onNavigateAnalyze,
  onNavigateProgress,
  onOpenLogin,
  onOpenSignup,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNavClick = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#b7a89a]/35 bg-[#FAF7F2]/90 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="group flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#722f37] rounded-xl p-1 cursor-pointer transition-transform active:scale-95"
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-[#722f37] opacity-20 blur-xs group-hover:opacity-40 transition-opacity duration-300" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#722f37] text-[#FAF7F2] shadow-xs transition-transform duration-200 group-hover:scale-105">
                <Sparkles className="h-5 w-5 text-[#e8dcc6]" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-xl font-bold tracking-tight text-[#231815]">
                SkillBridge
              </span>
              <span className="text-[10px] font-black tracking-widest text-[#722f37] bg-[#e8dcc6]/60 px-1.5 py-0.5 rounded-md border border-[#b7a89a]/50 uppercase">
                AI
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links (Segmented Capsule) */}
        <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-[#e8dcc6]/35 p-1 border border-[#b7a89a]/45 shadow-2xs backdrop-blur-sm">
          <button
            onClick={onNavigateHome}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              currentPage === 'home'
                ? 'bg-[#FAF7F2] text-[#722f37] shadow-2xs font-bold border border-[#b7a89a]/40'
                : 'text-[#574943] hover:text-[#231815] hover:bg-[#FAF7F2]/60'
            }`}
          >
            Home
          </button>

          {currentPage === 'home' ? (
            <a
              href="#features"
              className="px-3.5 py-1.5 text-xs font-semibold text-[#574943] hover:text-[#231815] hover:bg-[#FAF7F2]/60 rounded-xl transition-all cursor-pointer"
            >
              Features
            </a>
          ) : (
            <button
              onClick={() => {
                onNavigateHome();
                setTimeout(() => {
                  const el = document.getElementById('features');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#574943] hover:text-[#231815] hover:bg-[#FAF7F2]/60 rounded-xl transition-all cursor-pointer"
            >
              Features
            </button>
          )}

          <button
            onClick={onNavigateDashboard}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              currentPage === 'dashboard'
                ? 'bg-[#FAF7F2] text-[#722f37] shadow-2xs font-bold border border-[#b7a89a]/40'
                : 'text-[#574943] hover:text-[#231815] hover:bg-[#FAF7F2]/60'
            }`}
          >
            <LayoutDashboard className={`h-3.5 w-3.5 ${currentPage === 'dashboard' ? 'text-[#722f37]' : 'text-[#b7a89a]'}`} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={onNavigateProgress}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              currentPage === 'progress'
                ? 'bg-[#FAF7F2] text-[#722f37] shadow-2xs font-bold border border-[#b7a89a]/40'
                : 'text-[#574943] hover:text-[#231815] hover:bg-[#FAF7F2]/60'
            }`}
          >
            <ListTodo className={`h-3.5 w-3.5 ${currentPage === 'progress' ? 'text-[#722f37]' : 'text-[#b7a89a]'}`} />
            <span>Progress</span>
          </button>

          <button
            onClick={onNavigateAnalyze}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              currentPage === 'analyze'
                ? 'bg-[#FAF7F2] text-[#722f37] shadow-2xs font-bold border border-[#b7a89a]/40'
                : 'text-[#574943] hover:text-[#231815] hover:bg-[#FAF7F2]/60'
            }`}
          >
            <FileText className={`h-3.5 w-3.5 ${currentPage === 'analyze' ? 'text-[#722f37]' : 'text-[#b7a89a]'}`} />
            <span>Analyze Resume</span>
          </button>
        </nav>

        {/* Desktop User Account & Auth */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-[#b7a89a]/60 bg-[#FAF7F2] px-3.5 py-1.5 text-xs font-semibold text-[#231815] hover:bg-[#e8dcc6]/40 transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#722f37] text-[#FAF7F2] text-[11px] font-bold">
                  {currentUser.fullName.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[130px] truncate font-medium">{currentUser.fullName}</span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-[#e8dcc6]">
                    <p className="text-xs font-bold text-[#231815]">{currentUser.fullName}</p>
                    <p className="text-[11px] text-[#574943] truncate">{currentUser.email}</p>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#b7a89a]/60 bg-[#FAF7F2] px-3.5 py-1.5 text-xs font-semibold text-[#574943] shadow-2xs hover:bg-[#e8dcc6]/40 hover:text-[#231815] transition-all active:scale-95 cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5 text-[#722f37]" />
                <span>Sign In</span>
              </button>
              <button
                onClick={onOpenSignup}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#722f37] px-4 py-1.5 text-xs font-bold text-[#FAF7F2] shadow-xs transition-all active:scale-95 cursor-pointer hover:bg-[#551b22]"
              >
                <UserPlus className="h-3.5 w-3.5 text-[#e8dcc6]" />
                <span>Get Started Free</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-[#231815] hover:bg-[#e8dcc6]/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#722f37]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-[#b7a89a]/40 bg-[#FAF7F2] px-4 pt-3 pb-6 md:hidden shadow-lg animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
          {currentUser ? (
            <div className="rounded-xl border border-[#b7a89a]/40 bg-[#e8dcc6]/30 p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#231815]">{currentUser.fullName}</p>
                <p className="text-[11px] text-[#574943] truncate max-w-[200px]">{currentUser.email}</p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-[#FAF7F2] border border-[#b7a89a]/50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-1 pb-2 border-b border-[#e8dcc6]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#722f37] py-2.5 text-xs font-semibold text-[#FAF7F2] hover:bg-[#551b22] shadow-sm"
              >
                <LogIn className="h-4 w-4 text-[#e8dcc6]" />
                <span>Sign In / Sign Up</span>
              </button>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleNavClick(onNavigateHome)}
              className={`flex items-center px-3 py-2 text-base font-medium rounded-md text-left ${
                currentPage === 'home'
                  ? 'bg-[#e8dcc6]/60 text-[#722f37] font-semibold'
                  : 'text-[#231815] hover:bg-[#e8dcc6]/40 hover:text-[#722f37]'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                handleNavClick(onNavigateHome);
                setTimeout(() => {
                  const el = document.getElementById('features');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="flex items-center px-3 py-2 text-base font-medium text-[#231815] hover:bg-[#e8dcc6]/40 hover:text-[#722f37] rounded-md text-left"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick(onNavigateDashboard)}
              className={`flex items-center gap-2 px-3 py-2 text-base font-medium rounded-md text-left ${
                currentPage === 'dashboard'
                  ? 'bg-[#e8dcc6]/60 text-[#722f37] font-semibold'
                  : 'text-[#231815] hover:bg-[#e8dcc6]/40 hover:text-[#722f37]'
              }`}
            >
              <LayoutDashboard className="h-5 w-5 text-[#722f37]" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => handleNavClick(onNavigateProgress)}
              className={`flex items-center gap-2 px-3 py-2 text-base font-medium rounded-md text-left ${
                currentPage === 'progress'
                  ? 'bg-[#e8dcc6]/60 text-[#722f37] font-semibold'
                  : 'text-[#231815] hover:bg-[#e8dcc6]/40 hover:text-[#722f37]'
              }`}
            >
              <ListTodo className="h-5 w-5 text-[#722f37]" />
              <span>Skill Progress</span>
            </button>
            <button
              onClick={() => handleNavClick(onNavigateAnalyze)}
              className={`flex items-center gap-2 px-3 py-2 text-base font-medium rounded-md text-left ${
                currentPage === 'analyze'
                  ? 'bg-[#e8dcc6]/60 text-[#722f37] font-semibold'
                  : 'text-[#231815] hover:bg-[#e8dcc6]/40 hover:text-[#722f37]'
              }`}
            >
              <FileText className="h-5 w-5 text-[#722f37]" />
              <span>Analyze Resume</span>
            </button>

            <div className="pt-2">
              <button
                onClick={() => handleNavClick(onNavigateAnalyze)}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#722f37] px-4 py-2.5 text-base font-semibold text-[#FAF7F2] shadow hover:bg-[#551b22]"
              >
                <span>Analyze My Resume</span>
                <ArrowRight className="h-4 w-4 text-[#e8dcc6]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
