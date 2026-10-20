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
}

/** Represents one persisted analysis record returned by GET /api/analyses */
export interface SavedAnalysis {
  id: number;
  jobTitle: string;
  companyName: string;
  matchScore: number;
  resumeSource: string;
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
