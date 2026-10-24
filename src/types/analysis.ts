export interface MatchedSkill {
  skill: string;
  category: string;
  context: string;
}

export interface MissingSkill {
  skill: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  reason: string;
}

export interface ResumeEvidence {
  claim: string;
  evidence: string;
  alignment: string;
}

export interface LearningRoadmapItem {
  milestone: string;
  timeframe: string;
  actionItems: string[];
  resourceSuggestion: string;
}

export interface InterviewQuestionItem {
  question: string;
  topic: string;
  expectedFocus: string;
  suggestedAnswer?: string;
}

export interface GeminiAnalysisResult {
  matchScore: number;
  matchedSkills: MatchedSkill[];
  missingSkills: MissingSkill[];
  resumeEvidence: ResumeEvidence[];
  recommendations: string[];
  learningRoadmap: LearningRoadmapItem[];
  interviewQuestions: InterviewQuestionItem[];
}

export interface AnalysisResponseMeta {
  resumeSource: string;
  extractedLength: number;
  analyzedAt: string;
  extractedResumeText?: string;
}

/** Represents one persisted analysis record returned by GET /api/analyses */
export interface SavedAnalysis {
  id: number;
  userId: number;
  jobTitle: string;
  companyName: string;
  matchScore: number;
  resumeSource: string;
  resumeText?: string;
  createdAt: string;
  matchedSkills: MatchedSkill[];
  missingSkills: MissingSkill[];
  resumeEvidence: ResumeEvidence[];
  recommendations: string[];
  learningRoadmap: LearningRoadmapItem[];
  interviewQuestions: InterviewQuestionItem[];
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
}

export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

export interface LearningTaskProgress {
  taskId: string;
  analysisId: number;
  jobTitle: string;
  companyName: string;
  milestone: string;
  timeframe: string;
  resourceSuggestion: string;
  title: string;
  status: TaskStatus;
  completedAt?: string | null;
  updatedAt?: string | null;
}

export interface ProgressSummary {
  totalTasks: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  completionPercentage: number;
  byAnalysis: {
    analysisId: number;
    jobTitle: string;
    companyName: string;
    total: number;
    completed: number;
    inProgress: number;
    percentage: number;
  }[];
}

// ─────────────────────────────────────────────
// New ATS Optimization & Career Prep Interfaces
// ─────────────────────────────────────────────

export interface ATSResumeResult {
  markdown: string;
  professionalSummary: string;
  integratedKeywords: string[];
  keyHighlights: string[];
  atsFormatTips: string[];
}

export interface BulletRewriteVariation {
  title: string;
  focus: string;
  bullet: string;
  actionVerb: string;
  metrics: string;
}

export interface BulletRewriteResult {
  original: string;
  variations: BulletRewriteVariation[];
  atsTips: string[];
}

export interface CoverLetterResult {
  letter: string;
  subjectLine: string;
  keyHooks: string[];
}

export interface InterviewEvaluationResult {
  score: number; // 1 - 10
  verdict: 'Strong Hire' | 'Hire' | 'Needs Practice' | 'Weak';
  strengths: string[];
  improvements: string[];
  missingKeywords: string[];
  upgradedAnswer: string;
}

export interface ATSStructuredResume {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  targetTitle: string;
  professionalSummary: string;
  technicalSkills: {
    category: string;
    skills: string[];
  }[];
  experience?: {
    company: string;
    role: string;
    period: string;
    location?: string;
    bullets: string[];
  }[];
  projects: {
    title: string;
    techStack: string[];
    link?: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
  }[];
  certifications?: string[];
  integratedSkills: string[];
  atsScore: number;
  originalScore?: number;
}

// ─────────────────────────────────────────────
// Additional Career Accelerator Tools
// ─────────────────────────────────────────────

export interface JDAnalysisResult {
  jobTitle: string;
  seniority: string;
  experienceRequirement: string;
  educationRequirement: string;
  mustHaveSkills: { skill: string; importance: 'Critical' | 'High'; category: string }[];
  niceToHaveSkills: string[];
  responsibilities: string[];
  techStack: string[];
  recruiterAdvice: string;
}

export interface ProfileAssetsResult {
  headlines: string[];
  aboutSummary: string;
  githubBio: string;
  pinnedProjects: { name: string; summary: string; tags: string[] }[];
}

export interface OutreachMessagesResult {
  connectionNote: string;
  recruiterInMail: string;
  coldEmail: { subject: string; body: string };
  thankYouFollowUp: string;
}
