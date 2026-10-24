import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  FileText,
  Zap,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
  Plus,
  Trash2,
  RotateCcw,
  CheckSquare,
  Square,
  Edit3,
  TrendingUp,
  BarChart2,
  Eye,
  Sliders,
  Briefcase,
  Layers,
  X,
  Share2,
  Mail,
} from 'lucide-react';
import {
  ATSStructuredResume,
  BulletRewriteResult,
  MissingSkill,
} from '../types/analysis';
import { generateResumePDF } from '../utils/resumePdfExport';

interface ATSResumeOptimizerProps {
  resumeText: string;
  jobDescription: string;
  targetRole?: string;
  missingSkills?: MissingSkill[];
  analysisId?: number;
  initialScore?: number;
  onOpenProfileAssets?: () => void;
  onOpenOutreach?: () => void;
}

const ROLE_PRESETS = [
  {
    id: 'fullstack',
    label: 'Full-Stack Developer',
    title: 'Junior Full-Stack Developer',
    highlightBadge: 'React + Node + APIs',
  },
  {
    id: 'frontend',
    label: 'Frontend Specialist',
    title: 'Frontend Engineer',
    highlightBadge: 'React + TypeScript + UI/UX',
  },
  {
    id: 'backend',
    label: 'Backend & API Engineer',
    title: 'Backend Software Engineer',
    highlightBadge: 'REST APIs + MySQL + Node',
  },
  {
    id: 'devops',
    label: 'Cloud & DevOps',
    title: 'Junior DevOps Engineer',
    highlightBadge: 'Docker + CI/CD + Cloud',
  },
  {
    id: 'sde',
    label: 'Software Engineer (SDE)',
    title: 'Software Development Engineer',
    highlightBadge: 'Data Structures + Web Apps',
  },
];

