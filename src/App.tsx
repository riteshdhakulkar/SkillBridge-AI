import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { DashboardPage } from './components/DashboardPage';
import { ResumeAnalysisPage } from './components/ResumeAnalysisPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard' | 'analyze'>('home');
  const [targetRoleContext, setTargetRoleContext] = useState<string | undefined>(undefined);
  const [dashboardRefreshToken, setDashboardRefreshToken] = useState<number>(0);

  const handleNavigateHome = () => {
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateDashboard = () => {
    setCurrentPage('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateAnalyze = (role?: string) => {
    setTargetRoleContext(role);
    setCurrentPage('analyze');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalysisSaved = (_savedId?: number) => {
    setDashboardRefreshToken((prev) => prev + 1);
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

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 flex flex-col font-sans antialiased">
      {/* Top Navigation Bar */}
      <Navbar
        currentPage={currentPage}
        onNavigateHome={handleNavigateHome}
        onNavigateDashboard={handleNavigateDashboard}
        onNavigateAnalyze={() => handleNavigateAnalyze()}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <>
            {/* Landing Page Hero Section */}
            <Hero
              onAnalyzeClick={() => handleNavigateAnalyze()}
              onExploreClick={handleExploreFeatures}
            />

            {/* Feature Cards Section */}
            <Features onSelectFeature={() => handleNavigateAnalyze()} />
          </>
        )}

        {currentPage === 'dashboard' && (
          /* Dedicated Student Career Dashboard Page */
          <DashboardPage
            onOpenAnalyze={(role) => handleNavigateAnalyze(role)}
            onNavigateHome={handleNavigateHome}
            refreshToken={dashboardRefreshToken}
          />
        )}

        {currentPage === 'analyze' && (
          /* Dedicated Resume Analysis Page */
          <ResumeAnalysisPage
            onNavigateDashboard={handleNavigateDashboard}
            onNavigateHome={handleNavigateHome}
            initialRole={targetRoleContext}
            onAnalysisSaved={handleAnalysisSaved}
          />
        )}
      </main>

      {/* Reusable Simple Footer */}
      <Footer
        onNavigateAnalyze={() => handleNavigateAnalyze()}
        onNavigateDashboard={handleNavigateDashboard}
        onNavigateHome={handleNavigateHome}
      />
    </div>
  );
}
