import React, { useState } from 'react';
import { Sparkles, Menu, X, FileText, LayoutDashboard, ArrowRight, User as UserIcon, LogOut, LogIn, UserPlus } from 'lucide-react';
import { User } from '../types/analysis';

interface NavbarProps {
  currentPage: 'home' | 'dashboard' | 'analyze';
  currentUser: User | null;
  onNavigateHome: () => void;
  onNavigateDashboard: () => void;
  onNavigateAnalyze: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  currentUser,
  onNavigateHome,
  onNavigateDashboard,
  onNavigateAnalyze,
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <button
          onClick={onNavigateHome}
          className="group flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1 cursor-pointer"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              SkillBridge
            </span>
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
              AI
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={onNavigateHome}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'home'
                ? 'text-indigo-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Home
          </button>

          {currentPage === 'home' ? (
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
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
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Features
            </button>
          )}

          <button
            onClick={onNavigateDashboard}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'dashboard'
                ? 'text-indigo-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className={`h-4 w-4 ${currentPage === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={onNavigateAnalyze}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'analyze'
                ? 'text-indigo-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className={`h-4 w-4 ${currentPage === 'analyze' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Analyze Resume</span>
          </button>
        </nav>

        {/* Desktop CTA & Auth */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-[11px] font-bold">
                  {currentUser.fullName.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">{currentUser.fullName}</span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{currentUser.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow active:scale-[0.98] cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In / Sign Up</span>
              </button>
            </div>
          )}

          <button
            onClick={onNavigateAnalyze}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-indigo-700 hover:shadow active:scale-[0.98] cursor-pointer"
          >
            <span>Analyze Resume</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
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
        <div className="border-b border-slate-200 bg-white px-4 pt-3 pb-6 md:hidden shadow-lg animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
          {currentUser ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">{currentUser.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{currentUser.email}</p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-1 pb-2 border-b border-slate-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In / Sign Up</span>
              </button>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleNavClick(onNavigateHome)}
              className={`flex items-center px-3 py-2 text-base font-medium rounded-md text-left ${
                currentPage === 'home'
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
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
              className="flex items-center px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-md text-left"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick(onNavigateDashboard)}
              className={`flex items-center gap-2 px-3 py-2 text-base font-medium rounded-md text-left ${
                currentPage === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <LayoutDashboard className="h-5 w-5 text-indigo-600" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => handleNavClick(onNavigateAnalyze)}
              className={`flex items-center gap-2 px-3 py-2 text-base font-medium rounded-md text-left ${
                currentPage === 'analyze'
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <FileText className="h-5 w-5 text-indigo-600" />
              <span>Analyze Resume</span>
            </button>
            <div className="pt-2">
              <button
                onClick={() => handleNavClick(onNavigateAnalyze)}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-base font-semibold text-white shadow hover:bg-indigo-700"
              >
                <span>Analyze My Resume</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
