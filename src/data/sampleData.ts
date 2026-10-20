/**
 * Realistic sample data for SkillBridge AI Student Career Dashboard.
 * Kept strictly isolated as preview/demonstration data.
 */

export interface RecentAnalysis {
  id: string;
  roleTitle: string;
  companyTarget: string;
  matchScore: number;
  dateAnalyzed: string;
  resumeFileName: string;
  matchedSkills: string[];
  missingSkills: string[];
  topRecommendation: string;
}

export interface SummaryMetric {
  title: string;
  value: string;
  changeText: string;
  isPositive: boolean;
  sublabel: string;
}

export const SAMPLE_DASHBOARD_METRICS: SummaryMetric[] = [
  {
    title: 'Total Resume Analyses',
    value: '8',
    changeText: '+3 this month',
    isPositive: true,
    sublabel: 'Across 4 target role types',
  },
  {
    title: 'Average Job Match',
    value: '84%',
    changeText: '+9% improvement',
    isPositive: true,
    sublabel: 'Compared to baseline scan',
  },
  {
    title: 'Skills to Improve',
    value: '5',
    changeText: '2 high-priority',
    isPositive: false,
    sublabel: 'Identified from job postings',
  },
  {
    title: 'Learning Tasks Completed',
    value: '12 / 16',
    changeText: '75% completed',
    isPositive: true,
    sublabel: 'Roadmap milestone progress',
  },
];

export const SAMPLE_RECENT_ANALYSES: RecentAnalysis[] = [
  {
    id: 'analysis-1',
    roleTitle: 'Junior Full-Stack Engineer',
    companyTarget: 'FinTech Labs (San Francisco, CA)',
    matchScore: 88,
    dateAnalyzed: 'Oct 14, 2026',
    resumeFileName: 'Alex_Chen_SWE_Resume_v3.pdf',
    matchedSkills: ['TypeScript', 'React 18', 'Node.js', 'REST APIs', 'PostgreSQL', 'Git Workflow'],
    missingSkills: ['Docker Containerization', 'Automated Unit Testing (Vitest/Jest)', 'AWS Lambda'],
    topRecommendation: 'Add unit tests for your REST API endpoints to demonstrate production-level software rigor.',
  },
  {
    id: 'analysis-2',
    roleTitle: 'Associate Frontend Developer',
    companyTarget: 'CloudScale Inc. (Remote)',
    matchScore: 92,
    dateAnalyzed: 'Oct 08, 2026',
    resumeFileName: 'Alex_Chen_Frontend_v2.pdf',
    matchedSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Responsive Layouts', 'State Management', 'Web Accessibility (a11y)'],
    missingSkills: ['Next.js SSR', 'Performance Profiling (Lighthouse)'],
    topRecommendation: 'Showcase Web Core Vitals metrics in your featured portfolio project description.',
  },
  {
    id: 'analysis-3',
    roleTitle: 'Data & Analytics Intern',
    companyTarget: 'Apex Insights (Austin, TX)',
    matchScore: 79,
    dateAnalyzed: 'Sep 28, 2026',
    resumeFileName: 'Alex_Chen_General_Resume.pdf',
    matchedSkills: ['Python', 'SQL Querying', 'Pandas', 'Data Visualization', 'Git'],
    missingSkills: ['Tableau / PowerBI', 'ETL Pipeline Modeling', 'Statistics for A/B Testing'],
    topRecommendation: 'Create a GitHub notebook walking through exploratory data analysis on a public dataset.',
  },
  {
    id: 'analysis-4',
    roleTitle: 'Junior Backend Developer',
    companyTarget: 'Streamline Systems (New York, NY)',
    matchScore: 81,
    dateAnalyzed: 'Sep 19, 2026',
    resumeFileName: 'Alex_Chen_Backend_v1.pdf',
    matchedSkills: ['Node.js', 'Express', 'SQL', 'Database Indexing', 'API Auth (JWT)'],
    missingSkills: ['Redis Caching', 'Microservices Architecture', 'Kubernetes Basics'],
    topRecommendation: 'Implement a Redis caching layer for heavy read queries in your portfolio backend service.',
  },
];

export const SAMPLE_ROADMAP_MILESTONES = [
  {
    title: 'Containerize Full-Stack App with Docker',
    category: 'DevOps & Tooling',
    status: 'In Progress',
    timeEstimate: '3 hours',
    description: 'Write a clean multi-stage Dockerfile and docker-compose.yml for your React + Node app.',
  },
  {
    title: 'Write Comprehensive Unit Tests with Vitest',
    category: 'Software Quality',
    status: 'Next Up',
    timeEstimate: '4 hours',
    description: 'Achieve 80%+ test coverage on core utility functions and API request handlers.',
  },
  {
    title: 'Optimize Core Web Vitals to 95+ on Lighthouse',
    category: 'Frontend Performance',
    status: 'Completed',
    timeEstimate: '2 hours',
    description: 'Reduce bundle size, lazy-load heavy modules, and optimize image rendering.',
  },
];

export const SAMPLE_INTERVIEW_QUESTIONS = [
  {
    question: 'How do you handle asynchronous error states in React and ensure clean user fallback UI?',
    category: 'Technical Architecture',
    relevance: 'Matched from your React & TypeScript experience',
  },
  {
    question: 'Describe how you would design a RESTful API endpoint that needs pagination and filtering.',
    category: 'API & Backend',
    relevance: 'Matched from your Node.js & Express projects',
  },
  {
    question: 'Walk through a challenging bug you encountered in a team project and how you diagnosed it.',
    category: 'Behavioral & Collaboration',
    relevance: 'Standard entry-level engineering behavioral screen',
  },
];
