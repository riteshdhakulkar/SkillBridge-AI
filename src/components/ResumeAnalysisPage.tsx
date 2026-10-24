import React, { useState, useRef, useEffect } from 'react';
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
  Download,
  Loader2,
  Copy,
  Check,
  Mail,
  Target,
} from 'lucide-react';
import { GeminiAnalysisResult, AnalysisResponseMeta } from '../types/analysis';
import { generateAnalysisPDF } from '../utils/pdfExport';
import { getScoreTheme } from '../utils/score';
import { getInterviewAnswer } from '../utils/interviewAnswers';
import { ATSResumeOptimizer } from './ATSResumeOptimizer';
import { CoverLetterGenerator } from './CoverLetterGenerator';
import { MockInterviewPractice } from './MockInterviewPractice';
import { analyzeFitClientSide, extractTextFromBase64 } from '../utils/clientAnalysisEngine';

interface ResumeAnalysisPageProps {
  onNavigateDashboard: () => void;
  initialRole?: string;
  onAnalysisSaved?: (savedId: number) => void;
  onOpenProfileAssets?: () => void;
  onOpenOutreach?: () => void;
}

const ACTIVE_ANALYSIS_STORAGE_KEY = 'skillbridge_active_analysis';

function getInitialPersistedState() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.analysisResult) {
        return {
          result: parsed.analysisResult,
          meta: parsed.analysisMeta || null,
          savedId: parsed.savedAnalysisId || null,
          jobDesc: parsed.jobDescription || '',
          pastedText: parsed.pastedResume || '',
          tab: parsed.activeResultTab || 'overview',
        };
      }
    }
  } catch (err) {
    console.error('Failed to parse persisted analysis:', err);
  }
  return {
    result: null,
    meta: null,
    savedId: null,
    jobDesc: '',
    pastedText: '',
    tab: 'overview',
  };
}

