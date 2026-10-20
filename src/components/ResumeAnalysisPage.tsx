import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  X,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ClipboardList,
  RotateCcw,
  Calendar,
  Building2,
  Compass,
  MessageSquare,
  BookOpen,
  Award,
  ChevronDown,
  Layers,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { GeminiAnalysisResult, AnalysisResponseMeta } from '../types/analysis';

interface ResumeAnalysisPageProps {
  onNavigateDashboard: () => void;
  onNavigateHome: () => void;
  initialRole?: string;
}

export const ResumeAnalysisPage: React.FC<ResumeAnalysisPageProps> = ({
  onNavigateDashboard,
  onNavigateHome,
}) => {
  // Input mode: 'upload' (PDF) or 'paste' (text)
  const [resumeMode, setResumeMode] = useState<'upload' | 'paste'>('upload');

  // File state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text resume state
  const [pastedResume, setPastedResume] = useState('');

  // Job description state
  const [jobDescription, setJobDescription] = useState('');
  const [jobError, setJobError] = useState<string | null>(null);

  // Loading & Submission state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Extracting resume text...');
  const [apiError, setApiError] = useState<string | null>(null);

  // Actual Gemini Analysis Results
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResult | null>(null);
  const [analysisMeta, setAnalysisMeta] = useState<AnalysisResponseMeta | null>(null);

  // Active result tab
  const [activeResultTab, setActiveResultTab] = useState<'overview' | 'skills' | 'roadmap' | 'interview'>('overview');

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Convert File to Base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Handle document file selection (PDF or Word .docx/.doc)
  const handleFileProcess = async (file: File) => {
    setFileError(null);
    setApiError(null);

    const fileNameLower = file.name.toLowerCase();
    const isSupported =
      file.type === 'application/pdf' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword' ||
      fileNameLower.endsWith('.pdf') ||
      fileNameLower.endsWith('.docx') ||
      fileNameLower.endsWith('.doc');

    if (!isSupported) {
      setFileError('Invalid file format. Please upload a PDF (.pdf) or Word document (.docx, .doc).');
      setUploadedFile(null);
      setFileBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError('File exceeds 10MB size limit. Please upload a smaller file.');
      setUploadedFile(null);
      setFileBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const base64 = await readFileAsBase64(file);
      setUploadedFile(file);
      setFileBase64(base64);
    } catch (err) {
      setFileError('Could not read the selected file. Please try again.');
      setUploadedFile(null);
      setFileBase64(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileBase64(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Populate sample job description
  const handleUseSampleJob = () => {
    setJobError(null);
    setJobDescription(
`Role: Junior Full-Stack Developer
Company: CloudScale Solutions
Location: Remote (US / Canada)

About the Role:
We are looking for an ambitious Junior Full-Stack Developer to join our core product team. You will build user-facing features using modern web technologies and collaborate with senior engineers on scalable services.

Responsibilities:
- Build and maintain responsive web interfaces using React, TypeScript, and modern CSS frameworks.
- Implement RESTful APIs with Node.js and Express to support frontend features.
- Write clean, maintainable, and well-tested code following agile best practices.
- Collaborate with product designers and engineers in daily standups and sprint planning.

Requirements:
- Bachelor's degree in Computer Science, Software Engineering, or equivalent practical experience / bootcamp.
- Demonstrated hands-on experience with TypeScript, React, and component architecture.
- Understanding of backend development with Node.js and SQL/relational databases.
- Familiarity with version control using Git and collaborative pull request workflows.
- Basic familiarity with Docker, CI/CD, or automated unit testing is a plus.`
    );
  };

  // Populate sample resume text
  const handleUseSampleResume = () => {
    setResumeMode('paste');
    setPastedResume(
`ALEX CHEN
Computer Science B.S., Expected Graduation May 2026
Email: alex.chen@university.edu | GitHub: github.com/alexchen-dev

TECHNICAL SKILLS:
- Languages: TypeScript, JavaScript (ES6+), Python, HTML5, CSS3, SQL
- Frameworks & Libraries: React, Node.js, Express, Tailwind CSS, Vite
- Tools & Practices: Git, GitHub, REST APIs, Agile Methodology, Linux

PROJECTS:
1. Campus Marketplace Web App (React, TypeScript, Node.js, PostgreSQL)
- Developed a full-stack campus exchange portal serving 1,200+ active student users.
- Designed RESTful API endpoints for user authentication, product listings, and instant messaging.
- Implemented responsive UI with Tailwind CSS achieving 95+ score on Google Lighthouse.

2. Algorithmic Pathfinding Visualizer (React, TypeScript)
- Built interactive graph visualization demonstrating Dijkstra's, A*, and BFS pathfinding algorithms.
- Optimized canvas rendering performance to maintain smooth 60fps animations.

EXPERIENCE:
Computer Science Peer Tutor (Sep 2024 - Present)
- Facilitated weekly lab sessions for 45+ students covering data structures and object-oriented programming.`
    );
  };

  // Validation rules
  const hasResumeInput =
    resumeMode === 'upload' ? !!uploadedFile && !!fileBase64 : pastedResume.trim().length >= 20;
  const hasJobInput = jobDescription.trim().length >= 20;
  const isFormValid = hasResumeInput && hasJobInput;

  // Real Gemini Analysis Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!hasResumeInput) {
      setFileError(
        resumeMode === 'upload'
          ? 'Please upload your resume (PDF or Word document) to proceed.'
          : 'Please paste your resume text to proceed.'
      );
      return;
    }

    if (!hasJobInput) {
      setJobError('Please paste a job description to compare against.');
      return;
    }

    setIsAnalyzing(true);
    setLoadingStep(resumeMode === 'upload' ? 'Extracting text from resume document...' : 'Parsing resume text...');

    try {
      // Step timer for informative UX
      const stepTimer1 = setTimeout(() => {
        setLoadingStep('Evaluating competencies and job requirements with Gemini...');
      }, 1200);

      const stepTimer2 = setTimeout(() => {
        setLoadingStep('Synthesizing match score, gap analysis, and learning roadmap...');
      }, 3000);

      const payload = {
        resumeFileBase64: resumeMode === 'upload' ? fileBase64 : null,
        resumeFileName: resumeMode === 'upload' ? uploadedFile?.name : null,
        resumePdfBase64: resumeMode === 'upload' ? fileBase64 : null,
        resumePdfName: resumeMode === 'upload' ? uploadedFile?.name : null,
        resumeText: resumeMode === 'paste' ? pastedResume : null,
        jobDescription: jobDescription.trim(),
      };

      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      // Valid analysis data received
      setAnalysisResult(data.data);
      setAnalysisMeta(data.meta);
      setIsAnalyzing(false);

      // Scroll to top of results smoothly
      window.scrollTo({ top: 150, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Analysis error:', err);
      setIsAnalyzing(false);
      setApiError(err.message || 'Failed to complete resume analysis. Please check your connection and try again.');
    }
  };

  const handleResetForm = () => {
    setUploadedFile(null);
    setFileBase64(null);
    setPastedResume('');
    setJobDescription('');
    setFileError(null);
    setJobError(null);
    setApiError(null);
    setAnalysisResult(null);
    setAnalysisMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Score color helper
  const getScoreTheme = (score: number) => {
    if (score >= 80) {
      return {
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badge: 'Strong Qualification Match',
      };
    }
    if (score >= 60) {
      return {
        text: 'text-indigo-700',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        badge: 'Moderate Match · High Potential',
      };
    }
    return {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      badge: 'Developing Alignment · Skill Gaps Found',
    };
  };

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* 1. Page Header */}
      <section className="border-b border-slate-200/80 bg-slate-50/50 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/70 px-3.5 py-1 text-xs font-semibold text-indigo-700 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>AI Career Match Analysis</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Analyze Your Career Fit
          </h1>
          <p className="mt-2.5 text-base text-slate-600 max-w-2xl mx-auto">
            Discover how your skills align with your dream role.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* API Error Notification */}
        {apiError && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50/90 p-5 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-start gap-3.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-bold text-red-900">
                  Analysis Request Failed
                </h3>
                <p className="text-xs text-red-700 leading-relaxed">
                  {apiError}
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setApiError(null)}
                    className="text-xs font-semibold text-red-800 hover:text-red-950 underline underline-offset-2 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay State */}
        {isAnalyzing && (
          <div className="my-10 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-10 text-center shadow-xs animate-in fade-in duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-indigo-100">
              <div className="h-7 w-7 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-900">
              Running Gemini AI Evaluation...
            </h3>
            <p className="mt-2 text-xs font-medium text-indigo-700 animate-pulse">
              {loadingStep}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 max-w-md mx-auto">
              Scanning technical requirements, extracting substantiated claims, and formulating your personalized roadmap.
            </p>
          </div>
        )}

        {/* 7. Actual Analysis Results View (Rendered when Gemini evaluation completes) */}
        {analysisResult && !isAnalyzing ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Top Score & Summary Banner */}
            {(() => {
              const theme = getScoreTheme(analysisResult.matchScore);
              return (
                <div className={`rounded-2xl border ${theme.border} ${theme.bg} p-6 sm:p-8 shadow-xs`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                          AI Evaluation Complete
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-600">
                          {analysisMeta?.resumeSource || 'Resume Evaluated'}
                        </span>
                      </div>
                      <h2 className="text-2xl font-black text-slate-900">
                        {theme.badge}
                      </h2>
                      <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                        Evaluated against {analysisResult.matchedSkills.length + analysisResult.missingSkills.length} core job competencies with Gemini 3.8 Flash.
                      </p>
                    </div>

                    {/* Prominent Score Gauge */}
                    <div className="flex items-center gap-3 self-start sm:self-auto rounded-2xl bg-white px-6 py-4 shadow-xs border border-slate-200/80">
                      <div className="text-center">
                        <div className={`text-4xl font-black tracking-tight ${theme.text} tabular-nums`}>
                          {analysisResult.matchScore}%
                        </div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                          Job Match Score
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Tabs for Results */}
                  <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveResultTab('overview')}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        activeResultTab === 'overview'
                          ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      Overview & Evidence
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveResultTab('skills')}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        activeResultTab === 'skills'
                          ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      Skills & Gaps ({analysisResult.matchedSkills.length} matched / {analysisResult.missingSkills.length} gaps)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveResultTab('roadmap')}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        activeResultTab === 'roadmap'
                          ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      Learning Roadmap ({analysisResult.learningRoadmap.length} Milestones)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveResultTab('interview')}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        activeResultTab === 'interview'
                          ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      Interview Prep ({analysisResult.interviewQuestions.length} Questions)
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Tab 1: Overview & Evidence */}
            {activeResultTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Strategic Recommendations */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      High-Impact Recommendations
                    </h3>
                  </div>
                  <ul className="space-y-2.5">
                    {analysisResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Verified Resume Evidence */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Extracted Resume Evidence
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Concrete achievements and experience verified from your submitted resume:
                  </p>
                  <div className="space-y-3">
                    {analysisResult.resumeEvidence.map((item, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{item.claim}</span>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                            {item.alignment}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          <strong>Evidence:</strong> {item.evidence}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Skills & Gaps */}
            {activeResultTab === 'skills' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
                {/* Matched Skills */}
                <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <h3 className="text-sm font-bold">
                        Demonstrated Skills ({analysisResult.matchedSkills.length})
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Matched
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {analysisResult.matchedSkills.map((item, idx) => (
                      <div key={idx} className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{item.skill}</span>
                          <span className="text-[10px] uppercase font-semibold text-emerald-700">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {item.context}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertCircle className="h-4 w-4" />
                      <h3 className="text-sm font-bold">
                        Skills to Improve ({analysisResult.missingSkills.length})
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      Gaps
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {analysisResult.missingSkills.map((item, idx) => (
                      <div key={idx} className="rounded-xl border border-amber-100 bg-amber-50/30 p-3 space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{item.skill}</span>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            item.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.priority} Priority
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {item.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Learning Roadmap */}
            {activeResultTab === 'roadmap' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6 animate-in fade-in duration-150">
                <div>
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Curated Skill Bridge Roadmap
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Actionable milestones designed to close your identified skill gaps before interview rounds:
                  </p>
                </div>

                <div className="space-y-4">
                  {analysisResult.learningRoadmap.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-[11px] font-bold">
                            {idx + 1}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {item.milestone}
                          </h4>
                        </div>
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                          {item.timeframe}
                        </span>
                      </div>

                      <div className="space-y-1.5 pl-8">
                        <p className="font-semibold text-slate-700">Action Items:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-600">
                          {item.actionItems.map((action, actionIdx) => (
                            <li key={actionIdx}>{action}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="pl-8 pt-2 text-[11px] text-slate-500 border-t border-slate-200/60 flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span><strong>Recommended Resource:</strong> {item.resourceSuggestion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Interview Prep */}
            {activeResultTab === 'interview' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6 animate-in fade-in duration-150">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Grounded Interview Questions
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Practice questions generated specifically around your project evidence and target role requirements:
                  </p>
                </div>

                <div className="space-y-4">
                  {analysisResult.interviewQuestions.map((q, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                          {q.topic}
                        </span>
                        <span className="text-[11px] text-slate-400">Question {idx + 1}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900">
                        "{q.question}"
                      </p>
                      <div className="rounded-lg bg-white p-3 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                        <p className="font-semibold text-slate-700">Expected Focus & Talking Points:</p>
                        <p>{q.expectedFocus}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleResetForm}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Analyze Another Resume</span>
              </button>

              <button
                type="button"
                onClick={onNavigateDashboard}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <span>View Dashboard Progress</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Form Input Section (Rendered when no analysis active) */
          !isAnalyzing && (
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Resume Upload & Paste Section */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        1. Resume Input
                      </h2>
                      <p className="text-xs text-slate-500">
                        Upload a PDF, Word doc (.docx), or paste plain text (required)
                      </p>
                    </div>

                    {/* Input Mode Selector */}
                    <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          setResumeMode('upload');
                          setFileError(null);
                        }}
                        className={`rounded-md px-3 py-1.5 transition-all cursor-pointer ${
                          resumeMode === 'upload'
                            ? 'bg-white text-slate-900 shadow-xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResumeMode('paste');
                          setFileError(null);
                        }}
                        className={`rounded-md px-3 py-1.5 transition-all cursor-pointer ${
                          resumeMode === 'paste'
                            ? 'bg-white text-slate-900 shadow-xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Paste Text
                      </button>
                    </div>
                  </div>

                  {/* Mode A: Drag & Drop Document */}
                  {resumeMode === 'upload' ? (
                    <div className="space-y-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Upload Resume (PDF or Word .docx)
                      </label>

                      {!uploadedFile ? (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 sm:p-10 text-center transition-all cursor-pointer ${
                            isDragging
                              ? 'border-indigo-600 bg-indigo-50/60 scale-[1.01]'
                              : fileError
                              ? 'border-red-300 bg-red-50/20'
                              : 'border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/20'
                          }`}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                            onChange={handleFileInputChange}
                            className="hidden"
                            id="resume-file-input"
                          />

                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200/80 text-indigo-600 mb-3">
                            <UploadCloud className="h-7 w-7" />
                          </div>

                          <p className="text-sm font-bold text-slate-900">
                            Drop your resume PDF or Word document (.docx) here, or{' '}
                            <span className="text-indigo-600 underline underline-offset-2">browse</span>
                          </p>
                          <p className="mt-1.5 text-xs text-slate-500">
                            PDF, DOCX, and DOC files (maximum 10MB)
                          </p>
                        </div>
                      ) : (
                        /* Uploaded File Presentation Card */
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">
                                  {uploadedFile.name}
                                </p>
                                <p className="text-xs text-slate-500 tabular-nums">
                                  {formatFileSize(uploadedFile.size)} · {uploadedFile.name.toLowerCase().endsWith('.docx') || uploadedFile.name.toLowerCase().endsWith('.doc') ? 'Word Document' : 'PDF Document'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded px-2 py-0.5">
                                <CheckCircle2 className="h-3 w-3" />
                                {uploadedFile.name.toLowerCase().endsWith('.docx') || uploadedFile.name.toLowerCase().endsWith('.doc') ? 'Word Ready' : 'PDF Ready'}
                              </span>
                              <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600 hover:shadow-xs transition-colors cursor-pointer"
                                title="Remove uploaded file"
                                aria-label="Remove uploaded file"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* File Error Message */}
                      {fileError && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/70 p-3 text-xs text-red-700 animate-in fade-in duration-150">
                          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                          <span>{fileError}</span>
                        </div>
                      )}

                      {/* Quick Helper */}
                      <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                        <span>Don't have a PDF ready?</span>
                        <button
                          type="button"
                          onClick={handleUseSampleResume}
                          className="font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2 cursor-pointer"
                        >
                          Use Sample Student Resume
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Mode B: Paste Resume Text */
                    <div className="space-y-3">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Paste Resume Text
                      </label>

                      <div className="relative">
                        <textarea
                          rows={9}
                          value={pastedResume}
                          onChange={(e) => {
                            setPastedResume(e.target.value);
                            setFileError(null);
                          }}
                          placeholder={`Paste your full resume text here...\n\nExample:\nAlex Chen\nComputer Science Graduate\nTechnical Skills: TypeScript, React, Python, REST APIs, Git\nProjects: Full-stack Campus Marketplace portal...`}
                          className="w-full rounded-xl border border-slate-300 p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-sans leading-relaxed"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="tabular-nums">
                          {pastedResume.trim().length} characters
                        </span>
                        <button
                          type="button"
                          onClick={handleUseSampleResume}
                          className="font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2 cursor-pointer"
                        >
                          Insert Sample Resume Text
                        </button>
                      </div>

                      {fileError && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/70 p-3 text-xs text-red-700">
                          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                          <span>{fileError}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Job Description Section */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        2. Target Job Description
                      </h2>
                      <p className="text-xs text-slate-500">
                        Provide the job requirements to match against (required)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleUseSampleJob}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-colors cursor-pointer"
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      <span>Insert Sample Job</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Paste Job Description
                    </label>

                    <div className="relative">
                      <textarea
                        rows={9}
                        value={jobDescription}
                        onChange={(e) => {
                          setJobDescription(e.target.value);
                          setJobError(null);
                        }}
                        placeholder={`Paste Job Description here...\n\ne.g., We are seeking a Junior Software Engineer with a solid foundation in React, TypeScript, and REST APIs. Responsibilities include building responsive UI, collaborating with product managers, and deploying services...`}
                        className={`w-full rounded-xl border p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 leading-relaxed ${
                          jobError
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="tabular-nums">
                        {jobDescription.trim().length} characters
                      </span>
                      {jobDescription.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={() => setJobDescription('')}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Job Error Message */}
                    {jobError && (
                      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/70 p-3 text-xs text-red-700 animate-in fade-in duration-150">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                        <span>{jobError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar & Prominent Button */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-sm font-bold text-slate-900">
                    Ready to Evaluate Fit with Gemini?
                  </h3>
                  <p className="text-xs text-slate-500">
                    {!hasResumeInput && !hasJobInput
                      ? 'Please provide your resume and target job description above.'
                      : !hasResumeInput
                      ? 'Please provide your resume (PDF upload or pasted text).'
                      : !hasJobInput
                      ? 'Please paste a target job description.'
                      : 'All inputs validated. Click below to initiate asynchronous AI evaluation.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    disabled={!uploadedFile && !pastedResume && !jobDescription}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!isFormValid || isAnalyzing}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Analyze My Match</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>
          )
        )}

        {/* Privacy Notice Box */}
        <div className="mt-10 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900">
                Privacy Notice
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">
                Uploaded resumes may contain personal information such as contact details, addresses, and employment history. In this application, all requests are securely proxied through your server to the Gemini API without public data sharing or persistent third-party storage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
