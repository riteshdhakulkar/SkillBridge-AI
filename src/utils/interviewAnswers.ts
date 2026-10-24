import { InterviewQuestionItem } from '../types/analysis';

/**
 * Returns a high-scoring, project-grounded model answer for an interview question.
 * Uses the AI-generated suggestedAnswer when available, or dynamically constructs
 * a project-grounded STAR-method response from the candidate's portfolio.
 */
export function getInterviewAnswer(q: InterviewQuestionItem): string {
  if (q.suggestedAnswer && q.suggestedAnswer.trim().length > 15) {
    return q.suggestedAnswer.trim();
  }

  const qLower = `${q.question} ${q.topic || ''} ${q.expectedFocus || ''}`.toLowerCase();

  // 1. TypeScript / React / Refactoring
  if (
    qLower.includes('typescript') ||
    (qLower.includes('convert') && qLower.includes('react')) ||
    qLower.includes('javascript to typescript') ||
    qLower.includes('mern e-commerce')
  ) {
    return 'I start by configuring tsconfig.json with strict compiler checks and defining centralized interfaces in a types/ directory for core entities (e.g., Product, CartItem, User, and Order). Next, I strongly type React component props (e.g., interface ProductCardProps) and hooks like useState<Product[]> and useReducer to eliminate implicit any types and invalid state transitions. Finally, I wrap all Axios or fetch API service calls in typed response promises (e.g., Promise<Product[]>), ensuring that API contract changes and property typos are caught during compile time rather than at runtime.';
  }

  // 2. Security / RBAC / JWT / Express routes
  if (
    qLower.includes('rbac') ||
    qLower.includes('role-based') ||
    qLower.includes('protect') ||
    qLower.includes('jwt') ||
    qLower.includes('token') ||
    qLower.includes('auth') ||
    qLower.includes('express security')
  ) {
    return 'In my Express backend, I implement modular middleware to authenticate and authorize requests. First, an authMiddleware extracts and verifies incoming JWT bearer tokens via jsonwebtoken, attaching the decoded user payload (id, role) to req.user. Second, I chain an authorizeRoles(...roles) guard that verifies whether req.user.role has permission for that endpoint (e.g., admin vs. customer). Requests failing verification immediately receive 401 Unauthorized or 403 Forbidden responses, keeping controller code clean and isolated from access control logic.';
  }

  // 3. Testing / Jest / Endpoints / Quality
  if (
    qLower.includes('test') ||
    qLower.includes('jest') ||
    qLower.includes('supertest') ||
    qLower.includes('endpoint') ||
    qLower.includes('reliability')
  ) {
    return 'I structure backend testing into unit tests and integration tests using Jest and Supertest. For API endpoints, I write integration suites that execute real HTTP calls against test routes: asserting expected status codes (200, 400, 401, 404), verifying JSON schema payloads, and testing edge cases like invalid input or expired tokens. I mock external 3rd-party dependencies and database connections where appropriate to ensure fast, deterministic CI/CD pipeline runs.';
  }

  // 4. Asynchronous / Gemini / AI / APIs
  if (
    qLower.includes('gemini') ||
    qLower.includes('async') ||
    qLower.includes('retailgenie') ||
    qLower.includes('ai')
  ) {
    return 'I encapsulate third-party AI calls in asynchronous controller functions using async/await with robust try/catch blocks. To handle intermittent network latency or rate limits (e.g., 429 or 503 errors), I implement automated retry logic with exponential backoff and graceful error responses. On the client side, I return clear, structured JSON error messages so the user interface provides transparent progress feedback instead of stalling.';
  }

  // 5. Database / MySQL / MongoDB / Indexing
  if (
    qLower.includes('database') ||
    qLower.includes('sql') ||
    qLower.includes('mongodb') ||
    qLower.includes('schema')
  ) {
    return 'I design schemas with explicit relational constraints, foreign keys with cascade rules, and indexes on frequently queried columns (such as userId and createdAt) to optimize lookup latency. For multi-step transactions, I wrap related queries in database transactions with rollback support to preserve data consistency and atomicity.';
  }

  // General fallback based on expected focus
  if (q.expectedFocus && q.expectedFocus.trim().length > 10) {
    return `In my projects, I address this by focusing on ${q.expectedFocus.trim().replace(/\.$/, '')}. I break the problem down into modular, single-responsibility services, validate input contracts upfront, and implement resilient error handling to guarantee production readiness.`;
  }

  return 'I structure my solution by defining clear interface contracts, separating concerns across modular services, and testing critical execution paths to ensure robustness and scalability.';
}