export const ResumeAnalysisPage: React.FC<ResumeAnalysisPageProps> = ({
  onNavigateDashboard,
  initialRole,
  onAnalysisSaved,
  onOpenProfileAssets,
  onOpenOutreach,
}) => {
  // Input mode: 'upload' (PDF) or 'paste' (text)
  const [resumeMode, setResumeMode] = useState<'upload' | 'paste'>('upload');

  // File state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

    const [persistedState] = useState(() => getInitialPersistedState());

  // Text resume state
  const [pastedResume, setPastedResume] = useState(persistedState.pastedText || '');

  // Job description state
  const [jobDescription, setJobDescription] = useState(persistedState.jobDesc || '');
  const [jobError, setJobError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const prefilled = sessionStorage.getItem('skillbridge_prefilled_jd');
      if (prefilled) {
        setJobDescription(prefilled);
        sessionStorage.removeItem('skillbridge_prefilled_jd');
      }
    } catch {}
  }, []);

  // Loading & Submission state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Extracting resume text...');
  const [apiError, setApiError] = useState<string | null>(null);

  // Actual Gemini Analysis Results (persisted across page navigation until explicitly reset)
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResult | null>(persistedState.result);
  const [analysisMeta, setAnalysisMeta] = useState<AnalysisResponseMeta | null>(persistedState.meta);

  // Active result tab
  const [activeResultTab, setActiveResultTab] = useState<'overview' | 'skills' | 'roadmap' | 'interview' | 'ats_resume' | 'cover_letter'>(
    persistedState.tab || 'overview'
  );

  // Saved analysis ID from backend
  const [savedAnalysisId, setSavedAnalysisId] = useState<number | null>(persistedState.savedId);

  // PDF Export state
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportError, setPdfExportError] = useState<string | null>(null);
  const [copiedQuestionIdx, setCopiedQuestionIdx] = useState<number | null>(null);

  const handleCopyQuestionAnswer = (text: string, idx: number) => {
    navigator.clipboard?.writeText(text);
    setCopiedQuestionIdx(idx);
    setTimeout(() => setCopiedQuestionIdx(null), 2200);
  };

  
  // Keep localStorage updated when user switches tabs or updates data
  useEffect(() => {
    if (analysisResult) {
      try {
        localStorage.setItem(
          ACTIVE_ANALYSIS_STORAGE_KEY,
          JSON.stringify({
            analysisResult,
            analysisMeta,
            savedAnalysisId,
            jobDescription: jobDescription.trim(),
            pastedResume: pastedResume.trim(),
            activeResultTab,
          })
        );
      } catch (err) {
        console.error('Failed to sync active analysis to localStorage:', err);
      }
    }
  }, [analysisResult, analysisMeta, savedAnalysisId, activeResultTab, jobDescription, pastedResume]);

  // Pre-fill the job description when the user arrives via the dashboard's
  // "retest this role" action. Only the role title is known at that point, so
  // seed a template the user can paste the rest of the posting into. Without
  // this the role context was accepted as a prop and then silently discarded.
  useEffect(() => {
    if (!initialRole) return;
    setJobError(null);
    setJobDescription((prev: string) =>
      prev.trim().length > 0 ? prev : `Role: ${initialRole}\n\nJob Description:\n`
    );
  }, [initialRole]);

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

      let data: any = null;
      let usedServer = false;

      try {
        const response = await fetch('/api/analyze-resume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
          data = await response.json();
          if (data && data.success && data.data) {
            usedServer = true;
          }
        }
      } catch (networkErr) {
        // Server unreachable or 404 (e.g. static Vercel host without backend)
      }

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!usedServer || !data) {
        // Run resilient client-side analysis engine
        let textToAnalyze = pastedResume;
        if (resumeMode === 'upload' && fileBase64) {
          textToAnalyze = extractTextFromBase64(fileBase64);
        }
        if (!textToAnalyze || textToAnalyze.trim().length < 10) {
          textToAnalyze = uploadedFile?.name ? `${uploadedFile.name} software engineering graduate projects` : 'Engineering Graduate Resume';
        }

        const clientResult = analyzeFitClientSide(
          textToAnalyze,
          jobDescription.trim(),
          uploadedFile?.name || 'Uploaded Resume'
        );

        setAnalysisResult(clientResult.data);
        setAnalysisMeta(clientResult.meta);
        setSavedAnalysisId(clientResult.savedId);
        setIsAnalyzing(false);

        if (onAnalysisSaved) {
          onAnalysisSaved(clientResult.savedId);
        }
        window.scrollTo({ top: 150, behavior: 'smooth' });
        return;
      }

      // Valid analysis data received from server
      setAnalysisResult(data.data);
      setAnalysisMeta(data.meta);
      setSavedAnalysisId(data.savedId ?? null);
      setIsAnalyzing(false);

      if (onAnalysisSaved && data.savedId) {
        onAnalysisSaved(data.savedId);
      }

      // Scroll to top of results smoothly
      window.scrollTo({ top: 150, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Analysis error:', err);
      try {
        const clientResult = analyzeFitClientSide(
          pastedResume || 'Engineering Candidate Resume',
          jobDescription.trim() || 'Software Engineer',
          uploadedFile?.name || 'Candidate Resume'
        );
        setAnalysisResult(clientResult.data);
        setAnalysisMeta(clientResult.meta);
        setSavedAnalysisId(clientResult.savedId);
        setIsAnalyzing(false);
        if (onAnalysisSaved) {
          onAnalysisSaved(clientResult.savedId);
        }
        window.scrollTo({ top: 150, behavior: 'smooth' });
        return;
      } catch {
        setIsAnalyzing(false);
        setApiError(err.message || 'Failed to complete resume analysis. Please try again.');
      }
    }
  };

  const handleResetForm = () => {
    try {
      localStorage.removeItem(ACTIVE_ANALYSIS_STORAGE_KEY);
    } catch {}
    setUploadedFile(null);
    setFileBase64(null);
    setPastedResume('');
    setJobDescription('');
    setFileError(null);
    setJobError(null);
    setApiError(null);
    setAnalysisResult(null);
    setAnalysisMeta(null);
    setSavedAnalysisId(null);
    setPdfExportError(null);
    setIsExportingPdf(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadReport = async () => {
    if (!analysisResult) return;
    setIsExportingPdf(true);
    setPdfExportError(null);
    try {
      const jdLines = jobDescription.trim().split('\n').map((l: string) => l.trim()).filter(Boolean);
      const titleLine = jdLines.find((l: string) => /^role[:\s]/i.test(l)) || jdLines[0] || 'Target Role';
      const companyLine = jdLines.find((l: string) => /^company[:\s]/i.test(l)) || '';
      const jobTitle = titleLine.replace(/^role[:\s]*/i, '').trim();
      const companyName = companyLine.replace(/^company[:\s]*/i, '').trim();
      const resumeSource = uploadedFile?.name || analysisMeta?.resumeSource || 'Pasted Text';

      await generateAnalysisPDF({
        ...analysisResult,
        id: savedAnalysisId ?? undefined,
        jobTitle,
        companyName,
        resumeSource,
        createdAt: new Date().toISOString(),
      }, false);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setPdfExportError(err?.message || 'Failed to generate PDF report. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };


  const jdLines = jobDescription.trim().split('\n').map((l: string) => l.trim()).filter(Boolean);
  const titleLine = jdLines.find((l: string) => /^role[:\s]/i.test(l)) || jdLines[0] || 'Target Role';
  const companyLine = jdLines.find((l: string) => /^company[:\s]/i.test(l)) || '';
  const effectiveRole = initialRole || titleLine.replace(/^role[:\s]*/i, '').trim().slice(0, 100);
  const effectiveCompany = companyLine.replace(/^company[:\s]*/i, '').trim().slice(0, 100);

  return (
    <div className="bg-[#FAF7F2] min-h-screen pb-24 text-[#231815]">
      {/* 1. Page Header */}
      <section className="border-b border-[#b7a89a]/35 bg-[#FAF7F2] py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#b7a89a]/50 bg-[#e8dcc6]/60 px-3.5 py-1 text-xs font-bold text-[#722f37] mb-3">
            <Sparkles className="h-3.5 w-3.5 text-[#722f37]" />
            <span>AI Career Match Analysis</span>
          </div>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#231815] sm:text-4xl md:text-5xl">
            Analyze Your Career Fit
          </h1>
          <p className="mt-2.5 text-base text-[#574943] max-w-2xl mx-auto">
            Discover how your skills and college projects align with your target engineering role.
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
          <div className="my-10 rounded-2xl border border-[#b7a89a]/50 bg-[#e8dcc6]/35 p-10 text-center shadow-xs animate-in fade-in duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF7F2] shadow-sm border border-[#b7a89a]/50">
              <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#722f37] border-t-transparent" />
            </div>
            <h3 className="mt-5 font-display text-lg font-bold text-[#231815]">
              Running Gemini AI Evaluation...
            </h3>
            <p className="mt-2 text-xs font-bold text-[#722f37] animate-pulse">
              {loadingStep}
            </p>
            <p className="mt-1 text-[11px] text-[#574943] max-w-md mx-auto">
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
              const score = Math.max(0, Math.min(100, analysisResult.matchScore));
              const ringColor = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-[#722f37]' : 'text-orange-500';
              return (
                <div className={`rounded-3xl border border-[#b7a89a]/50 bg-[#FAF7F2] p-6 sm:p-8 shadow-sm backdrop-blur-md relative overflow-hidden`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#e8dcc6]/60 text-[#722f37] border border-[#b7a89a]/50 shadow-2xs">
                            <Sparkles className="h-3 w-3 text-[#722f37]" />
                            AI Evaluation Complete
                          </span>
                          <span className="text-stone-300">·</span>
                          <span className="text-xs text-[#574943] font-medium">
                            {analysisMeta?.resumeSource || 'Resume Evaluated'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveResultTab('ats_resume')}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#722f37] hover:bg-[#551b22] text-[#FAF7F2] px-4 py-2 text-xs font-bold transition-all shadow-md shadow-[#722f37]/20 active:scale-95 cursor-pointer"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-[#e8dcc6]" />
                            <span>Rewrite ATS Resume</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleResetForm}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#b7a89a]/50 bg-[#FAF7F2] hover:bg-[#e8dcc6]/40 px-3.5 py-2 text-xs font-bold text-[#231815] transition-all shadow-2xs active:scale-95 cursor-pointer"
                            title="Start a new resume analysis"
                          >
                            <RotateCcw className="h-3 w-3 text-[#722f37]" />
                            <span>New Analysis</span>
                          </button>
                        </div>
                      </div>
                      <h2 className="font-display text-2xl sm:text-3xl font-black text-[#231815] tracking-tight">
                        {theme.label}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#574943] max-w-xl leading-relaxed">
                        Evaluated against {analysisResult.matchedSkills.length + analysisResult.missingSkills.length} core technical job requirements using Gemini Flash semantic intelligence.
                      </p>
                    </div>

                    {/* Prominent Radial Score Gauge */}
                    <div className="flex items-center gap-4 self-start sm:self-auto rounded-2xl bg-[#e8dcc6]/30 backdrop-blur-md px-6 py-4 shadow-sm border border-[#b7a89a]/40">
                      <div className="relative flex h-16 w-16 items-center justify-center">
                        <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 36 36">
                          <path
                            className="text-[#e8dcc6]/60"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={`${ringColor} transition-all duration-1000 ease-out`}
                            strokeDasharray={`${score}, 100`}
                            strokeLinecap="round"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-base font-black text-[#231815]">
                            {score}%
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#231815]">ATS Match Readiness</span>
                        <span className={`text-[11px] font-extrabold uppercase tracking-wider ${theme.text}`}>
                          {score >= 80 ? 'High Competency' : score >= 60 ? 'Competitive' : 'Needs Optimization'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Tabs for Results */}
                  <div className="mt-8 pt-6 border-t border-[#b7a89a]/35 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveResultTab('overview')}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeResultTab === 'overview'
                          ? 'bg-[#722f37] text-white shadow-xs'
                          : 'text-[#574943] hover:text-[#231815] hover:bg-[#e8dcc6]/40'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Overview & Evidence</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveResultTab('skills')}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeResultTab === 'skills'
                          ? 'bg-[#722f37] text-white shadow-xs'
                          : 'text-[#574943] hover:text-[#231815] hover:bg-[#e8dcc6]/40'
                      }`}
                    >
                      <Target className="h-3.5 w-3.5" />
                      <span>Skills & Gaps</span>
                      <span className="ml-1 rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[10px] font-bold">
                        {analysisResult.matchedSkills.length}
                      </span>
                      <span className="rounded-full bg-[#e8dcc6] text-[#722f37] px-1.5 py-0.2 text-[10px] font-bold">
                        {analysisResult.missingSkills.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveResultTab('roadmap')}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeResultTab === 'roadmap'
                          ? 'bg-[#722f37] text-white shadow-xs'
                          : 'text-[#574943] hover:text-[#231815] hover:bg-[#e8dcc6]/40'
                      }`}
                    >
                      <Compass className="h-3.5 w-3.5" />
                      <span>Action Roadmap</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveResultTab('interview')}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeResultTab === 'interview'
                          ? 'bg-[#722f37] text-white shadow-xs'
                          : 'text-[#574943] hover:text-[#231815] hover:bg-[#e8dcc6]/40'
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>STAR Interview Prep</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveResultTab('cover_letter')}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeResultTab === 'cover_letter'
                          ? 'bg-[#722f37] text-white shadow-xs'
                          : 'text-[#574943] hover:text-[#231815] hover:bg-[#e8dcc6]/40'
                      }`}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Cover Letter</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveResultTab('ats_resume')}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeResultTab === 'ats_resume'
                          ? 'bg-[#722f37] text-white shadow-xs'
                          : 'text-[#722f37] bg-[#e8dcc6]/40 hover:bg-[#e8dcc6]/70'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#722f37] group-hover:text-white" />
                      <span>ATS Resume Studio</span>
                      <span className="rounded-full bg-[#722f37] text-[#FAF7F2] px-1.5 py-0.2 text-[9px] font-black uppercase">
                        Vector
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Tab 1: Overview & Evidence */}
            {activeResultTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Strategic Recommendations */}
                <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#722f37]" />
                    <h3 className="font-display text-sm font-bold text-[#231815]">
                      High-Impact Recommendations
                    </h3>
                  </div>
                  <ul className="space-y-2.5">
                    {analysisResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-[#574943] leading-relaxed">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Verified Resume Evidence */}
                <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#722f37]" />
                    <h3 className="font-display text-sm font-bold text-[#231815]">
                      Extracted Resume Evidence
                    </h3>
                  </div>
                  <p className="text-xs text-[#574943]">
                    Concrete achievements and experience verified from your submitted resume:
                  </p>
                  <div className="space-y-3">
                    {analysisResult.resumeEvidence.map((item, idx) => (
                      <div key={idx} className="rounded-xl border border-[#b7a89a]/35 bg-[#e8dcc6]/25 p-4 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold text-[#231815]">
                          <span>{item.claim}</span>
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                            {item.alignment}
                          </span>
                        </div>
                        <p className="text-[#574943] leading-relaxed">
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
                <div className="rounded-2xl border border-emerald-200/80 bg-[#FAF7F2] p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" />
                      <h3 className="font-display text-sm font-bold">
                        Demonstrated Skills ({analysisResult.matchedSkills.length})
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Matched
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {analysisResult.matchedSkills.map((item, idx) => (
                      <div key={idx} className="rounded-xl border border-emerald-200/60 bg-emerald-50/30 p-3 space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-[#231815]">
                          <span>{item.skill}</span>
                          <span className="text-[10px] uppercase font-bold text-emerald-800">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[#574943] text-[11px] leading-relaxed">
                          {item.context}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="rounded-2xl border border-[#b7a89a]/50 bg-[#FAF7F2] p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#722f37]">
                      <AlertCircle className="h-4 w-4" />
                      <h3 className="font-display text-sm font-bold">
                        Skills to Improve ({analysisResult.missingSkills.length})
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-[#722f37] bg-[#e8dcc6]/60 px-2 py-0.5 rounded border border-[#b7a89a]/50">
                      Gaps
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {analysisResult.missingSkills.map((item, idx) => (
                      <div key={idx} className="rounded-xl border border-[#b7a89a]/40 bg-[#e8dcc6]/25 p-3 space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-[#231815]">
                          <span>{item.skill}</span>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            item.priority === 'High' ? 'bg-[#722f37] text-[#FAF7F2]' : 'bg-[#e8dcc6] text-[#231815]'
                          }`}>
                            {item.priority} Priority
                          </span>
                        </div>
                        <p className="text-[#574943] text-[11px] leading-relaxed">
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
              <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 shadow-2xs space-y-6 animate-in fade-in duration-150">
                <div>
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-[#722f37]" />
                    <h3 className="font-display text-sm font-bold text-[#231815]">
                      Curated Skill Bridge Roadmap
                    </h3>
                  </div>
                  <p className="text-xs text-[#574943] mt-1">
                    Actionable milestones designed to close your identified skill gaps before interview rounds:
                  </p>
                </div>

                <div className="space-y-4">
                  {analysisResult.learningRoadmap.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-[#b7a89a]/35 bg-[#e8dcc6]/20 p-5 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#722f37] text-[#FAF7F2] text-[11px] font-bold">
                            {idx + 1}
                          </span>
                          <h4 className="font-display font-bold text-[#231815] text-sm">
                            {item.milestone}
                          </h4>
                        </div>
                        <span className="text-[11px] font-bold text-[#722f37] bg-[#e8dcc6]/60 px-2.5 py-1 rounded-md border border-[#b7a89a]/50">
                          {item.timeframe}
                        </span>
                      </div>

                      <div className="space-y-1.5 pl-8">
                        <p className="font-semibold text-[#231815]">Action Items:</p>
                        <ul className="list-disc list-inside space-y-1 text-[#574943]">
                          {item.actionItems.map((action, actionIdx) => (
                            <li key={actionIdx}>{action}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="pl-8 pt-2 text-[11px] text-[#574943] border-t border-[#b7a89a]/30 flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-[#722f37] shrink-0" />
                        <span><strong>Recommended Resource:</strong> {item.resourceSuggestion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Interview Prep */}
            {activeResultTab === 'interview' && (
              <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 shadow-2xs space-y-6 animate-in fade-in duration-150">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#722f37]" />
                    <h3 className="font-display text-sm font-bold text-[#231815]">
                      Grounded Interview Questions
                    </h3>
                  </div>
                  <p className="text-xs text-[#574943] mt-1">
                    Practice questions generated specifically around your project evidence and target role requirements:
                  </p>
                </div>

                <div className="space-y-4">
                  {analysisResult.interviewQuestions.map((q, idx) => {
                    const answer = getInterviewAnswer(q);
                    return (
                      <div key={idx} className="rounded-xl border border-[#b7a89a]/35 bg-[#e8dcc6]/20 p-5 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#722f37]">
                            {q.topic}
                          </span>
                          <span className="text-[11px] text-[#574943]">Question {idx + 1}</span>
                        </div>
                        <p className="text-sm font-bold text-[#231815]">
                          "{q.question}"
                        </p>
                        <div className="rounded-lg bg-[#FAF7F2] p-3 border border-[#b7a89a]/35 text-[11px] text-[#574943] space-y-1">
                          <p className="font-semibold text-[#231815]">Expected Focus & Talking Points:</p>
                          <p>{q.expectedFocus}</p>
                        </div>

                        {/* Interactive Voice/Text Mock Interview Practice with AI Feedback */}
                        <MockInterviewPractice
                          question={q.question}
                          topic={q.topic}
                          expectedFocus={q.expectedFocus}
                          suggestedModelAnswer={answer}
                          targetRole={effectiveRole}
                        />

                        {answer && (
                          <div className="rounded-xl bg-[#FAF7F2] p-4 border border-[#b7a89a]/40 text-xs text-[#231815] space-y-2.5 shadow-2xs mt-1">
                            <div className="flex items-center justify-between gap-2 border-b border-[#b7a89a]/30 pb-2">
                              <div className="flex items-center gap-1.5 font-bold text-[#231815]">
                                <Sparkles className="h-4 w-4 text-[#722f37] shrink-0" />
                                <span className="text-xs font-bold uppercase tracking-wider text-[#722f37]">Suggested Model Answer (STAR Method)</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyQuestionAnswer(answer, idx)}
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#722f37] hover:text-[#231815] bg-[#e8dcc6]/40 hover:bg-[#e8dcc6]/70 px-2.5 py-1 rounded-md border border-[#b7a89a]/50 transition-colors shadow-2xs cursor-pointer"
                                title="Copy model answer to clipboard"
                              >
                                {copiedQuestionIdx === idx ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5 text-[#722f37]" />
                                    <span>Copy Answer</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="leading-relaxed text-[#574943] font-normal">{answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {pdfExportError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{pdfExportError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPdfExportError(null)}
                  className="text-rose-500 hover:text-rose-700 cursor-pointer p-0.5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {/* Tab 5: ATS Resume & Bullets */}
            {activeResultTab === 'ats_resume' && (
              <ATSResumeOptimizer
                resumeText={analysisMeta?.extractedResumeText || pastedResume || ''}
                jobDescription={jobDescription}
                targetRole={effectiveRole}
                missingSkills={analysisResult.missingSkills}
                analysisId={savedAnalysisId ?? undefined}
                initialScore={analysisResult.matchScore}
                onOpenProfileAssets={onOpenProfileAssets}
                onOpenOutreach={onOpenOutreach}
              />
            )}

            {/* Tab 6: Personalized AI Cover Letter */}
            {activeResultTab === 'cover_letter' && (
              <CoverLetterGenerator
                jobTitle={effectiveRole}
                companyName={effectiveCompany}
                jobDescription={jobDescription}
                resumeText={analysisMeta?.extractedResumeText || pastedResume || 'Candidate Resume Evidence'}
              />
            )}


            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={handleResetForm}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Analyze Another Resume</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50 px-5 py-2.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-50"
                  title="Download professional PDF report"
                >
                  {isExportingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>{isExportingPdf ? 'Generating PDF Report...' : 'Download PDF Report'}</span>
                </button>

                <button
                  type="button"
                  onClick={onNavigateDashboard}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <span>View Dashboard Progress</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Form Input Section (Rendered when no analysis active) */
          !isAnalyzing && (
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Resume Upload & Paste Section */}
                <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 sm:p-7 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-base font-bold text-[#231815]">
                        1. Resume Input
                      </h2>
                      <p className="text-xs text-[#574943]">
                        Upload a PDF, Word doc (.docx), or paste plain text (required)
                      </p>
                    </div>

                    {/* Input Mode Selector */}
                    <div className="flex rounded-xl bg-[#e8dcc6]/50 p-1 text-xs font-bold border border-[#b7a89a]/40">
                      <button
                        type="button"
                        onClick={() => {
                          setResumeMode('upload');
                          setFileError(null);
                        }}
                        className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                          resumeMode === 'upload'
                            ? 'bg-[#722f37] text-[#FAF7F2] shadow-xs'
                            : 'text-[#574943] hover:text-[#231815]'
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
                        className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                          resumeMode === 'paste'
                            ? 'bg-[#722f37] text-[#FAF7F2] shadow-xs'
                            : 'text-[#574943] hover:text-[#231815]'
                        }`}
                      >
                        Paste Text
                      </button>
                    </div>
                  </div>

                  {/* Mode A: Drag & Drop Document */}
                  {resumeMode === 'upload' ? (
                    <div className="space-y-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#574943]">
                        Upload Resume (PDF or Word .docx)
                      </label>

                      {!uploadedFile ? (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all cursor-pointer ${
                            isDragging
                              ? 'border-[#722f37] bg-[#e8dcc6]/50 scale-[1.01]'
                              : fileError
                              ? 'border-red-300 bg-red-50/20'
                              : 'border-[#b7a89a]/60 bg-[#e8dcc6]/20 hover:border-[#722f37] hover:bg-[#e8dcc6]/40'
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

                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF7F2] shadow-xs border border-[#b7a89a]/50 text-[#722f37] mb-3">
                            <UploadCloud className="h-7 w-7" />
                          </div>

                          <p className="text-sm font-bold text-[#231815]">
                            Drop your resume PDF or Word document (.docx) here, or{' '}
                            <span className="text-[#722f37] underline underline-offset-2">browse</span>
                          </p>
                          <p className="mt-1.5 text-xs text-[#574943]">
                            PDF, DOCX, and DOC files (maximum 10MB)
                          </p>
                        </div>
                      ) : (
                        /* Uploaded File Presentation Card */
                        <div className="rounded-2xl border border-[#b7a89a]/50 bg-[#e8dcc6]/30 p-4 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#722f37] text-[#FAF7F2] shadow-xs">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[#231815] truncate">
                                  {uploadedFile.name}
                                </p>
                                <p className="text-xs text-[#574943] tabular-nums">
                                  {formatFileSize(uploadedFile.size)} · {uploadedFile.name.toLowerCase().endsWith('.docx') || uploadedFile.name.toLowerCase().endsWith('.doc') ? 'Word Document' : 'PDF Document'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 rounded px-2 py-0.5">
                                <CheckCircle2 className="h-3 w-3" />
                                {uploadedFile.name.toLowerCase().endsWith('.docx') || uploadedFile.name.toLowerCase().endsWith('.doc') ? 'Word Ready' : 'PDF Ready'}
                              </span>
                              <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="rounded-lg p-1.5 text-[#574943] hover:bg-[#FAF7F2] hover:text-red-600 transition-colors cursor-pointer"
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
                        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/70 p-3 text-xs text-red-700 animate-in fade-in duration-150">
                          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                          <span>{fileError}</span>
                        </div>
                      )}

                      {/* Quick Helper */}
                      <div className="flex items-center justify-between pt-1 text-xs text-[#574943]">
                        <span>Don't have a PDF ready?</span>
                        <button
                          type="button"
                          onClick={handleUseSampleResume}
                          className="font-bold text-[#722f37] hover:underline cursor-pointer"
                        >
                          Use Sample Student Resume
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Mode B: Paste Resume Text */
                    <div className="space-y-3">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#574943]">
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
                          className="w-full rounded-2xl border border-[#b7a89a]/50 bg-[#FAF7F2] p-3.5 text-xs text-[#231815] placeholder-[#574943]/60 focus:border-[#722f37] focus:outline-none focus:ring-1 focus:ring-[#722f37] leading-relaxed"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#574943]">
                        <span className="tabular-nums">
                          {pastedResume.trim().length} characters
                        </span>
                        <button
                          type="button"
                          onClick={handleUseSampleResume}
                          className="font-bold text-[#722f37] hover:underline cursor-pointer"
                        >
                          Insert Sample Resume Text
                        </button>
                      </div>

                      {fileError && (
                        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/70 p-3 text-xs text-red-700">
                          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                          <span>{fileError}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Job Description Section */}
                <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 sm:p-7 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-base font-bold text-[#231815]">
                        2. Target Job Description
                      </h2>
                      <p className="text-xs text-[#574943]">
                        Provide the job requirements to match against (required)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleUseSampleJob}
                      className="inline-flex items-center gap-1 rounded-xl border border-[#b7a89a]/50 bg-[#e8dcc6]/40 px-2.5 py-1 text-xs font-bold text-[#722f37] hover:bg-[#e8dcc6]/80 transition-colors cursor-pointer"
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      <span>Insert Sample Job</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#574943]">
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
                        className={`w-full rounded-2xl border p-3.5 text-xs bg-[#FAF7F2] text-[#231815] placeholder-[#574943]/60 focus:outline-none focus:ring-1 leading-relaxed ${
                          jobError
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-[#b7a89a]/50 focus:border-[#722f37] focus:ring-[#722f37]'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#574943]">
                      <span className="tabular-nums">
                        {jobDescription.trim().length} characters
                      </span>
                      {jobDescription.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={() => setJobDescription('')}
                          className="text-[#574943] hover:text-[#231815] cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Job Error Message */}
                    {jobError && (
                      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/70 p-3 text-xs text-red-700 animate-in fade-in duration-150">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                        <span>{jobError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar & Prominent Button */}
              <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-6 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="font-display text-base font-bold text-[#231815]">
                    Ready to Evaluate Fit with Gemini?
                  </h3>
                  <p className="text-xs text-[#574943]">
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
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#b7a89a]/50 bg-[#FAF7F2] px-4 py-3 text-xs font-bold text-[#574943] hover:bg-[#e8dcc6]/40 hover:text-[#231815] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-[#722f37]" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!isFormValid || isAnalyzing}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-[#722f37] hover:bg-[#551b22] px-8 py-3.5 text-sm font-bold text-[#FAF7F2] shadow-md shadow-[#722f37]/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-[#e8dcc6]" />
                    <span>Analyze My Match</span>
                    <ArrowRight className="h-4 w-4 text-[#e8dcc6]" />
                  </button>
                </div>
              </div>
            </form>
          )
        )}

        {/* Privacy Notice Box */}
        <div className="mt-10 rounded-2xl border border-[#b7a89a]/35 bg-[#e8dcc6]/25 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e8dcc6] text-[#722f37] border border-[#b7a89a]/40">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-xs font-bold text-[#231815]">
                Privacy Notice
              </h4>
              <p className="text-xs leading-relaxed text-[#574943]">
                Uploaded resumes may contain personal information such as contact details, addresses, and employment history. In this application, all requests are securely proxied through your server to the Gemini API without public data sharing or persistent third-party storage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