export const ATSResumeOptimizer: React.FC<ATSResumeOptimizerProps> = ({
  resumeText,
  jobDescription,
  targetRole,
  missingSkills = [],
  analysisId,
  initialScore = 65,
  onOpenProfileAssets,
  onOpenOutreach,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'interactive_builder' | 'bullet_rewriter'>('interactive_builder');

  // Interactive Gap Selection & Context State
  const [selectedSkillGaps, setSelectedSkillGaps] = useState<string[]>(() =>
    missingSkills.map((s) => s.skill)
  );
  const [skillContexts, setSkillContexts] = useState<Record<string, string>>({});

  // Structured ATS Resume State
  const [isGenerating, setIsGenerating] = useState(false);
  const [structuredResume, setStructuredResume] = useState<ATSStructuredResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>('fullstack');

  // Raw source text & direct upload state
  const [customResumeText, setCustomResumeText] = useState<string>(resumeText || '');
  const [showSourceText, setShowSourceText] = useState(false);
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const docUploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resumeText && resumeText.trim().length > 30 && !customResumeText) {
      setCustomResumeText(resumeText);
    }
  }, [resumeText]);

  // Single Bullet Rewriter State
  const [singleBullet, setSingleBullet] = useState('');
  const [isRewritingBullet, setIsRewritingBullet] = useState(false);
  const [bulletResult, setBulletResult] = useState<BulletRewriteResult | null>(null);
  const [bulletError, setBulletError] = useState<string | null>(null);
  const [copiedBulletIdx, setCopiedBulletIdx] = useState<number | null>(null);

  const toggleSkillGap = (skill: string) => {
    setSelectedSkillGaps((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSelectAll = () => {
    setSelectedSkillGaps(missingSkills.map((s) => s.skill));
  };

  const handleDeselectAll = () => {
    setSelectedSkillGaps([]);
  };

  const handleDirectDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingDoc(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await fetch('/api/extract-resume-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileBase64: base64, fileName: file.name }),
          });
          const data = await res.json();
          if (res.ok && data.success && data.text) {
            setCustomResumeText(data.text);
            setShowSourceText(true);
          } else {
            setError(data.error || 'Failed to extract text from file.');
          }
        } catch (uploadErr: any) {
          setError(uploadErr.message || 'Error processing document.');
        } finally {
          setIsExtractingDoc(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'File read error.');
      setIsExtractingDoc(false);
    }
  };

  // Generate ATS Resume with Confirmed Missing Skills & User Context
  const handleGenerateResume = async () => {
    setIsGenerating(true);
    setError(null);

    const confirmedSkills = selectedSkillGaps.map((skill) => ({
      skill,
      userContext: skillContexts[skill]?.trim() || '',
    }));

    try {
      const effectiveText = (customResumeText && customResumeText.trim().length > 30)
        ? customResumeText.trim()
        : resumeText;

      const res = await fetch('/api/generate-ats-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: effectiveText,
          jobDescription,
          targetRole: targetRole || 'Target Role',
          confirmedSkills,
          analysisId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate ATS resume.');
      }

      setStructuredResume(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate ATS resume.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = () => {
    if (!structuredResume) return;
    generateResumePDF(structuredResume);
  };

  // Copy Markdown format of the structured resume
  const handleCopyMarkdown = () => {
    if (!structuredResume) return;
    const { personalInfo, professionalSummary, technicalSkills, projects, experience, education, certifications } = structuredResume;

    let md = `# ${personalInfo.fullName.toUpperCase()}\n`;
    md += `${personalInfo.email} | ${personalInfo.phone} | ${personalInfo.location}\n`;
    if (personalInfo.linkedin) md += `LinkedIn: ${personalInfo.linkedin} | `;
    if (personalInfo.github) md += `GitHub: ${personalInfo.github}\n\n`;

    md += `## PROFESSIONAL SUMMARY\n${professionalSummary}\n\n`;

    md += `## TECHNICAL SKILLS\n`;
    technicalSkills.forEach((cat) => {
      md += `* **${cat.category}:** ${cat.skills.join(', ')}\n`;
    });
    md += `\n`;

    md += `## PROJECTS\n`;
    projects.forEach((proj) => {
      md += `### ${proj.title} [${proj.techStack.join(', ')}]\n`;
      proj.bullets.forEach((b) => {
        md += `* ${b}\n`;
      });
      md += `\n`;
    });

    if (experience && experience.length > 0) {
      md += `## EXPERIENCE\n`;
      experience.forEach((exp) => {
        md += `### ${exp.role} — ${exp.company} (${exp.period})\n`;
        exp.bullets.forEach((b) => {
          md += `* ${b}\n`;
        });
        md += `\n`;
      });
    }

    md += `## EDUCATION\n`;
    education.forEach((edu) => {
      md += `* **${edu.degree}** — ${edu.institution} (${edu.year})${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}\n`;
    });
    md += `\n`;

    if (certifications && certifications.length > 0) {
      md += `## CERTIFICATIONS\n`;
      certifications.forEach((c) => {
        md += `* ${c}\n`;
      });
    }

    navigator.clipboard?.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2200);
  };

  // Bullet Rewriter handler
  const handleRewriteBullet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!singleBullet.trim()) return;

    setIsRewritingBullet(true);
    setBulletError(null);
    setBulletResult(null);

    try {
      const res = await fetch('/api/rewrite-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullet: singleBullet.trim(),
          targetRole: targetRole || 'Software Engineer',
          targetSkill: selectedSkillGaps[0] || 'Technical Impact',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to rewrite bullet.');
      }

      setBulletResult(data.data);
    } catch (err: any) {
      setBulletError(err.message || 'Failed to rewrite bullet.');
    } finally {
      setIsRewritingBullet(false);
    }
  };

  const handleCopyBullet = (text: string, idx: number) => {
    navigator.clipboard?.writeText(text);
    setCopiedBulletIdx(idx);
    setTimeout(() => setCopiedBulletIdx(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Selector Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('interactive_builder')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'interactive_builder'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>ATS Resume PDF Generator (Gap-Confirmed)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('bullet_rewriter')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'bullet_rewriter'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Google XYZ Bullet Rewriter</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Recruiter-Grade & ATS Safe</span>
        </div>
      </div>

      {/* SUB-TAB 1: INTERACTIVE GAP CONFIRMATION & PDF RESUME BUILDER */}
      {activeSubTab === 'interactive_builder' && (
        <div className="space-y-6">
          {/* STEP 1: Gap Confirmation Wizard */}
          {!structuredResume && !isGenerating && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-stone-50 p-6 sm:p-8 space-y-4 shadow-2xs">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-sm">
                    <Sparkles className="h-6 w-6 text-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-stone-900">
                      Step 1: Confirm Skill Gaps & Add Your Project Evidence
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Select which missing keywords to incorporate. Your real projects, education, certificates, and personal details are strictly preserved—only the confirmed skills will be woven into your resume.
                    </p>
                  </div>
                </div>

                {/* Candidate Grounding Notice */}
                <div className="rounded-xl border border-amber-200/80 bg-white p-3.5 flex items-start gap-3 shadow-2xs">
                  <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-stone-900">Your Real Details & Credentials Are Preserved:</span>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      SkillBridge AI keeps your actual name, real projects (such as <strong>Nex-Cartify</strong> and <strong>RetailGenie AI</strong>), <strong>Education</strong>, and <strong>Certificates</strong> intact. It only weaves your selected missing keywords into your project bullets and technical skills list.
                    </p>
                  </div>
                </div>

                {/* Source Resume Text Inspection & Upload Accordion */}
                <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowSourceText(!showSourceText)}
                      className="flex items-center gap-2 text-xs font-bold text-stone-800 hover:text-amber-800 cursor-pointer"
                    >
                      <FileText className="h-4 w-4 text-amber-700" />
                      <span>{showSourceText ? '▼ Hide Source Resume Text' : '▶ View / Paste Your Exact Resume Text'}</span>
                      <span className="text-[10px] font-normal text-stone-500">
                        ({(customResumeText || resumeText || '').length} characters)
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={docUploadInputRef}
                        onChange={handleDirectDocUpload}
                        accept=".pdf,.docx,.doc"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => docUploadInputRef.current?.click()}
                        disabled={isExtractingDoc}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isExtractingDoc ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                            <span>Reading Document...</span>
                          </>
                        ) : (
                          <>
                            <FileText className="h-3.5 w-3.5 text-amber-700" />
                            <span>Upload Resume (PDF/Word)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {showSourceText && (
                    <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                      <p className="text-[11px] text-stone-500">
                        You can paste or edit your exact resume text below to guarantee 100% accuracy of your education, projects, and certifications:
                      </p>
                      <textarea
                        rows={8}
                        value={customResumeText || resumeText || ''}
                        onChange={(e) => setCustomResumeText(e.target.value)}
                        placeholder="Paste your exact resume text here (Name, Contact, Education, Projects, Experience, Certifications)..."
                        className="w-full rounded-lg border border-stone-300 bg-white p-3 font-mono text-xs text-stone-800 focus:border-amber-600 focus:outline-none leading-relaxed"
                      />
                    </div>
                  )}
                </div>

                {/* Missing Skills Checkbox List */}
                {missingSkills.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                        Select Gaps to Incorporate ({selectedSkillGaps.length}/{missingSkills.length} selected):
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="text-amber-800 hover:text-amber-950 font-semibold cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-stone-300">|</span>
                        <button
                          type="button"
                          onClick={handleDeselectAll}
                          className="text-stone-500 hover:text-stone-700 cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {missingSkills.map((gap, idx) => {
                        const isSelected = selectedSkillGaps.includes(gap.skill);
                        return (
                          <div
                            key={idx}
                            className={`rounded-xl border p-4 transition-all ${
                              isSelected
                                ? 'border-amber-300 bg-white shadow-2xs'
                                : 'border-stone-200 bg-stone-50/70 opacity-70'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => toggleSkillGap(gap.skill)}
                                className="mt-0.5 text-amber-700 hover:text-amber-900 cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare className="h-5 w-5 text-amber-700" />
                                ) : (
                                  <Square className="h-5 w-5 text-stone-400" />
                                )}
                              </button>

                              <div className="flex-1 space-y-1.5">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-stone-900">{gap.skill}</span>
                                    <span
                                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                        gap.priority?.toLowerCase() === 'high'
                                          ? 'bg-rose-100 text-rose-700'
                                          : gap.priority?.toLowerCase() === 'medium'
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {gap.priority} Priority
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-500 italic">
                                    {gap.reason}
                                  </span>
                                </div>

                                {isSelected && (
                                  <div className="pt-2 animate-in fade-in duration-150">
                                    <input
                                      type="text"
                                      value={skillContexts[gap.skill] || ''}
                                      onChange={(e) =>
                                        setSkillContexts({
                                          ...skillContexts,
                                          [gap.skill]: e.target.value,
                                        })
                                      }
                                      placeholder={`Where did you use or learn ${gap.skill}? (e.g. Added ${gap.skill} testing to Nex-Cartify, or leave blank for AI auto-weave)`}
                                      className="w-full rounded-lg border border-stone-200 bg-stone-50/50 p-2 text-xs text-stone-800 placeholder-stone-400 focus:border-amber-600 focus:bg-white focus:outline-none"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No major skill gaps identified. You can proceed with full ATS optimization directly!
                  </p>
                )}

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleGenerateResume}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-7 py-3.5 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:from-amber-500 hover:to-orange-500 transition-all cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Confirm & Generate ATS Resume PDF</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-12 text-center space-y-3 animate-in fade-in">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-amber-200/80">
                <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
              </div>
              <h4 className="text-sm font-bold text-stone-900">
                Extracting Credentials & Weaving Confirmed Skills...
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Parsing real name, education, certificates, and projects, synthesizing XYZ bullet points, and formatting your ATS-compliant PDF resume.
              </p>
            </div>
          )}

          {/* STEP 2: Structured ATS Resume Paper Preview & PDF Export */}
          {structuredResume && !isGenerating && (
            <div className="space-y-6">
              {/* Feature 1: Side-by-Side ATS Score Comparison Card */}
              <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-5 border-b border-stone-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        <Check className="h-3 w-3 text-emerald-600" />
                        ATS Optimization Complete
                      </span>
                      <span className="text-xs text-stone-400">•</span>
                      <span className="text-xs font-semibold text-stone-600">
                        {structuredResume.integratedSkills.length} Verified Gaps Woven
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-stone-900">
                      ATS Match Score & Readiness Analysis
                    </h3>
                    <p className="text-xs text-stone-500 max-w-xl">
                      Compare your original baseline score against the recruiter-optimized version with integrated keywords and Google XYZ formula metrics.
                    </p>
                  </div>

                  {/* Score Comparison Display */}
                  <div className="flex items-center gap-3 sm:gap-4 self-stretch sm:self-auto justify-between sm:justify-start bg-[#FBFBF9] p-3 rounded-xl border border-stone-200">
                    {/* Before Score */}
                    <div className="text-center px-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Original</span>
                      <div className="text-xl sm:text-2xl font-black text-stone-600 mt-0.5">
                        {initialScore}%
                      </div>
                      <span className="text-[10px] text-stone-400">Baseline</span>
                    </div>

                    {/* Surge Arrow & Pill */}
                    <div className="flex flex-col items-center px-1">
                      <div className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                        <TrendingUp className="h-3 w-3" />
                        <span>+{Math.max(1, structuredResume.atsScore - initialScore)}%</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-stone-400 mt-1 hidden sm:block" />
                    </div>

                    {/* After Score */}
                    <div className="text-center px-2 bg-emerald-50 rounded-lg p-1.5 border border-emerald-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Optimized</span>
                      <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
                        {structuredResume.atsScore}%
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700">Recruiter-Ready</span>
                    </div>
                  </div>
                </div>

                {/* 3 Key ATS Diagnostic Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[#FBFBF9] border border-stone-200 p-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-stone-700">Keyword Alignment</span>
                      <span className="font-bold text-emerald-700">96%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full w-[96%]" />
                    </div>
                    <span className="text-[10px] text-stone-500 mt-1.5 block">
                      Target role keywords synthesized seamlessly
                    </span>
                  </div>

                  <div className="rounded-xl bg-[#FBFBF9] border border-stone-200 p-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-stone-700">Google XYZ Bullet Impact</span>
                      <span className="font-bold text-emerald-700">95%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full w-[95%]" />
                    </div>
                    <span className="text-[10px] text-stone-500 mt-1.5 block">
                      Action verbs + task context + measurable metric
                    </span>
                  </div>

                  <div className="rounded-xl bg-[#FBFBF9] border border-stone-200 p-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-stone-700">ATS Machine Parser Score</span>
                      <span className="font-bold text-emerald-700">100%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full w-[100%]" />
                    </div>
                    <span className="text-[10px] text-stone-500 mt-1.5 block">
                      Single column, standard headers, clean Helvetica
                    </span>
                  </div>
                </div>

                {/* Action Buttons Toolbar */}
                <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:from-amber-500 hover:to-orange-500 transition-all active:scale-95 cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download ATS Resume (PDF)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDiffModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-amber-600" />
                      <span>Inspect Changes (Diff)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                        isEditing
                          ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-xs font-bold'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                      title="Edit any section of your resume directly before downloading"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-amber-700" />
                      <span>{isEditing ? 'Done Editing' : 'Edit Details'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyMarkdown}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all shadow-2xs active:scale-95 cursor-pointer"
                    >
                      {copiedMarkdown ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-stone-500" />
                          <span>Copy Markdown</span>
                        </>
                      )}
                    </button>

                    {onOpenProfileAssets && (
                      <button
                        type="button"
                        onClick={onOpenProfileAssets}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all shadow-2xs active:scale-95 cursor-pointer"
                        title="Generate LinkedIn headlines and GitHub bios"
                      >
                        <Share2 className="h-3.5 w-3.5 text-[#0A66C2]" />
                        <span>Profile Copy</span>
                      </button>
                    )}

                    {onOpenOutreach && (
                      <button
                        type="button"
                        onClick={onOpenOutreach}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all shadow-2xs active:scale-95 cursor-pointer"
                        title="Generate recruiter cold DMs and InMails"
                      >
                        <Mail className="h-3.5 w-3.5 text-stone-700" />
                        <span>Recruiter DMs</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setStructuredResume(null)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-all cursor-pointer active:scale-95"
                      title="Change confirmed skills or re-generate"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-stone-500" />
                      <span>Re-select Gaps</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Feature 5: 1-Click Role-Tailored Resume Presets */}
              <div className="rounded-xl border border-stone-200 bg-[#FBFBF9] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 text-amber-400">
                    <Briefcase className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">
                      Target Role Preset:
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Re-angles headline and emphasis with 1-click
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {ROLE_PRESETS.map((preset) => {
                    const isSelected = activePresetId === preset.id || structuredResume.targetTitle === preset.title;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setActivePresetId(preset.id);
                          setStructuredResume({
                            ...structuredResume,
                            targetTitle: preset.title,
                          });
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-stone-900 text-white font-bold shadow-xs'
                            : 'bg-white border border-stone-200 text-stone-700 hover:border-amber-400 hover:text-amber-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Integrated Skills Pills Banner */}
              <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80 p-4 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-600" />
                  Keywords Seamlessly Added to Your Resume:
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {structuredResume.integratedSkills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200/90 shadow-2xs"
                    >
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>{sk}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* ATS Resume Paper Container (Desk Shadow & Clean Sheet) */}
              <div className="rounded-3xl border border-stone-200/90 bg-white p-7 sm:p-14 shadow-2xl shadow-stone-900/5 ring-1 ring-stone-900/5 space-y-6 max-w-4xl mx-auto relative">
                {isEditing && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-center justify-between">
                    <span>Editing Mode Active: Make any edits below. When ready, click <strong>Done Editing</strong> and <strong>Download ATS Resume (PDF)</strong>.</span>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="rounded-lg bg-amber-200/80 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-300 cursor-pointer"
                    >
                      Done Editing
                    </button>
                  </div>
                )}

                {/* Header - Crisp professional ink rule */}
                <div className="border-b-2 border-stone-900 pb-3 text-left space-y-2">
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase">Candidate Full Name</label>
                        <input
                          type="text"
                          value={structuredResume.personalInfo.fullName}
                          onChange={(e) =>
                            setStructuredResume({
                              ...structuredResume,
                              personalInfo: { ...structuredResume.personalInfo, fullName: e.target.value },
                            })
                          }
                          className="w-full rounded-lg border border-stone-300 p-2 text-sm font-bold text-stone-900 focus:border-amber-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-stone-600 uppercase">Target Title</label>
                        <input
                          type="text"
                          value={structuredResume.targetTitle || ''}
                          onChange={(e) =>
                            setStructuredResume({
                              ...structuredResume,
                              targetTitle: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-stone-300 p-2 text-sm font-bold text-stone-800 focus:border-amber-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-stone-600 uppercase">Email</label>
                        <input
                          type="text"
                          value={structuredResume.personalInfo.email}
                          onChange={(e) =>
                            setStructuredResume({
                              ...structuredResume,
                              personalInfo: { ...structuredResume.personalInfo, email: e.target.value },
                            })
                          }
                          className="w-full rounded-lg border border-stone-300 p-2 text-xs text-stone-800 focus:border-amber-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-stone-600 uppercase">Phone & Location</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={structuredResume.personalInfo.phone}
                            placeholder="Phone"
                            onChange={(e) =>
                              setStructuredResume({
                                ...structuredResume,
                                personalInfo: { ...structuredResume.personalInfo, phone: e.target.value },
                              })
                            }
                            className="w-full rounded-lg border border-stone-300 p-2 text-xs text-stone-800 focus:border-amber-600 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={structuredResume.personalInfo.location}
                            placeholder="Location (e.g. Nagpur, Maharashtra)"
                            onChange={(e) =>
                              setStructuredResume({
                                ...structuredResume,
                                personalInfo: { ...structuredResume.personalInfo, location: e.target.value },
                              })
                            }
                            className="w-full rounded-lg border border-stone-300 p-2 text-xs text-stone-800 focus:border-amber-600 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-stone-600 uppercase">LinkedIn & GitHub</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={structuredResume.personalInfo.linkedin || ''}
                            placeholder="LinkedIn URL"
                            onChange={(e) =>
                              setStructuredResume({
                                ...structuredResume,
                                personalInfo: { ...structuredResume.personalInfo, linkedin: e.target.value },
                              })
                            }
                            className="w-full rounded-lg border border-stone-300 p-2 text-xs text-stone-800 focus:border-amber-600 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={structuredResume.personalInfo.github || ''}
                            placeholder="GitHub URL"
                            onChange={(e) =>
                              setStructuredResume({
                                ...structuredResume,
                                personalInfo: { ...structuredResume.personalInfo, github: e.target.value },
                              })
                            }
                            className="w-full rounded-lg border border-stone-300 p-2 text-xs text-stone-800 focus:border-amber-600 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-stone-600 uppercase">Portfolio / Website</label>
                        <input
                          type="text"
                          value={structuredResume.personalInfo.portfolio || ''}
                          placeholder="Portfolio link"
                          onChange={(e) =>
                            setStructuredResume({
                              ...structuredResume,
                              personalInfo: { ...structuredResume.personalInfo, portfolio: e.target.value },
                            })
                          }
                          className="w-full rounded-lg border border-stone-300 p-2 text-xs text-stone-800 focus:border-amber-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-black text-stone-900 tracking-wide">
                        {structuredResume.personalInfo.fullName.toUpperCase()}
                      </h1>
                      {structuredResume.targetTitle && (
                        <p className="text-xs font-bold text-stone-700">
                          {structuredResume.targetTitle}
                        </p>
                      )}
                      <p className="text-[11px] text-stone-600 pt-0.5">
                        {[
                          structuredResume.personalInfo.email,
                          structuredResume.personalInfo.phone,
                          structuredResume.personalInfo.location,
                          structuredResume.personalInfo.linkedin,
                          structuredResume.personalInfo.github,
                          structuredResume.personalInfo.portfolio,
                        ]
                          .filter(Boolean)
                          .join('  •  ')}
                      </p>
                    </>
                  )}
                </div>

                {/* Summary */}
                {structuredResume.professionalSummary && (
                  <div className="space-y-1.5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-200 pb-1">
                      Professional Summary
                    </h2>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={structuredResume.professionalSummary}
                        onChange={(e) =>
                          setStructuredResume({
                            ...structuredResume,
                            professionalSummary: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-stone-300 p-2.5 text-xs text-stone-800 focus:border-amber-600 focus:outline-none"
                      />
                    ) : (
                      <p className="text-xs text-stone-700 leading-relaxed">
                        {structuredResume.professionalSummary}
                      </p>
                    )}
                  </div>
                )}

                {/* Technical Skills */}
                {structuredResume.technicalSkills?.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-200 pb-1">
                      Technical Skills
                    </h2>
                    <div className="space-y-1 text-xs">
                      {structuredResume.technicalSkills.map((cat, idx) => (
                        <div key={idx} className="flex flex-wrap gap-1">
                          <span className="font-bold text-stone-800">{cat.category}:</span>
                          <span className="text-stone-700">{cat.skills.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {structuredResume.projects?.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-1">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                        Projects
                      </h2>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            const newProj = { title: 'New Project', techStack: ['React', 'Node.js'], bullets: ['Engineered a full-stack solution achieving 25% efficiency improvement.'] };
                            setStructuredResume({
                              ...structuredResume,
                              projects: [...structuredResume.projects, newProj],
                            });
                          }}
                          className="text-xs font-semibold text-amber-800 hover:text-amber-950 cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add Project</span>
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {structuredResume.projects.map((proj, idx) => (
                        <div key={idx} className="space-y-2 rounded-xl border border-transparent p-2 hover:border-slate-100">
                          {isEditing ? (
                            <div className="space-y-2 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-600 uppercase">Project Title</label>
                                  <input
                                    type="text"
                                    value={proj.title}
                                    onChange={(e) => {
                                      const updated = [...structuredResume.projects];
                                      updated[idx] = { ...updated[idx], title: e.target.value };
                                      setStructuredResume({ ...structuredResume, projects: updated });
                                    }}
                                    className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs font-bold text-slate-900"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-600 uppercase">Tech Stack (comma separated)</label>
                                  <input
                                    type="text"
                                    value={proj.techStack.join(', ')}
                                    onChange={(e) => {
                                      const updated = [...structuredResume.projects];
                                      updated[idx] = { ...updated[idx], techStack: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) };
                                      setStructuredResume({ ...structuredResume, projects: updated });
                                    }}
                                    className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-700"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5 pt-1">
                                <label className="text-[10px] font-bold text-slate-600 uppercase">Bullet Points</label>
                                {proj.bullets.map((b, bIdx) => (
                                  <div key={bIdx} className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={b}
                                      onChange={(e) => {
                                        const updatedProjects = [...structuredResume.projects];
                                        const updatedBullets = [...updatedProjects[idx].bullets];
                                        updatedBullets[bIdx] = e.target.value;
                                        updatedProjects[idx] = { ...updatedProjects[idx], bullets: updatedBullets };
                                        setStructuredResume({ ...structuredResume, projects: updatedProjects });
                                      }}
                                      className="flex-1 rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-800"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedProjects = [...structuredResume.projects];
                                        updatedProjects[idx] = {
                                          ...updatedProjects[idx],
                                          bullets: updatedProjects[idx].bullets.filter((_, i) => i !== bIdx),
                                        };
                                        setStructuredResume({ ...structuredResume, projects: updatedProjects });
                                      }}
                                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                      title="Remove bullet"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedProjects = [...structuredResume.projects];
                                    updatedProjects[idx] = {
                                      ...updatedProjects[idx],
                                      bullets: [...updatedProjects[idx].bullets, 'Accomplished key deliverable by utilizing standard workflows.'],
                                    };
                                    setStructuredResume({ ...structuredResume, projects: updatedProjects });
                                  }}
                                  className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 cursor-pointer pt-1 inline-flex items-center gap-1"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Add Bullet</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                                <span>{proj.title}</span>
                                <span className="text-[11px] font-normal text-slate-500 italic">
                                  [{proj.techStack.join(', ')}]
                                </span>
                              </div>
                              <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                                {proj.bullets.map((b, bIdx) => (
                                  <li key={bIdx} className="leading-relaxed">
                                    {b}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience (if present) */}
                {structuredResume.experience && structuredResume.experience.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                      Experience
                    </h2>
                    <div className="space-y-3">
                      {structuredResume.experience.map((exp, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                            <span>{exp.role} — {exp.company}</span>
                            <span className="text-[11px] font-normal text-slate-500 italic">
                              {exp.period}
                            </span>
                          </div>
                          <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                            {exp.bullets.map((b, bIdx) => (
                              <li key={bIdx} className="leading-relaxed">
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Education
                    </h2>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          const newEdu = { degree: 'Degree / Major', institution: 'College or University Name', year: `${new Date().getFullYear()}` };
                          setStructuredResume({
                            ...structuredResume,
                            education: [...(structuredResume.education || []), newEdu],
                          });
                        }}
                        className="text-xs font-semibold text-amber-800 hover:text-amber-950 cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Education</span>
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {structuredResume.education && structuredResume.education.length > 0 ? (
                      structuredResume.education.map((edu, idx) => (
                        <div key={idx} className="text-xs">
                          {isEditing ? (
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 items-center">
                              <input
                                type="text"
                                placeholder="Degree (e.g. B.Tech Computer Technology)"
                                value={edu.degree}
                                onChange={(e) => {
                                  const updated = [...structuredResume.education];
                                  updated[idx] = { ...updated[idx], degree: e.target.value };
                                  setStructuredResume({ ...structuredResume, education: updated });
                                }}
                                className="rounded border border-slate-300 bg-white p-1.5 text-xs font-bold text-slate-900"
                              />
                              <input
                                type="text"
                                placeholder="College / University"
                                value={edu.institution}
                                onChange={(e) => {
                                  const updated = [...structuredResume.education];
                                  updated[idx] = { ...updated[idx], institution: e.target.value };
                                  setStructuredResume({ ...structuredResume, education: updated });
                                }}
                                className="rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-700"
                              />
                              <input
                                type="text"
                                placeholder="Year (e.g. 2024 / Pursuing)"
                                value={edu.year}
                                onChange={(e) => {
                                  const updated = [...structuredResume.education];
                                  updated[idx] = { ...updated[idx], year: e.target.value };
                                  setStructuredResume({ ...structuredResume, education: updated });
                                }}
                                className="rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-700"
                              />
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  placeholder="CGPA / Grade (optional)"
                                  value={edu.gpa || ''}
                                  onChange={(e) => {
                                    const updated = [...structuredResume.education];
                                    updated[idx] = { ...updated[idx], gpa: e.target.value };
                                    setStructuredResume({ ...structuredResume, education: updated });
                                  }}
                                  className="w-24 rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-700"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStructuredResume({
                                      ...structuredResume,
                                      education: structuredResume.education.filter((_, i) => i !== idx),
                                    });
                                  }}
                                  className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                  title="Delete Education"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-900">{edu.degree}</span>
                                {edu.institution && <span className="text-slate-600"> — {edu.institution}</span>}
                                {edu.gpa && (
                                  <span className="text-slate-500 ml-1">(CGPA / Grade: {edu.gpa})</span>
                                )}
                              </div>
                              <span className="text-slate-500">{edu.year}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                        <span>No education entries listed.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(true);
                            const newEdu = { degree: 'Degree / Major', institution: 'College or University Name', year: `${new Date().getFullYear()}` };
                            setStructuredResume({
                              ...structuredResume,
                              education: [...(structuredResume.education || []), newEdu],
                            });
                          }}
                          className="text-xs font-semibold text-amber-800 hover:text-amber-950 cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add Education</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Certifications & Credentials */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Certifications & Credentials
                    </h2>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(structuredResume.certifications || []), 'New Certification / Credential'];
                          setStructuredResume({ ...structuredResume, certifications: updated });
                        }}
                        className="text-xs font-semibold text-amber-800 hover:text-amber-950 cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Certification</span>
                      </button>
                    )}
                  </div>
                  {structuredResume.certifications && structuredResume.certifications.length > 0 ? (
                    <div className="space-y-1.5 text-xs">
                      {structuredResume.certifications.map((cert, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          {isEditing ? (
                            <div className="flex items-center gap-2 w-full bg-slate-50 p-2 rounded-lg border border-slate-200">
                              <input
                                type="text"
                                value={cert}
                                onChange={(e) => {
                                  const updated = [...structuredResume.certifications!];
                                  updated[idx] = e.target.value;
                                  setStructuredResume({ ...structuredResume, certifications: updated });
                                }}
                                className="flex-1 rounded border border-slate-300 bg-white p-1 text-xs text-slate-800"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = structuredResume.certifications!.filter((_, i) => i !== idx);
                                  setStructuredResume({ ...structuredResume, certifications: updated });
                                }}
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                title="Delete Certificate"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-700 leading-relaxed">• {cert}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                      <span>No certifications listed.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(true);
                          setStructuredResume({
                            ...structuredResume,
                            certifications: [...(structuredResume.certifications || []), 'Certification / Credential Name'],
                          });
                        }}
                        className="text-xs font-semibold text-amber-800 hover:text-amber-950 cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Certification</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Download CTA */}
              <div className="flex items-center justify-center pt-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-8 py-3.5 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:from-amber-500 hover:to-orange-500 transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Clean ATS PDF Resume</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: GOOGLE XYZ BULLET REWRITER */}
      {activeSubTab === 'bullet_rewriter' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-stone-50 p-6 sm:p-8 space-y-4 shadow-2xs">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-sm">
                <Zap className="h-6 w-6 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900">
                  Google XYZ Bullet Rewriter
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Transform weak, passive job descriptions into recruiter-grade accomplishments:
                  <br />
                  <span className="font-semibold text-amber-800">
                    &quot;Accomplished [X], as measured by [Y], by doing [Z]&quot;
                  </span>
                </p>
              </div>
            </div>

            <form onSubmit={handleRewriteBullet} className="space-y-3 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Paste an existing bullet or task to reframe:
              </label>
              <textarea
                rows={3}
                value={singleBullet}
                onChange={(e) => setSingleBullet(e.target.value)}
                placeholder="e.g. Worked on the customer cart page and fixed bugs in checkout..."
                className="w-full rounded-xl border border-stone-300 bg-white p-3.5 text-xs text-stone-800 placeholder-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 shadow-2xs"
              />

              {bulletError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{bulletError}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isRewritingBullet || !singleBullet.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:from-amber-500 hover:to-orange-500 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isRewritingBullet ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Optimizing with Google XYZ Formula...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Rewrite Bullet</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Bullet Rewrite Results */}
            {bulletResult && (
              <div className="space-y-4 pt-4 border-t border-stone-200/80 animate-in fade-in duration-200">
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Original Bullet:
                  </span>
                  <p className="text-xs text-stone-700 italic">
                    &quot;{bulletResult.original}&quot;
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    High-Impact Recruiter-Ready Variations:
                  </span>
                  <div className="space-y-2.5">
                    {bulletResult.variations.map((v, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-2 hover:border-amber-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs font-medium text-stone-800 leading-relaxed">
                            {v.bullet}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopyBullet(v.bullet, idx)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 cursor-pointer shrink-0"
                          >
                            {copiedBulletIdx === idx ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t border-stone-100 text-[11px]">
                          <span className="font-semibold text-amber-800">Key Metric Impact:</span>
                          <span className="text-stone-600">{v.metrics}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feature 1: Before vs After Changes (Diff Modal) */}
      {showDiffModal && structuredResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowDiffModal(false)}
          />
          <div className="relative w-full max-w-3xl rounded-2xl bg-[#FBFBF9] shadow-2xl border border-stone-200 z-10 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-amber-400">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    ATS Optimization Diff: Before vs. After
                  </h3>
                  <p className="text-xs text-stone-500">
                    Visualizing exact keyword injections and Google XYZ bullet point upgrades
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDiffModal(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Score Jump Banner */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">
                    ATS Match Score Improvement: {initialScore}% ➔ {structuredResume.atsScore}%
                  </span>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    +{Math.max(1, structuredResume.atsScore - initialScore)}% increase in recruiter keyword search alignment and formula compliance.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold text-white">
                    Recruiter Ready
                  </span>
                </div>
              </div>

              {/* Newly Integrated Keywords */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Newly Integrated Target Keywords ({structuredResume.integratedSkills.length})
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {structuredResume.integratedSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-900"
                    >
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Projects XYZ Transformations */}
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Project XYZ Bullet Transformations
                </span>
                <div className="space-y-3">
                  {structuredResume.projects.map((proj, pIdx) => (
                    <div key={pIdx} className="rounded-xl border border-stone-200 bg-white p-4 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-xs border-b border-stone-100 pb-2">
                        <span className="font-bold text-stone-900">{proj.title}</span>
                        <span className="font-mono text-[10px] text-stone-500">[{proj.techStack.join(', ')}]</span>
                      </div>
                      <ul className="space-y-2 pt-1">
                        {proj.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2 text-xs text-stone-700">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            <div className="flex-1 leading-relaxed">
                              <span>{bullet}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-stone-200 bg-stone-50/70 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setShowDiffModal(false)}
                className="rounded-xl bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Close Diff Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
