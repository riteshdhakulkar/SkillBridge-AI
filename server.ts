import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createRequire } from 'module';
import { randomBytes, createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import zlib from 'zlib';
import {
  initDb,
  query,
  queryOne,
  execute,
  closeDb,
  createSessionStore,
  CREATED_AT_ISO,
  parseJson,
} from './db';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

// ─────────────────────────────────────────────
// MySQL database initialisation
// ─────────────────────────────────────────────
// The schema lives in schema.sql and is applied on boot. Every statement is
// CREATE ... IF NOT EXISTS, so this is idempotent and safe to run every time.
initDb().catch((err) => {
  console.error('Database initialisation failed:', err?.message || err);
  process.exit(1);
});

// ─────────────────────────────────────────────
// Session secret resolution
// ─────────────────────────────────────────────
// A hardcoded secret lets anyone who can read the source (e.g. a public repo)
// forge valid session cookies. Require SESSION_SECRET in production; fall back
// to an ephemeral random secret in development so sessions reset on restart.
const SESSION_SECRET = process.env.SESSION_SECRET?.trim();

if (!SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SESSION_SECRET environment variable is required in production. Generate one with: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
  }
  console.warn(
    '[Security] SESSION_SECRET is not set - using an ephemeral development secret. ' +
      'Sessions will be invalidated on every server restart. Set SESSION_SECRET in .env for stable sessions.'
  );
}

const sessionSecret = SESSION_SECRET || randomBytes(48).toString('hex');

// Configure express-session
app.use(
  session({
    secret: sessionSecret,
    // Persist sessions in MySQL instead of the process heap. The default
    // MemoryStore signs every user out on restart and cannot be shared
    // between instances.
    store: createSessionStore(session),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // require HTTPS in production
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  })
);

// Allow payloads up to 50MB for PDF/DOCX base64 handling
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure Express body-parser and JSON syntax errors return clean JSON, never HTML
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    console.error('Body parser error:', err.message);
    if (err.type === 'entity.too.large') {
      return res.status(413).json({
        error: 'The uploaded file or request payload is too large. Please upload a smaller document or paste your resume text.',
      });
    }
    return res.status(err.status || 400).json({
      error: `Invalid request payload: ${err.message || 'Malformed body'}`,
    });
  }
  next();
});

// Helper function to safely strip any Data URI prefix and decode base64 file payloads
function decodeBase64File(fileBase64: string): Buffer {
  if (!fileBase64) return Buffer.alloc(0);
  const cleanBase64 = fileBase64.includes(';base64,')
    ? fileBase64.split(';base64,').pop()!
    : fileBase64.replace(/^data:[^,]+,/, '');
  return Buffer.from(cleanBase64.trim(), 'base64');
}

// Fallback extractor that reads uncompressed and flate-compressed PDF text streams directly
function extractRawTextFromPdfBuffer(buffer: Buffer): string {
  try {
    const binary = buffer.toString('latin1');
    const chunks: string[] = [];
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match: RegExpExecArray | null;

    while ((match = streamRegex.exec(binary)) !== null) {
      let dataStr = match[1];
      try {
        const inflated = zlib.inflateSync(Buffer.from(dataStr, 'latin1')).toString('latin1');
        dataStr = inflated;
      } catch {
        // Not compressed with flate/zlib, keep raw string
      }

      // Match single text blocks: (Text) Tj
      const tjMatches = dataStr.match(/\(([^)]+)\)\s*Tj/g);
      if (tjMatches) {
        chunks.push(tjMatches.map((s) => s.replace(/^\(|\)\s*Tj$/g, '')).join(' '));
      }

      // Match grouped text array blocks: [(T) 10 (ext)] TJ
      const arrayTj = dataStr.match(/\[(.*?)\]\s*TJ/g);
      if (arrayTj) {
        arrayTj.forEach((block) => {
          const inner = [...block.matchAll(/\(([^)]*)\)/g)].map((x) => x[1]).join('');
          if (inner) chunks.push(inner);
        });
      }
    }

    return chunks.join('\n').trim();
  } catch (err) {
    return '';
  }
}

// Helper function to safely extract text from PDF or Word (.docx/.doc) document buffer
async function extractTextFromDocument(buffer: Buffer, fileName: string): Promise<string> {
  const lowerName = (fileName || '').toLowerCase();

  // Handle Word Documents (.docx, .doc)
  if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result?.value?.trim() || '';
      return text;
    } catch (docxErr: any) {
      console.error('Word extraction error:', docxErr);
      throw new Error('Failed to parse Word document (.docx/.doc).');
    }
  }

  // Handle PDF Documents
  // 1. First attempt: Pass Uint8Array to pdfParse to prevent Node.js Buffer pool offset crashes (bad XRef entry)
  try {
    const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const data = await pdfParse(uint8);
    const text = data?.text?.trim() || '';
    if (text.length >= 20) {
      return text;
    }
  } catch (error: any) {
    console.warn('pdf-parse Uint8Array extraction warning:', error?.message || error);
  }

  // 2. Secondary attempt: Pass Buffer directly to pdfParse
  try {
    const data = await pdfParse(buffer);
    const text = data?.text?.trim() || '';
    if (text.length >= 20) {
      return text;
    }
  } catch (directErr: any) {
    // Continue to stream fallback
  }

  // 3. Resilient Fallback: Extract text from PDF content streams directly (handles edge-case PDFs and custom jsPDF formats)
  try {
    const streamText = extractRawTextFromPdfBuffer(buffer);
    if (streamText && streamText.length >= 20) {
      return streamText;
    }
  } catch (rawErr: any) {
    console.warn('Stream PDF text extraction fallback warning:', rawErr);
  }

  throw new Error('Failed to parse PDF document.');
}

// ─────────────────────────────────────────────
// Universal Heuristic Resume Extractors (Grounded Fallbacks)
// ─────────────────────────────────────────────

// Extract contact details and identity from raw resume text
function extractPersonalInfoFromText(text: string, fallbackName = 'Candidate', fallbackEmail = '') {
  if (!text) {
    return { fullName: fallbackName, email: fallbackEmail, phone: '', location: '', linkedin: '', github: '', portfolio: '' };
  }
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let detectedName = fallbackName;
  for (const line of lines.slice(0, 5)) {
    if (
      !/^(?:curriculum vitae|resume|cv|biodata|contact|profile|personal info|page \d)/i.test(line) &&
      line.length < 50 &&
      !line.includes('@') &&
      !/\d{5,}/.test(line)
    ) {
      const cleanLine = line.replace(/[^a-zA-Z\s.'-]/g, '').trim();
      if (cleanLine.length >= 3 && cleanLine.split(/\s+/).length <= 4) {
        detectedName = cleanLine;
        break;
      }
    }
  }

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  const portfolioMatch = text.match(/(?:https?:\/\/)?([a-zA-Z0-9_-]+\.(?:vercel\.app|netlify\.app|github\.io|dev|me))/i);

  let location = '';
  for (const line of lines.slice(0, 8)) {
    const locMatch = line.match(/\b([A-Z][a-zA-Z\s]{2,20},\s*[A-Z][a-zA-Z\s]{2,20})\b/);
    if (locMatch && !locMatch[1].toLowerCase().includes('university') && !locMatch[1].toLowerCase().includes('college')) {
      location = locMatch[1];
      break;
    }
  }

  return {
    fullName: detectedName,
    email: emailMatch ? emailMatch[0] : fallbackEmail,
    phone: phoneMatch ? phoneMatch[0] : '',
    location,
    linkedin: linkedinMatch ? linkedinMatch[0] : '',
    github: githubMatch ? githubMatch[0] : '',
    portfolio: portfolioMatch ? portfolioMatch[0] : '',
  };
}

// Extract Education entries from raw resume text
function extractEducationFromText(text: string): { degree: string; institution: string; year: string; gpa?: string }[] {
  const education: { degree: string; institution: string; year: string; gpa?: string }[] = [];
  if (!text) return education;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const eduStartIdx = lines.findIndex((l) =>
    /^(?:education|academic background|academics|qualifications|educational qualifications?)/i.test(l)
  );

  const degreeRegex = /\b(B\.?Tech|B\.?E\.?|Bachelor(?:'s)?(?:\s+of\s+[A-Za-z\s]+)?|B\.?Sc|B\.?S\.?|BCA|M\.?Tech|M\.?E\.?|Master(?:'s)?(?:\s+of\s+[A-Za-z\s]+)?|M\.?Sc|M\.?S\.?|MCA|MBA|Ph\.?D|Diploma|Associate|HSC|SSC|Higher Secondary|Senior Secondary|High School)\b/i;
  const yearRegex = /\b(19\d{2}|20\d{2})\s*(?:[-–—to]+\s*(19\d{2}|20\d{2}|Present|Pursuing))?\b/i;
  const gpaRegex = /(?:CGPA|GPA|Percentage|Score|Grade)[:\s]*([0-9.]+(?:\s*\/[0-9.]+|\s*%)?)/i;

  if (eduStartIdx !== -1) {
    let currentIdx = eduStartIdx + 1;
    const sectionLines: string[] = [];
    while (currentIdx < lines.length) {
      const line = lines[currentIdx];
      if (/^(?:experience|projects|skills|technical skills|certifications|certificates|achievements|languages|interests|summary|objective)/i.test(line)) {
        break;
      }
      sectionLines.push(line);
      currentIdx++;
    }

    for (let i = 0; i < sectionLines.length; i++) {
      const line = sectionLines[i];
      if (degreeRegex.test(line)) {
        let degree = line.replace(/\|.*$/, '').trim();
        let institution = '';
        let year = '';
        let gpa = '';

        const yMatch = line.match(yearRegex);
        if (yMatch) {
          year = yMatch[0];
          degree = degree.replace(yearRegex, '').replace(/\|/g, '').trim();
        }

        const gMatch = line.match(gpaRegex);
        if (gMatch) {
          gpa = gMatch[1];
          degree = degree.replace(gpaRegex, '').replace(/\|/g, '').trim();
        }

        const pipeParts = line.split(/[|•–—]/).map((s) => s.trim()).filter(Boolean);
        if (pipeParts.length > 1) {
          for (const p of pipeParts.slice(1)) {
            if (!yearRegex.test(p) && !gpaRegex.test(p) && p.length > 3) {
              institution = p;
              break;
            }
          }
        }

        if (!institution && i + 1 < sectionLines.length && !degreeRegex.test(sectionLines[i + 1])) {
          let instLine = sectionLines[i + 1];
          if (!year) {
            const nyMatch = instLine.match(yearRegex);
            if (nyMatch) year = nyMatch[0];
          }
          if (!gpa) {
            const ngMatch = instLine.match(gpaRegex);
            if (ngMatch) gpa = ngMatch[1];
          }
          const pctMatch = instLine.match(/\b\d{1,2}(?:\.\d+)?%/);
          if (pctMatch && !gpa) {
            gpa = pctMatch[0];
          }

          instLine = instLine
            .replace(yearRegex, '')
            .replace(gpaRegex, '')
            .replace(/\b\d{1,2}(?:\.\d+)?%/, '')
            .replace(/\((?:Pursuing|Completed|Ongoing)\)/i, '')
            .replace(/\b(?:Pursuing|Completed|Ongoing)\b/i, '')
            .replace(/[|•–—]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          institution = instLine;
          i++;
        }

        education.push({ degree, institution, year, gpa });
      }
    }
  }

  // Fallback: search entire text for degree lines if no explicit section header was found
  if (education.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (degreeRegex.test(line) && !/^(?:experience|projects|skills|summary|objective)/i.test(line)) {
        let degree = line.trim();
        let institution = '';
        let year = '';
        let gpa = '';
        const yMatch = line.match(yearRegex);
        if (yMatch) year = yMatch[0];
        const gMatch = line.match(gpaRegex);
        if (gMatch) gpa = gMatch[1];
        if (i + 1 < lines.length && !degreeRegex.test(lines[i + 1]) && lines[i + 1].length < 100) {
          institution = lines[i + 1].trim();
        }
        education.push({ degree, institution, year, gpa });
        if (education.length >= 3) break;
      }
    }
  }

  return education;
}

// Extract Certifications & Credentials from raw resume text
function extractCertificationsFromText(text: string): string[] {
  const certifications: string[] = [];
  if (!text) return certifications;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const certStartIdx = lines.findIndex((l) =>
    /^(?:certifications?|certificates?|licenses?|credentials?|courses?|training)/i.test(l)
  );

  if (certStartIdx !== -1) {
    let currentIdx = certStartIdx + 1;
    while (currentIdx < lines.length) {
      const line = lines[currentIdx];
      if (/^(?:experience|projects|skills|technical skills|education|academic|achievements|languages|interests|summary|objective)/i.test(line)) {
        break;
      }
      const cleaned = line.replace(/^[•*\-\d.)\s]+/, '').trim();
      if (cleaned.length > 2) {
        if (cleaned.includes(',') && !cleaned.includes('http')) {
          cleaned
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 3)
            .forEach((c) => certifications.push(c));
        } else {
          certifications.push(cleaned);
        }
      }
      currentIdx++;
    }
  }

  // Search for well-known certification patterns if empty
  if (certifications.length === 0) {
    const certKeywords = [
      /AWS Certified[A-Za-z0-9\s–-]+/gi,
      /Google Cloud Certified[A-Za-z0-9\s–-]+/gi,
      /Azure\s+[A-Za-z0-9\s–-]+Certification/gi,
      /Meta\s+[A-Za-z0-9\s–-]+Professional Certificate/gi,
      /Java SE\s*[-–—:]?[A-Za-z0-9\s]+/gi,
      /Java EE\s*[-–—:]?[A-Za-z0-9\s]+/gi,
      /Spring Framework\s*(?:&|and)?\s*Spring Boot[A-Za-z0-9\s]*/gi,
      /Frontend Development[A-Za-z0-9\s(),]+/gi,
      /Full Stack Web Development[A-Za-z0-9\s(),]*/gi,
      /Certified Kubernetes[A-Za-z0-9\s]+/gi,
    ];

    for (const pat of certKeywords) {
      const matches = text.match(pat);
      if (matches) {
        matches.forEach((m) => {
          const trimmed = m.trim();
          if (trimmed.length > 4 && !certifications.includes(trimmed)) {
            certifications.push(trimmed);
          }
        });
      }
    }
  }

  return certifications;
}

// ─────────────────────────────────────────────
// Authentication API Routes
// ─────────────────────────────────────────────

// Auth responses must never be cached. Without this the browser can serve a
// stale "logged in" (or "logged out") response straight from its HTTP cache
// after the session has actually changed, which is exactly what happened
// when this was first tested.
app.use('/api/auth', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Rate limit the credential endpoints. Without this, /api/auth/login can be
// brute forced against the MySQL users table at full speed.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 attempts per IP per window
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many attempts. Please wait 15 minutes and try again.',
  },
});

// A separate, tighter budget for signup so an attacker cannot mass-create
// accounts without hitting the login limit.
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5, // 5 signups per IP per hour
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many accounts created from this address. Please try again later.',
  },
});

// Helper to sanitize user object (exclude password)
function sanitizeUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    createdAt: user.createdAt,
  };
}

/** POST /api/auth/signup */
app.post('/api/auth/signup', signupLimiter, async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Please provide a valid full name (at least 2 characters).' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please log in.' });
    }

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await execute(
      'INSERT INTO users (fullName, email, password) VALUES (?, ?, ?)',
      [fullName.trim(), cleanEmail, hashedPassword]
    );
    const userId = Number(result.insertId);

    const newUser = await queryOne(
      `SELECT id, fullName, email, ${CREATED_AT_ISO} FROM users WHERE id = ?`,
      [userId]
    );

    // Automatically log in the user by setting session
    (req.session as any).userId = userId;

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: sanitizeUser(newUser),
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error during signup.' });
  }
});

/** POST /api/auth/login */
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user: any = await queryOne(
      `SELECT id, fullName, email, password, ${CREATED_AT_ISO} FROM users WHERE email = ?`,
      [cleanEmail]
    );

    if (!user) {
      return res.status(401).json({ error: 'User not found. No account is registered with this email address. Please sign up.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    // Set session
    (req.session as any).userId = user.id;

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/** POST /api/auth/logout */
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to log out.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: 'Logged out successfully.' });
  });
});

/** GET /api/auth/me */
app.get('/api/auth/me', async (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  try {
    const user = await queryOne(
      `SELECT id, fullName, email, ${CREATED_AT_ISO} FROM users WHERE id = ?`,
      [userId]
    );
    if (!user) {
      return res.status(401).json({ error: 'User session invalid.' });
    }
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (err: any) {
    console.error('GET /api/auth/me error:', err);
    return res.status(500).json({ error: 'Failed to verify session.' });
  }
});

// ─────────────────────────────────────────────

function getGeminiClient(): GoogleGenAI {
  const candidateKeys = [
    process.env.GEMINI_API_KEY,
    process.env.resumeAnalyzer,
    process.env.RESUME_ANALYZER,
    process.env.RESUMEANALYZER,
  ].filter((k): k is string => typeof k === 'string' && k.trim().length > 0 && k !== 'MY_GEMINI_API_KEY');

  const apiKey = candidateKeys[0];
  if (!apiKey) {
    throw new Error('Gemini API key is not configured on the server. Please check your GEMINI_API_KEY setting.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Resume Analysis API Endpoint
// ─────────────────────────────────────────────
/** In-memory rapid-access cache for recent analyses: key is `${userId}_${contentHash}` */
const analysisMemoryCache = new Map<string, { data: any; savedId: number | null; meta: any; timestamp: number }>();

function computeAnalysisFingerprint(resumeText: string, jobDescription: string): string {
  const normResume = resumeText.trim().replace(/\s+/g, ' ').toLowerCase();
  const normJD = jobDescription.trim().replace(/\s+/g, ' ').toLowerCase();
  return createHash('sha256').update(`${normResume}:::${normJD}`).digest('hex');
}

/**
 * Calibrates match score deterministically based on verified skills evidence.
 * Guarantees reproducibility and mathematical consistency across evaluations.
 */
function calibrateDeterministicScore(rawScore: number, matchedSkills: any[], missingSkills: any[]): number {
  const m = Array.isArray(matchedSkills) ? matchedSkills.length : 0;
  const miss = Array.isArray(missingSkills) ? missingSkills.length : 0;
  const total = m + miss;
  
  if (total === 0) {
    return Math.min(Math.max(rawScore || 50, 10), 95);
  }

  let highGaps = 0;
  let medGaps = 0;
  let lowGaps = 0;
  if (Array.isArray(missingSkills)) {
    for (const s of missingSkills) {
      const prio = String(s.priority || '').toLowerCase();
      if (prio === 'high') highGaps++;
      else if (prio === 'medium') medGaps++;
      else lowGaps++;
    }
  }

  // Objective weighted formula:
  const ratioScore = (m / total) * 100;
  const gapPenalty = (highGaps * 12) + (medGaps * 6) + (lowGaps * 3);
  const baseCalculated = Math.max(10, Math.min(95, Math.round(ratioScore - (gapPenalty * 0.3))));
  
  // Blend 75% mathematical objective score + 25% model nuanced score
  let finalScore = Math.round(baseCalculated * 0.75 + (rawScore || baseCalculated) * 0.25);

  if (m === 0 && miss > 0) return Math.min(finalScore, 20);
  if (highGaps >= 3 && finalScore > 70) finalScore = 70;
  if (miss === 0 && m > 0) return Math.max(finalScore, 95);

  return Math.min(Math.max(finalScore, 10), 98);
}

app.post('/api/analyze-resume', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'You must be logged in to analyze resumes and save history.' });
    }

    const {
      resumeFileBase64,
      resumeFileName,
      resumePdfBase64,
      resumePdfName,
      resumeText,
      jobDescription,
    } = req.body;

    const fileBase64 = resumeFileBase64 || resumePdfBase64;
    const fileName = resumeFileName || resumePdfName || 'resume.pdf';

    // Validate job description
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 15) {
      return res.status(400).json({
        error: 'Please provide a valid job description (at least 15 characters).',
      });
    }

    let finalResumeText = '';

    // If file upload is provided (PDF or Word), extract text from it first
    if (fileBase64) {
      try {
        const docBuffer = decodeBase64File(fileBase64);
        const extractedText = await extractTextFromDocument(docBuffer, fileName);

        if (!extractedText || extractedText.length < 30) {
          const fileTypeLabel = fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc')
            ? 'Word document'
            : 'PDF';
          return res.status(400).json({
            error:
              `Unable to extract readable text from the uploaded ${fileTypeLabel}. The file may be empty, an image-only scan without selectable text, or password-protected. Please upload a readable file or paste your resume text directly.`,
          });
        }

        finalResumeText = extractedText;
      } catch (err: any) {
        return res.status(400).json({
          error:
            `Unable to process the uploaded file (${fileName}). Please ensure it is a valid, uncorrupted PDF or Word document (.docx), or paste your resume text.`,
        });
      }
    } else if (resumeText && typeof resumeText === 'string' && resumeText.trim().length >= 20) {
      // Pasted resume text alternative
      finalResumeText = resumeText.trim();
    } else {
      return res.status(400).json({
        error: 'Please provide your resume by uploading a PDF or Word document, or pasting the resume text.',
      });
    }

    const contentHash = computeAnalysisFingerprint(finalResumeText, jobDescription);

    // Fast Cache Hit check: returns instantly (< 20ms) with deterministic, exact same results
    if (!req.body.forceRefresh) {
      const memoryHit = analysisMemoryCache.get(`${userId}_${contentHash}`);
      if (memoryHit) {
        return res.json({
          success: true,
          data: memoryHit.data,
          savedId: memoryHit.savedId,
          cached: true,
          meta: {
            resumeSource: memoryHit.meta?.resumeSource || (fileBase64 ? fileName : 'Pasted Text'),
            extractedLength: finalResumeText.length,
            extractedResumeText: finalResumeText,
            analyzedAt: memoryHit.meta?.analyzedAt || new Date().toISOString(),
          },
        });
      }

      try {
        const existing = await queryOne(
          `SELECT id, userId, jobTitle, companyName, matchScore, resumeSource,
                  ${CREATED_AT_ISO},
                  matchedSkills, missingSkills, resumeEvidence,
                  recommendations, learningRoadmap, interviewQuestions
             FROM analyses
            WHERE userId = ? AND contentHash = ?
            ORDER BY id DESC LIMIT 1`,
          [userId, contentHash]
        );

        if (existing) {
          const formatted = rowToAnalysis(existing);
          analysisMemoryCache.set(`${userId}_${contentHash}`, {
            data: formatted,
            savedId: existing.id,
            meta: {
              resumeSource: existing.resumeSource,
              extractedLength: finalResumeText.length,
            extractedResumeText: finalResumeText,
              analyzedAt: existing.createdAt,
            },
            timestamp: Date.now(),
          });

          return res.json({
            success: true,
            data: formatted,
            savedId: existing.id,
            cached: true,
            meta: {
              resumeSource: existing.resumeSource,
              extractedLength: finalResumeText.length,
            extractedResumeText: finalResumeText,
              analyzedAt: existing.createdAt,
            },
          });
        }
      } catch (cacheErr) {
        console.warn('Cache lookup warning (proceeding with live evaluation):', cacheErr);
      }
    }


    // Check Gemini API key configuration
    const candidateKeys = [
      process.env.GEMINI_API_KEY,
      process.env.resumeAnalyzer,
      process.env.RESUME_ANALYZER,
      process.env.RESUMEANALYZER,
    ].filter((k): k is string => typeof k === 'string' && k.trim().length > 0 && k !== 'MY_GEMINI_API_KEY');

    const apiKey = candidateKeys[0];

    if (!apiKey) {
      return res.status(503).json({
        error:
          'Gemini API key is not configured on the server. Please ensure your secret (GEMINI_API_KEY or resumeAnalyzer) is added in the AI Studio Settings > Secrets panel.',
      });
    }

    // Initialize GoogleGenAI SDK with user agent telemetry
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `You are a senior technical hiring manager and career advisor.
Your job is to rigorously, honestly, and constructively evaluate a candidate's actual resume against a target job description.
Follow these rules strictly:
1. Ground all analysis strictly in the provided candidate resume text and target job description. Never hallucinate skills or work experiences that are not present.
2. Calculate a realistic matchScore between 0 and 100 based on core requirements overlap (e.g. required vs nice-to-have, years of experience, relevant tech stack).
3. Identify true matchedSkills (with context showing where in the resume it was found) and critical missingSkills (with priority and hiring importance).
4. Extract specific resumeEvidence claims directly from their projects or work bullets.
5. Provide high-impact recommendations to improve the resume for this position.
6. Generate a targeted, realistic learningRoadmap to bridge missing qualifications.
7. Provide custom interviewQuestions tailored directly to the candidate's actual resume projects and potential weak spots.
Return structured JSON only matching the schema.`;

    const userPrompt = `Please evaluate the following candidate resume against the target job description:

=== CANDIDATE RESUME ===
${finalResumeText}

=== TARGET JOB DESCRIPTION ===
${jobDescription.trim()}`;

    // Call Gemini with high-speed models and automatic fallback
    const candidateModels = [
      'gemini-3-flash-preview',
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.1-flash-lite',
    ];
    let lastError: any = null;
    let responseText: string | undefined = undefined;

    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const config: any = {
            systemInstruction,
            temperature: 0.0,
            seed: 42,
            responseMimeType: 'application/json',
          };
          // Only gemini-2.5-flash supports thinkingBudget
          if (modelName.includes('2.5')) {
            config.thinkingConfig = { thinkingBudget: 0 };
          }
          const response = await ai.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
              ...config,
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  matchScore: {
                    type: Type.INTEGER,
                    description: 'Overall job compatibility score between 0 and 100.',
                  },
                  matchedSkills: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        skill: { type: Type.STRING },
                        category: { type: Type.STRING },
                        context: {
                          type: Type.STRING,
                          description: 'Where or how this skill was evidenced in the resume.',
                        },
                      },
                      required: ['skill', 'category', 'context'],
                    },
                    description: 'Competencies evidenced in the resume matching the job.',
                  },
                  missingSkills: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        skill: { type: Type.STRING },
                        priority: { type: Type.STRING, description: 'High, Medium, or Low' },
                        reason: { type: Type.STRING, description: 'Why this is critical for the job.' },
                      },
                      required: ['skill', 'priority', 'reason'],
                    },
                    description: 'Key requirements in the job description missing from the resume.',
                  },
                  resumeEvidence: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        claim: { type: Type.STRING },
                        evidence: { type: Type.STRING },
                        alignment: { type: Type.STRING },
                      },
                      required: ['claim', 'evidence', 'alignment'],
                    },
                    description: 'Actual achievements or project claims from the resume.',
                  },
                  recommendations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Concrete, actionable steps to boost interview callback rate.',
                  },
                  learningRoadmap: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        milestone: { type: Type.STRING },
                        timeframe: { type: Type.STRING },
                        actionItems: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        resourceSuggestion: { type: Type.STRING },
                      },
                      required: ['milestone', 'timeframe', 'actionItems', 'resourceSuggestion'],
                    },
                    description: 'Actionable learning plan to close skill gaps.',
                  },
                  interviewQuestions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        topic: { type: Type.STRING },
                        expectedFocus: { type: Type.STRING },
                        suggestedAnswer: {
                          type: Type.STRING,
                          description: 'A structured, concise model answer demonstrating how the candidate should answer this question based on their actual project experience.',
                        },
                      },
                      required: ['question', 'topic', 'expectedFocus', 'suggestedAnswer'],
                    },
                    description: 'Realistic interview questions based on the candidate profile with model answers.',
                  },
                },
                required: [
                  'matchScore',
                  'matchedSkills',
                  'missingSkills',
                  'resumeEvidence',
                  'recommendations',
                  'learningRoadmap',
                  'interviewQuestions',
                ],
              },
            },
          });

          responseText = response.text;
          if (responseText && responseText.trim().length > 0) {
            break;
          }
        } catch (modelErr: any) {
          lastError = modelErr;
          const errMsg = modelErr?.message || String(modelErr);
          const isUnavailable = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand');
          
          if (isUnavailable && attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
            continue;
          } else {
            break;
          }
        }
      }

      if (responseText) {
        break;
      }
    }

    if (!responseText) {
      throw lastError || new Error('Empty response received from Gemini model.');
    }

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini response as JSON:', responseText);
      throw new Error('Gemini model output could not be parsed as valid JSON.');
    }

    // ─── Persist the analysis to SQLite with userId ───────────────────────────
    const jdLines = jobDescription.trim().split('\n').map((l: string) => l.trim()).filter(Boolean);
    const titleLine  = jdLines.find((l: string) => /^role[:\s]/i.test(l))   || jdLines[0] || 'Unknown Role';
    const companyLine = jdLines.find((l: string) => /^company[:\s]/i.test(l)) || '';
    const jobTitle   = titleLine.replace(/^role[:\s]*/i, '').trim().slice(0, 200);
    const companyName = companyLine.replace(/^company[:\s]*/i, '').trim().slice(0, 200);
    const resumeSource = fileBase64 ? fileName : 'Pasted Text';

    let savedId: number | null = null;
    try {
      const result = await execute(
        `INSERT INTO analyses
          (userId, jobTitle, companyName, matchScore, resumeSource,
           matchedSkills, missingSkills, resumeEvidence,
           recommendations, learningRoadmap, interviewQuestions, resumeText)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          jobTitle,
          companyName,
          parsedResult.matchScore ?? 0,
          resumeSource,
          JSON.stringify(parsedResult.matchedSkills ?? []),
          JSON.stringify(parsedResult.missingSkills ?? []),
          JSON.stringify(parsedResult.resumeEvidence ?? []),
          JSON.stringify(parsedResult.recommendations ?? []),
          JSON.stringify(parsedResult.learningRoadmap ?? []),
          JSON.stringify(parsedResult.interviewQuestions ?? []),
          finalResumeText,
        ]
      );
      savedId = Number(result.insertId);
    } catch (dbErr) {
      console.error('Failed to save analysis to MySQL:', dbErr);
    }
    // ──────────────────────────────────────────────────────────────────────────

    return res.status(200).json({
      success: true,
      data: parsedResult,
      savedId,
      meta: {
        resumeSource,
        extractedLength: finalResumeText.length,
            extractedResumeText: finalResumeText,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in /api/analyze-resume:', error);
    const errorMessage = error?.message || String(error);

    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
      return res.status(429).json({
        error: 'Gemini API quota or rate limit exceeded. Please wait a few moments and try again.',
      });
    }

    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('invalid api key')) {
      return res.status(401).json({
        error: 'Invalid Gemini API key. Please check your GEMINI_API_KEY configuration in Settings > Secrets.',
      });
    }

    return res.status(500).json({
      error: `Resume analysis failed: ${error?.message || 'Unexpected server error occurred. Please try again.'}`,
    });
  }
});

// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// ATS Resume Optimizer & Rewriter Endpoints
// ─────────────────────────────────────────────

/** POST /api/generate-ats-resume - Interactive gap-confirmed structured ATS Resume Generator */
app.post('/api/generate-ats-resume', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'You must be logged in to generate ATS resumes.' });
    }

    const { resumeText, jobDescription, targetRole, confirmedSkills, analysisId } = req.body;
    if (!jobDescription) {
      return res.status(400).json({ error: 'Target job description is required.' });
    }

    // 1. Fetch user profile
    const user = await queryOne('SELECT fullName, email FROM users WHERE id = ?', [userId]);

    // 2. Fetch analysis record to get real resumeText, resumeEvidence, and matchedSkills
    const parsedAnalysisId = analysisId ? parseInt(analysisId, 10) : null;
    const analysisRow = await queryOne(
      `SELECT id, resumeSource, resumeText, resumeEvidence, matchedSkills, missingSkills
         FROM analyses
        WHERE userId = ? ${parsedAnalysisId ? 'AND id = ?' : ''}
        ORDER BY id DESC LIMIT 1`,
      parsedAnalysisId ? [userId, parsedAnalysisId] : [userId]
    );

    // Determine the most accurate source resume text
    let effectiveResumeText = (resumeText && resumeText.trim() !== 'Candidate Resume Evidence' && resumeText.trim().length > 50)
      ? resumeText.trim()
      : (analysisRow?.resumeText && analysisRow.resumeText.length > 50 ? analysisRow.resumeText.trim() : '');

    // Extract real personal info grounded directly from the resume text
    const detectedInfo = extractPersonalInfoFromText(effectiveResumeText, user?.fullName || 'Candidate', user?.email || '');
    const candidateName = detectedInfo.fullName || user?.fullName || 'Candidate';
    const candidateEmail = detectedInfo.email || user?.email || '';

    // If text was not stored in older rows, synthesize grounded resume text from actual database evidence
    if (!effectiveResumeText && analysisRow) {
      const evidence = parseJson(analysisRow.resumeEvidence, []);
      const matched = parseJson(analysisRow.matchedSkills, []);
      const phoneFromFilename = analysisRow.resumeSource?.match(/\d{10}/)?.[0] || '';

      effectiveResumeText = `Candidate Full Name: ${candidateName}
Email: ${candidateEmail}
Phone: ${phoneFromFilename}
Resume File Source: ${analysisRow.resumeSource || ''}

Existing Validated Skills:
${matched.map((m: any) => `- ${m.skill}: ${m.context || ''}`).join('\n')}

Candidate Actual Projects & Work Experience:
${evidence.map((e: any) => `- ${e.claim}: ${e.evidence}`).join('\n')}`;
    }

    if (!effectiveResumeText) {
      effectiveResumeText = `Candidate Full Name: ${candidateName}\nEmail: ${candidateEmail}`;
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are a Principal Technical Recruiter and ATS Resume Architect.
Your mission is to take the candidate's REAL uploaded resume and create an ATS-optimized resume integrating ONLY the user-confirmed missing keywords and skills without inventing false biographical details.

STRICT TRUTHFULNESS & GROUNDING RULES:
1. Candidate Identity:
   - Candidate Name: Must match their real name ("${candidateName}"). Never invent fictional candidates or substitute placeholder names.
   - Candidate Email: Must match their real email ("${candidateEmail}").
   - Candidate Phone, Location, LinkedIn, GitHub, Portfolio: Extract directly from their resume text if present.
2. Candidate Real Projects & Work Experience:
   - Preserve all projects and work experience explicitly mentioned in their resume.
   - Refactor project and experience bullets into the Google XYZ format ("Accomplished [X], measured by [Y], by doing [Z]") with strong action verbs.
   - DO NOT replace their actual projects with fictional projects.
3. Education & Credentials Grounding:
   - Extract ALL education records (degrees, diplomas, high schools, colleges/universities, years, GPA/percentage) present in their resume text.
   - Extract ALL certifications, licenses, and accredited courses present in their resume text.
   - NEVER drop or omit education or certifications! If education or certifications exist in the resume, they MUST be returned in the structured JSON.
4. Target Skills Integration:
   - Add the confirmed missing skills into the "technicalSkills" categories.
   - Weave the confirmed skills and candidate context into the project bullets.
   - Tailor the Professional Summary to reflect their actual background plus the newly added target keywords.
   - Keep all original truth intact. NEVER fabricate biographical facts.

Return structured JSON strictly matching the schema.`;

    const userPrompt = `Candidate Name: ${candidateName}
Candidate Email: ${candidateEmail}
Target Job Title: ${targetRole || 'Software Developer'}

=== TARGET JOB POSTING ===
${jobDescription.trim()}

=== CANDIDATE REAL RESUME SOURCE TEXT ===
${effectiveResumeText}

=== USER CONFIRMED SKILL GAPS & PROJECT CONTEXT TO INTEGRATE ===
${JSON.stringify(confirmedSkills || [], null, 2)}`;

    const candidateModels = ['gemini-3-flash-preview', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];
    let responseText = '';
    let lastErr: any = null;

    for (const model of candidateModels) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout on ${model}`)), 22000)
        );
        const result = await Promise.race([
          ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              temperature: 0.1,
              seed: 42,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  personalInfo: {
                    type: Type.OBJECT,
                    properties: {
                      fullName: { type: Type.STRING },
                      email: { type: Type.STRING },
                      phone: { type: Type.STRING },
                      location: { type: Type.STRING },
                      linkedin: { type: Type.STRING },
                      github: { type: Type.STRING },
                      portfolio: { type: Type.STRING },
                    },
                    required: ['fullName', 'email', 'phone', 'location'],
                  },
                  targetTitle: { type: Type.STRING },
                  professionalSummary: { type: Type.STRING },
                  technicalSkills: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        category: { type: Type.STRING },
                        skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                      },
                      required: ['category', 'skills'],
                    },
                  },
                  projects: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                        bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                      },
                      required: ['title', 'techStack', 'bullets'],
                    },
                  },
                  experience: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        company: { type: Type.STRING },
                        role: { type: Type.STRING },
                        period: { type: Type.STRING },
                        location: { type: Type.STRING },
                        bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                      },
                      required: ['company', 'role', 'bullets'],
                    },
                  },
                  education: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        degree: { type: Type.STRING },
                        institution: { type: Type.STRING },
                        year: { type: Type.STRING },
                        gpa: { type: Type.STRING },
                      },
                      required: ['degree'],
                    },
                  },
                  certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
                  integratedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                  atsScore: { type: Type.INTEGER },
                },
                required: [
                  'personalInfo',
                  'targetTitle',
                  'professionalSummary',
                  'technicalSkills',
                  'projects',
                  'education',
                  'certifications',
                  'integratedSkills',
                  'atsScore',
                ],
              },
            },
          }),
          timeoutPromise,
        ]);
        if (result.text && result.text.trim().length > 0) {
          responseText = result.text;
          break;
        }
      } catch (err: any) {
        lastErr = err;
      }
    }

    if (!responseText) {
      throw lastErr || new Error('Failed to generate structured ATS resume.');
    }

    const data = JSON.parse(responseText);

    // Universal guarantee for Education: If LLM returned empty education, extract from resume text
    if (!data.education || !Array.isArray(data.education) || data.education.length === 0) {
      data.education = extractEducationFromText(effectiveResumeText);
    }

    // Universal guarantee for Certifications: If LLM returned empty certifications, extract from resume text
    if (!data.certifications || !Array.isArray(data.certifications) || data.certifications.length === 0) {
      data.certifications = extractCertificationsFromText(effectiveResumeText);
    }

    // Universal guarantee for Contact Info grounded in actual resume
    if (!data.personalInfo) {
      data.personalInfo = {
        fullName: candidateName,
        email: candidateEmail,
        phone: detectedInfo.phone || '',
        location: detectedInfo.location || '',
        linkedin: detectedInfo.linkedin || '',
        github: detectedInfo.github || '',
        portfolio: detectedInfo.portfolio || '',
      };
    } else {
      if (!data.personalInfo.fullName || /^(?:john\s*doe|jane\s*doe|candidate|alex\s*rivera)$/i.test(data.personalInfo.fullName.trim())) {
        data.personalInfo.fullName = candidateName;
      }
      if (!data.personalInfo.email || /alex\.rivera|example\.com|email\.com/i.test(data.personalInfo.email)) {
        data.personalInfo.email = candidateEmail;
      }
      if (!data.personalInfo.phone || /555-012/i.test(data.personalInfo.phone)) {
        data.personalInfo.phone = detectedInfo.phone || '';
      }
      if (!data.personalInfo.location && detectedInfo.location) {
        data.personalInfo.location = detectedInfo.location;
      }
      if (!data.personalInfo.linkedin && detectedInfo.linkedin) {
        data.personalInfo.linkedin = detectedInfo.linkedin;
      }
      if (!data.personalInfo.github && detectedInfo.github) {
        data.personalInfo.github = detectedInfo.github;
      }
      if (!data.personalInfo.portfolio && detectedInfo.portfolio) {
        data.personalInfo.portfolio = detectedInfo.portfolio;
      }
    }

    return res.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in /api/generate-ats-resume:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate ATS resume.' });
  }
});

/** POST /api/extract-resume-text - Extract readable text from uploaded resume document */
app.post('/api/extract-resume-text', async (req, res) => {
  try {
    const { fileBase64, fileName } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: 'fileBase64 is required.' });
    }
    const docBuffer = decodeBase64File(fileBase64);
    const text = await extractTextFromDocument(docBuffer, fileName || 'resume.pdf');
    return res.json({ success: true, text });
  } catch (err: any) {
    console.error('Error in /api/extract-resume-text:', err);
    return res.status(500).json({ error: err.message || 'Failed to extract text from document.' });
  }
});

/** POST /api/optimize-resume - Full ATS-compliant resume generator */
app.post('/api/optimize-resume', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'You must be logged in to optimize resumes.' });
    }

    const { resumeText, jobDescription, targetRole } = req.body;
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: 'Both resumeText and jobDescription are required.' });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are an elite ATS Resume Specialist and Executive Career Coach.
Transform the candidate's existing resume into a top-scoring, ATS-compliant resume strictly tailored for the target job description.
Follow these rules:
1. ATS Formatting: Clean single-column layout in standard Markdown. No complex tables, double columns, or unsupported symbols.
2. Google XYZ Formula: Transform project and experience bullet points into: "Accomplished [X], as measured by [Y], by doing [Z]" with quantifiable impact, clear metrics, and high-energy action verbs (Engineered, Architected, Streamlined, Spearheaded).
3. Keyword Matching: Strategically integrate core technical skills, frameworks, and qualifications from the job description into the Professional Summary, Technical Skills, and Projects sections.
4. Grounded Integrity: Elevate the candidate's actual projects and technologies; never fabricate fake degrees, fake companies, or nonexistent credentials.
Return structured JSON only matching the schema.`;

    const userPrompt = `Target Role: ${targetRole || 'Not specified'}

Job Description:
${jobDescription.trim()}

Candidate Current Resume Text:
${resumeText.trim()}`;

    const candidateModels = ['gemini-3-flash-preview', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];
    let responseText = '';
    let lastErr: any = null;

    for (const model of candidateModels) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout on ${model}`)), 18000)
        );
        const result = await Promise.race([
          ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              temperature: 0.2,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  markdown: { type: Type.STRING, description: 'Full ATS-compliant resume in clean Markdown format.' },
                  professionalSummary: { type: Type.STRING, description: '3-sentence high-impact ATS executive summary.' },
                  integratedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                  keyHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                  atsFormatTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['markdown', 'professionalSummary', 'integratedKeywords', 'keyHighlights', 'atsFormatTips'],
              },
            },
          }),
          timeoutPromise,
        ]);
        if (result.text && result.text.trim().length > 0) {
          responseText = result.text;
          break;
        }
      } catch (err: any) {
        lastErr = err;
      }
    }

    if (!responseText) {
      throw lastErr || new Error('Failed to generate ATS resume.');
    }

    const data = JSON.parse(responseText);
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in /api/optimize-resume:', err);
    return res.status(500).json({ error: err.message || 'Failed to optimize resume.' });
  }
});

/** POST /api/rewrite-bullet - Interactive single-bullet rewriter */
app.post('/api/rewrite-bullet', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'You must be logged in to rewrite bullets.' });
    }

    const { bullet, targetRole, jobDescription } = req.body;
    if (!bullet || typeof bullet !== 'string' || bullet.trim().length < 4) {
      return res.status(400).json({ error: 'Please provide a valid resume bullet point to rewrite.' });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are an expert resume editor specializing in the Google XYZ Formula (Accomplished [X], measured by [Y], by doing [Z]).
Rewrite the provided bullet into 3 distinct, high-impact, ATS-optimized variations:
1. Performance & Speed Focus (optimization, latency, efficiency, throughput)
2. Architecture & Technical Scale (design patterns, API contracts, modularity, security)
3. Business & User Impact (conversion, engagement, adoption, reliability)
Ensure all bullets begin with powerful past-tense action verbs.`;

    const userPrompt = `Original Bullet: "${bullet.trim()}"
${targetRole ? `Target Role: ${targetRole}\n` : ''}${jobDescription ? `Job Context:\n${jobDescription.slice(0, 600)}` : ''}`;

    const candidateModels = ['gemini-3-flash-preview', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];
    let responseText = '';
    let lastErr: any = null;

    for (const model of candidateModels) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout on ${model}`)), 12000)
        );
        const result = await Promise.race([
          ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              temperature: 0.2,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  variations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        focus: { type: Type.STRING },
                        bullet: { type: Type.STRING },
                        actionVerb: { type: Type.STRING },
                        metrics: { type: Type.STRING },
                      },
                      required: ['title', 'focus', 'bullet', 'actionVerb', 'metrics'],
                    },
                  },
                  atsTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['original', 'variations', 'atsTips'],
              },
            },
          }),
          timeoutPromise,
        ]);
        if (result.text && result.text.trim().length > 0) {
          responseText = result.text;
          break;
        }
      } catch (err: any) {
        lastErr = err;
      }
    }

    if (!responseText) {
      throw lastErr || new Error('Failed to rewrite bullet.');
    }

    const data = JSON.parse(responseText);
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in /api/rewrite-bullet:', err);
    return res.status(500).json({ error: err.message || 'Failed to rewrite bullet.' });
  }
});

/** POST /api/generate-cover-letter - Tailored cover letter generator */
app.post('/api/generate-cover-letter', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'You must be logged in to generate cover letters.' });
    }

    const { jobTitle, companyName, jobDescription, resumeText } = req.body;
    if (!jobDescription || !resumeText) {
      return res.status(400).json({ error: 'Job description and resume text are required.' });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are an executive career coach and cover letter strategist.
Write a compelling, tailored, 3-4 paragraph formal cover letter connecting the candidate's actual projects and competencies to the employer's needs.
Rules:
1. Enthusiastic and professional tone without cliché fluff.
2. Substantial evidence: directly reference candidate projects, tech stack, and achievements.
3. Precise alignment: address 2-3 specific requirements or challenges mentioned in the job description.
4. Clean formatting with placeholders for [Date] and [Hiring Manager Name] if not specified.`;

    const userPrompt = `Target Role: ${jobTitle || 'Target Role'}
Company: ${companyName || 'Target Company'}

Target Job Description:
${jobDescription.trim()}

Candidate Resume:
${resumeText.trim()}`;

    const candidateModels = ['gemini-3-flash-preview', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];
    let responseText = '';
    let lastErr: any = null;

    for (const model of candidateModels) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout on ${model}`)), 15000)
        );
        const result = await Promise.race([
          ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              temperature: 0.2,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  letter: { type: Type.STRING },
                  subjectLine: { type: Type.STRING },
                  keyHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['letter', 'subjectLine', 'keyHooks'],
              },
            },
          }),
          timeoutPromise,
        ]);
        if (result.text && result.text.trim().length > 0) {
          responseText = result.text;
          break;
        }
      } catch (err: any) {
        lastErr = err;
      }
    }

    if (!responseText) {
      throw lastErr || new Error('Failed to generate cover letter.');
    }

    const data = JSON.parse(responseText);
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in /api/generate-cover-letter:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate cover letter.' });
  }
});

/** POST /api/evaluate-interview-answer - Mock interview evaluation with AI scoring & feedback */
app.post('/api/evaluate-interview-answer', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'You must be logged in to evaluate interview answers.' });
    }

    const { question, topic, expectedFocus, candidateAnswer, targetRole } = req.body;
    if (!question || !candidateAnswer || typeof candidateAnswer !== 'string' || candidateAnswer.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a valid answer to evaluate.' });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are a senior technical interviewer at a top tech company.
Evaluate the candidate's answer constructively, fairly, and rigorously based on the STAR method and technical depth.
Rules:
- Score the answer on a scale from 1 to 10.
- Verdict: 'Strong Hire' | 'Hire' | 'Needs Practice' | 'Weak'.
- Identify 2-3 specific Strengths.
- Identify 2-3 Improvement areas or missing technical concepts.
- List exact Missing Keywords / Tools they should have mentioned.
- Provide an Upgraded 10/10 Answer that builds upon what the candidate said and elevates it to staff-level readiness.`;

    const userPrompt = `Target Role: ${targetRole || 'Software Engineering'}
Interview Question: "${question}"
Topic: ${topic || 'Technical'}
Expected Focus: ${expectedFocus || 'Not specified'}

Candidate's Answer:
"${candidateAnswer.trim()}"`;

    const candidateModels = ['gemini-3-flash-preview', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];
    let responseText = '';
    let lastErr: any = null;

    for (const model of candidateModels) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout on ${model}`)), 14000)
        );
        const result = await Promise.race([
          ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              temperature: 0.2,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER, description: 'Score between 1 and 10.' },
                  verdict: { type: Type.STRING, description: 'Strong Hire, Hire, Needs Practice, or Weak.' },
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
                  missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                  upgradedAnswer: { type: Type.STRING, description: 'Flawless 10/10 model response.' },
                },
                required: ['score', 'verdict', 'strengths', 'improvements', 'missingKeywords', 'upgradedAnswer'],
              },
            },
          }),
          timeoutPromise,
        ]);
        if (result.text && result.text.trim().length > 0) {
          responseText = result.text;
          break;
        }
      } catch (err: any) {
        lastErr = err;
      }
    }

    if (!responseText) {
      throw lastErr || new Error('Failed to evaluate interview answer.');
    }

    const data = JSON.parse(responseText);
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in /api/evaluate-interview-answer:', err);
    return res.status(500).json({ error: err.message || 'Failed to evaluate interview answer.' });
  }
});

/** POST /api/analyze-jd - Instant Job Description Deconstructor & Keyword Extractor */
app.post('/api/analyze-jd', async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide a valid job description (at least 20 characters).' });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are a Principal Technical Recruiter and Career Strategist.
Deconstruct the provided job description into structured, highly actionable hiring criteria for engineering candidates.
Categorize skills precisely:
- Must-Have Skills: strictly required technical competencies and tools (mark importance 'Critical' or 'High').
- Nice-To-Have Skills: preferred libraries, secondary tools, or bonus domain knowledge.
- Extract target title, inferred seniority, required experience (e.g. 0-2 yrs, Entry/Junior, etc.), degree expectations.
- Summarize 3-5 core work responsibilities.
- Provide 1-2 sentences of tactical recruiter advice on how to stand out for this role.`;

    const userPrompt = `Job Description:
"""
${jobDescription.trim()}
"""`;

    let jdResult: any = null;
    const candidateModels = ['gemini-3-flash-preview', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];

    for (const model of candidateModels) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout on ${model}`)), 12000)
        );
        const result = await Promise.race([
          ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              temperature: 0.1,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  jobTitle: { type: Type.STRING },
                  seniority: { type: Type.STRING },
                  experienceRequirement: { type: Type.STRING },
                  educationRequirement: { type: Type.STRING },
                  mustHaveSkills: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        skill: { type: Type.STRING },
                        importance: { type: Type.STRING, description: 'Critical or High' },
                        category: { type: Type.STRING },
                      },
                      required: ['skill', 'importance', 'category'],
                    },
                  },
                  niceToHaveSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                  responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
                  techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recruiterAdvice: { type: Type.STRING },
                },
                required: [
                  'jobTitle',
                  'seniority',
                  'experienceRequirement',
                  'educationRequirement',
                  'mustHaveSkills',
                  'niceToHaveSkills',
                  'responsibilities',
                  'techStack',
                  'recruiterAdvice',
                ],
              },
            },
          }),
          timeoutPromise,
        ]);

        if (result.text && result.text.trim()) {
          jdResult = JSON.parse(result.text);
          break;
        }
      } catch (err: any) {
        // Fall through to next model or deterministic fallback
      }
    }

    if (!jdResult) {
      // Deterministic Grounded Fallback
      const text = jobDescription.toLowerCase();
      const detectedSkills: { skill: string; importance: 'Critical' | 'High'; category: string }[] = [];
      const KNOWN = [
        { name: 'React', cat: 'Frontend' },
        { name: 'TypeScript', cat: 'Languages' },
        { name: 'JavaScript', cat: 'Languages' },
        { name: 'Node.js', cat: 'Backend' },
        { name: 'Express.js', cat: 'Backend' },
        { name: 'REST APIs', cat: 'Backend' },
        { name: 'PostgreSQL', cat: 'Databases' },
        { name: 'MySQL', cat: 'Databases' },
        { name: 'MongoDB', cat: 'Databases' },
        { name: 'Docker', cat: 'DevOps' },
        { name: 'Git', cat: 'DevOps' },
        { name: 'CI/CD', cat: 'DevOps' },
        { name: 'Tailwind CSS', cat: 'Frontend' },
        { name: 'HTML5/CSS3', cat: 'Frontend' },
        { name: 'Jest', cat: 'Testing' },
        { name: 'Python', cat: 'Languages' },
        { name: 'Java', cat: 'Languages' },
      ];

      KNOWN.forEach((k) => {
        if (text.includes(k.name.toLowerCase())) {
          detectedSkills.push({
            skill: k.name,
            importance: detectedSkills.length < 5 ? 'Critical' : 'High',
            category: k.cat,
          });
        }
      });

      let title = 'Software Engineer';
      if (text.includes('full stack') || text.includes('full-stack')) title = 'Junior Full-Stack Developer';
      else if (text.includes('frontend')) title = 'Frontend Engineer';
      else if (text.includes('backend')) title = 'Backend Engineer';

      jdResult = {
        jobTitle: title,
        seniority: text.includes('senior') ? 'Senior' : text.includes('junior') || text.includes('intern') ? 'Junior / Early Career' : 'Mid-Level',
        experienceRequirement: text.includes('year') ? '0-2 Years / Entry Level' : 'Fresh Graduate / Entry Level',
        educationRequirement: "Bachelor's degree in Computer Science, IT, or related engineering discipline",
        mustHaveSkills: detectedSkills.slice(0, 8),
        niceToHaveSkills: detectedSkills.slice(8).map((s) => s.skill).concat(['Agile / Scrum', 'Cloud Platforms (AWS/GCP)']),
        responsibilities: [
          'Design and maintain scalable frontend interfaces and backend RESTful APIs.',
          'Collaborate in cross-functional engineering sprints with code reviews and automated tests.',
          'Optimize database queries and ensure reliable system availability.',
        ],
        techStack: detectedSkills.map((s) => s.skill).slice(0, 7),
        recruiterAdvice:
          'Emphasize production projects and demonstrable REST API or UI architectures in your top resume bullets to bypass automated screening filters.',
      };
    }

    return res.json({ success: true, data: jdResult });
  } catch (err: any) {
    console.error('Error in /api/analyze-jd:', err);
    return res.status(500).json({ error: err.message || 'Failed to analyze job description.' });
  }
});

/** POST /api/generate-profile-assets - Generates LinkedIn Headlines, About Section, and GitHub Bios */
app.post('/api/generate-profile-assets', async (req, res) => {
  try {
    const { targetTitle, skills = [], projects = [], candidateName = 'Developer' } = req.body;

    const ai = getGeminiClient();
    const systemInstruction = `You are an elite personal branding coach for software engineers.
Generate compelling, high-converting social assets for LinkedIn and GitHub profiles:
1. Three catchy, keyword-dense LinkedIn Headlines (max 150 chars each) that recruiters search for.
2. A compelling 3-paragraph LinkedIn "About" section written in a confident first-person voice. Mention real projects and technical stacks.
3. A punchy GitHub bio (under 160 characters).
4. Pinned repository bullet descriptions for their key projects.`;

    const userPrompt = `Candidate: ${candidateName}
Target Title: ${targetTitle || 'Full-Stack Developer'}
Skills: ${Array.isArray(skills) ? skills.join(', ') : 'React, TypeScript, Node.js, Express, MySQL, Docker'}
Key Projects:
${Array.isArray(projects) ? projects.map((p: any) => `- ${p.title || p}: ${Array.isArray(p.techStack) ? p.techStack.join(', ') : ''}`).join('\n') : '- Nex-Cartify: React, Node, MongoDB\n- RetailGenie AI: Gemini API, OCR, TypeScript'}`;

    let assetsResult: any = null;
    const candidateModels = ['gemini-3-flash-preview', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];

    for (const model of candidateModels) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout on ${model}`)), 12000)
        );
        const result = await Promise.race([
          ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              temperature: 0.3,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  headlines: { type: Type.ARRAY, items: { type: Type.STRING } },
                  aboutSummary: { type: Type.STRING },
                  githubBio: { type: Type.STRING },
                  pinnedProjects: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                      },
                      required: ['name', 'summary', 'tags'],
                    },
                  },
                },
                required: ['headlines', 'aboutSummary', 'githubBio', 'pinnedProjects'],
              },
            },
          }),
          timeoutPromise,
        ]);

        if (result.text && result.text.trim()) {
          assetsResult = JSON.parse(result.text);
          break;
        }
      } catch (err: any) {
        // Fallback
      }
    }

    if (!assetsResult) {
      assetsResult = {
        headlines: [
          `Junior Full-Stack Developer | React, TypeScript, Node.js & REST APIs | Building Scalable Web Apps`,
          `Software Engineer (Full-Stack) | React.js • Node • Express • PostgreSQL • Docker | Open to Opportunities`,
          `Full-Stack Developer @ Computer Science Undergrad | Creator of Nex-Cartify & RetailGenie AI`,
        ],
        aboutSummary: `I am a Junior Full-Stack Developer passionate about engineering production-grade web applications that deliver real impact. With a solid foundation in React, TypeScript, Node.js, and relational/NoSQL databases, I bridge user-facing elegance with robust backend systems.\n\nRecently, I built Nex-Cartify, a full-stack e-commerce platform with RBAC authentication and sub-100ms API response times, as well as RetailGenie AI, an automated retail intelligence assistant integrating OCR and Gemini multi-modal voice processing.\n\nI love collaborating on agile teams, writing clean, well-tested code, and learning emerging cloud and AI paradigms. Feel free to connect or reach out at my portfolio!`,
        githubBio: `Junior Full-Stack Developer | React • TypeScript • Node.js • Cloud | Building modern web apps that scale.`,
        pinnedProjects: [
          {
            name: 'Nex-Cartify',
            summary: 'Full-Stack E-Commerce platform with secure JWT auth, role-based access, and automated testing.',
            tags: ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB'],
          },
          {
            name: 'RetailGenie AI',
            summary: 'Smart retail assistant combining OCR visual item recognition and Gemini API voice commands.',
            tags: ['React', 'Gemini API', 'TypeScript', 'Docker'],
          },
        ],
      };
    }

    return res.json({ success: true, data: assetsResult });
  } catch (err: any) {
    console.error('Error in /api/generate-profile-assets:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate profile assets.' });
  }
});

/** POST /api/generate-outreach - Generates Recruiter Cold DMs, Connection Notes, and Follow-ups */
app.post('/api/generate-outreach', async (req, res) => {
  try {
    const {
      candidateName = 'Ritesh Dhakulkar',
      companyName = 'Target Company',
      jobTitle = 'Junior Full-Stack Developer',
      projectMention = 'Nex-Cartify',
    } = req.body;

    const ai = getGeminiClient();
    const systemInstruction = `You are a tech career mentor who teaches candidates how to land interviews through authentic, personalized cold outreach.
Generate 4 tailored messages for the candidate:
1. connectionNote: LinkedIn connection note strictly UNDER 300 characters. Polite, specific, referencing target role.
2. recruiterInMail: A concise 3-paragraph direct message for a technical recruiter.
3. coldEmail: A compelling cold email for an Engineering Manager with an eye-catching subject line and body.
4. thankYouFollowUp: A post-interview thank you and impact recap note.`;

    const userPrompt = `Candidate: ${candidateName}
Company: ${companyName}
Target Role: ${jobTitle}
Highlighted Project: ${projectMention}`;

    let outreachResult: any = null;
    const candidateModels = ['gemini-3-flash-preview', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];

    for (const model of candidateModels) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout on ${model}`)), 12000)
        );
        const result = await Promise.race([
          ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              temperature: 0.3,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  connectionNote: { type: Type.STRING },
                  recruiterInMail: { type: Type.STRING },
                  coldEmail: {
                    type: Type.OBJECT,
                    properties: {
                      subject: { type: Type.STRING },
                      body: { type: Type.STRING },
                    },
                    required: ['subject', 'body'],
                  },
                  thankYouFollowUp: { type: Type.STRING },
                },
                required: ['connectionNote', 'recruiterInMail', 'coldEmail', 'thankYouFollowUp'],
              },
            },
          }),
          timeoutPromise,
        ]);

        if (result.text && result.text.trim()) {
          outreachResult = JSON.parse(result.text);
          break;
        }
      } catch (err: any) {
        // Fallback
      }
    }

    if (!outreachResult) {
      outreachResult = {
        connectionNote: `Hi! I admire ${companyName}'s engineering culture and recently applied for the ${jobTitle} role. I've built full-stack TypeScript/Node projects like ${projectMention}. Would love to connect and follow your work!`,
        recruiterInMail: `Hi [Recruiter Name],\n\nI hope you're having a productive week! I noticed ${companyName} is hiring for the ${jobTitle} position and wanted to express my enthusiastic interest.\n\nAs a developer focused on React, TypeScript, and Node.js, I recently architected ${projectMention}, handling production API workflows with sub-100ms response times. My background aligns closely with the engineering stack your team utilizes.\n\nI've submitted my application through your careers portal and would welcome the opportunity to chat if my profile aligns with what you're seeking.\n\nBest regards,\n${candidateName}`,
        coldEmail: {
          subject: `${candidateName} — Application & Portfolio for ${jobTitle} at ${companyName}`,
          body: `Hi [Hiring Manager Name],\n\nI'm reaching out because I've been following ${companyName}'s product engineering and would love to contribute as a ${jobTitle}.\n\nI specialize in TypeScript, React, and Node.js. In my recent project, ${projectMention}, I engineered an end-to-end full-stack platform featuring automated testing, Docker containerization, and optimized SQL schemas.\n\nI'd welcome the chance to share how my hands-on project experience could add value to your current sprint deliverables. My resume and code repositories are available for your review.\n\nThanks for your time and consideration,\n${candidateName}`,
        },
        thankYouFollowUp: `Hi [Interviewer Name],\n\nThank you for taking the time to speak with me today about the ${jobTitle} role at ${companyName}. I really enjoyed our conversation regarding your engineering architecture and team goals.\n\nOur discussion reinforced my enthusiasm for joining the team. Please let me know if you need any additional code samples or references.\n\nWarm regards,\n${candidateName}`,
      };
    }

    return res.json({ success: true, data: outreachResult });
  } catch (err: any) {
    console.error('Error in /api/generate-outreach:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate outreach messages.' });
  }
});

// Analysis History Routes (User-Scoped)
// ─────────────────────────────────────────────

function rowToAnalysis(row: any) {
  return {
    id:                 row.id,
    userId:             row.userId,
    jobTitle:           row.jobTitle,
    companyName:        row.companyName,
    matchScore:         row.matchScore,
    resumeSource:       row.resumeSource,
    resumeText:         row.resumeText || '',
    createdAt:          row.createdAt,
    matchedSkills:      parseJson(row.matchedSkills, []),
    missingSkills:      parseJson(row.missingSkills, []),
    resumeEvidence:     parseJson(row.resumeEvidence, []),
    recommendations:    parseJson(row.recommendations, []),
    learningRoadmap:    parseJson(row.learningRoadmap, []),
    interviewQuestions: parseJson(row.interviewQuestions, []),
  };
}

/** GET /api/analyses — list all analyses for the current user, newest first */
app.get('/api/analyses', async (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'You must be logged in to view your analyses.' });
  }

  try {
    const rows = await query(
      `SELECT id, userId, jobTitle, companyName, matchScore, resumeSource, resumeText,
              ${CREATED_AT_ISO},
              matchedSkills, missingSkills, resumeEvidence,
              recommendations, learningRoadmap, interviewQuestions
         FROM analyses
        WHERE userId = ?
        ORDER BY id DESC`,
      [userId]
    );
    return res.json({ success: true, data: rows.map(rowToAnalysis) });
  } catch (err: any) {
    console.error('GET /api/analyses error:', err);
    return res.status(500).json({ error: 'Failed to retrieve analyses.' });
  }
});

/** GET /api/analyses/:id — fetch one analysis in full (ensuring user owns it) */
app.get('/api/analyses/:id', async (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'You must be logged in.' });
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid analysis ID. Must be a positive integer.' });
  }

  try {
    const row = await queryOne(
      `SELECT id, userId, jobTitle, companyName, matchScore, resumeSource, resumeText,
              ${CREATED_AT_ISO},
              matchedSkills, missingSkills, resumeEvidence,
              recommendations, learningRoadmap, interviewQuestions
         FROM analyses
        WHERE id = ? AND userId = ?`,
      [id, userId]
    );
    if (!row) {
      return res.status(404).json({ error: 'Analysis not found.' });
    }
    return res.json({ success: true, data: rowToAnalysis(row) });
  } catch (err: any) {
    console.error('GET /api/analyses/:id error:', err);
    return res.status(500).json({ error: 'Failed to retrieve analysis.' });
  }
});

/** GET /api/analyses/:id/report — fetch report data for one analysis (ensuring user owns it) */
app.get('/api/analyses/:id/report', async (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'You must be logged in to view this report.' });
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid analysis ID. Must be a positive integer.' });
  }

  try {
    const row = await queryOne(
      `SELECT id, userId, jobTitle, companyName, matchScore, resumeSource,
              ${CREATED_AT_ISO},
              matchedSkills, missingSkills, resumeEvidence,
              recommendations, learningRoadmap, interviewQuestions
         FROM analyses
        WHERE id = ? AND userId = ?`,
      [id, userId]
    );
    if (!row) {
      return res.status(404).json({ error: 'Analysis report not found or access denied.' });
    }
    return res.json({ success: true, data: rowToAnalysis(row) });
  } catch (err: any) {
    console.error('GET /api/analyses/:id/report error:', err);
    return res.status(500).json({ error: 'Failed to retrieve analysis report.' });
  }
});

/** DELETE /api/analyses/:id — delete one analysis (ensuring user owns it) */
app.delete('/api/analyses/:id', async (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'You must be logged in.' });
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid analysis ID. Must be a positive integer.' });
  }

  try {
    const result = await execute(
      'DELETE FROM analyses WHERE id = ? AND userId = ?',
      [id, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Analysis not found.' });
    }
    return res.json({ success: true, message: `Analysis ${id} successfully deleted.` });
  } catch (err: any) {
    console.error('DELETE /api/analyses/:id error:', err);
    return res.status(500).json({ error: 'Failed to delete analysis.' });
  }
});


// ─────────────────────────────────────────────
// Skill Progress Tracker API Routes
// ─────────────────────────────────────────────

/** Deterministically generate a stable taskId independent of array index */
function generateTaskId(analysisId: number, milestone: string, actionItem: string): string {
  const normalized = `${analysisId}:::${(milestone || '').trim().toLowerCase()}:::${(actionItem || '').trim().toLowerCase()}`;
  const hash = randomBytes(0); // unused placeholder
  const cryptoHash = require('crypto').createHash('sha256').update(normalized).digest('hex').slice(0, 16);
  return `task_${analysisId}_${cryptoHash}`;
}

/** Ensure task_progress table exists on boot */
async function ensureTaskProgressTable() {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS task_progress (
        id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
        userId       INT UNSIGNED NOT NULL,
        analysisId   INT UNSIGNED NOT NULL,
        taskId       VARCHAR(128) NOT NULL,
        milestone    VARCHAR(255) NOT NULL,
        title        VARCHAR(500) NOT NULL,
        timeframe    VARCHAR(100) NOT NULL DEFAULT '',
        resource     VARCHAR(500) NOT NULL DEFAULT '',
        status       VARCHAR(32)  NOT NULL DEFAULT 'not_started',
        completedAt  DATETIME     NULL,
        updatedAt    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdAt    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_user_task (userId, taskId),
        KEY idx_progress_user_status (userId, status),
        KEY idx_progress_analysis (analysisId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
  } catch (err: any) {
    console.error('ensureTaskProgressTable warning:', err?.message || err);
  }
}
ensureTaskProgressTable();

/** Ensure analyses table has contentHash column and index */
async function ensureAnalysesContentHash() {
  try {
    const cols: any = await query(`
      SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'analyses'
         AND COLUMN_NAME = 'contentHash'
    `);
    if (!cols || cols.length === 0) {
      await execute(`ALTER TABLE analyses ADD COLUMN contentHash VARCHAR(64) NULL`);
      await execute(`CREATE INDEX idx_analyses_content_hash ON analyses (userId, contentHash)`);
      console.log('Added contentHash column and index to analyses table');
    }
  } catch (err: any) {
    // Non-fatal if column already exists
  }
}
ensureAnalysesContentHash();


/** GET /api/progress — retrieve user learning tasks and progress */
app.get('/api/progress', async (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'You must be logged in to view your learning progress.' });
  }

  const { status, analysisId } = req.query;

  try {
    // 1. Fetch user analyses
    let analysesSql = `SELECT id, userId, jobTitle, companyName, learningRoadmap, ${CREATED_AT_ISO} FROM analyses WHERE userId = ?`;
    const analysesParams: any[] = [userId];

    if (analysisId) {
      const parsedAnalysisId = parseInt(analysisId as string, 10);
      if (!isNaN(parsedAnalysisId) && parsedAnalysisId > 0) {
        analysesSql += ' AND id = ?';
        analysesParams.push(parsedAnalysisId);
      }
    }
    analysesSql += ' ORDER BY id DESC';

    const userAnalyses = await query(analysesSql, analysesParams);

    // 2. Fetch recorded progress for this user
    const progressRows = await query(
      `SELECT taskId, analysisId, status,
              DATE_FORMAT(completedAt, '%Y-%m-%dT%H:%i:%s.000Z') AS completedAt,
              DATE_FORMAT(updatedAt, '%Y-%m-%dT%H:%i:%s.000Z') AS updatedAt
         FROM task_progress
        WHERE userId = ?`,
      [userId]
    );

    const progressMap = new Map<string, any>();
    progressRows.forEach((row) => {
      progressMap.set(row.taskId, row);
    });

    // 3. Flatten roadmap items into individual trackable tasks
    const allTasks: any[] = [];

    for (const analysis of userAnalyses) {
      const roadmap = parseJson<any[]>(analysis.learningRoadmap, []);
      if (Array.isArray(roadmap)) {
        for (const item of roadmap) {
          const milestoneTitle = item.milestone || 'Learning Milestone';
          const timeframe = item.timeframe || '';
          const resource = item.resourceSuggestion || '';
          const actionItems = Array.isArray(item.actionItems) ? item.actionItems : [];

          for (const actionItem of actionItems) {
            if (!actionItem || typeof actionItem !== 'string') continue;
            const taskId = generateTaskId(analysis.id, milestoneTitle, actionItem);
            const recorded = progressMap.get(taskId);
            const taskStatus = recorded?.status || 'not_started';

            if (!status || status === 'all' || taskStatus === status) {
              allTasks.push({
                taskId,
                analysisId: analysis.id,
                jobTitle: analysis.jobTitle || 'Target Role',
                companyName: analysis.companyName || '',
                milestone: milestoneTitle,
                timeframe,
                resourceSuggestion: resource,
                title: actionItem,
                status: taskStatus,
                completedAt: recorded?.completedAt || null,
                updatedAt: recorded?.updatedAt || null,
              });
            }
          }
        }
      }
    }

    return res.json({ success: true, data: allTasks });
  } catch (err: any) {
    console.error('GET /api/progress error:', err);
    return res.status(500).json({ error: 'Failed to retrieve progress records.' });
  }
});

/** GET /api/progress/summary — aggregate progress metrics */
app.get('/api/progress/summary', async (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'You must be logged in.' });
  }

  try {
    const userAnalyses = await query(
      `SELECT id, jobTitle, companyName, learningRoadmap FROM analyses WHERE userId = ? ORDER BY id DESC`,
      [userId]
    );

    const progressRows = await query(
      `SELECT taskId, status FROM task_progress WHERE userId = ?`,
      [userId]
    );

    const progressMap = new Map<string, string>();
    progressRows.forEach((r) => progressMap.set(r.taskId, r.status));

    let totalTasks = 0;
    let notStarted = 0;
    let inProgress = 0;
    let completed = 0;

    const byAnalysisMap = new Map<number, {
      analysisId: number;
      jobTitle: string;
      companyName: string;
      total: number;
      completed: number;
      inProgress: number;
      percentage: number;
    }>();

    for (const a of userAnalyses) {
      const roadmap = parseJson<any[]>(a.learningRoadmap, []);
      let analysisTotal = 0;
      let analysisCompleted = 0;
      let analysisInProgress = 0;

      if (Array.isArray(roadmap)) {
        for (const m of roadmap) {
          const actionItems = Array.isArray(m.actionItems) ? m.actionItems : [];
          for (const item of actionItems) {
            if (!item || typeof item !== 'string') continue;
            totalTasks++;
            analysisTotal++;

            const taskId = generateTaskId(a.id, m.milestone || '', item);
            const status = progressMap.get(taskId) || 'not_started';

            if (status === 'completed') {
              completed++;
              analysisCompleted++;
            } else if (status === 'in_progress') {
              inProgress++;
              analysisInProgress++;
            } else {
              notStarted++;
            }
          }
        }
      }

      byAnalysisMap.set(a.id, {
        analysisId: a.id,
        jobTitle: a.jobTitle || 'Target Role',
        companyName: a.companyName || '',
        total: analysisTotal,
        completed: analysisCompleted,
        inProgress: analysisInProgress,
        percentage: analysisTotal > 0 ? Math.round((analysisCompleted / analysisTotal) * 100) : 0,
      });
    }

    const completionPercentage = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

    return res.json({
      success: true,
      summary: {
        totalTasks,
        notStarted,
        inProgress,
        completed,
        completionPercentage,
        byAnalysis: Array.from(byAnalysisMap.values()),
      },
    });
  } catch (err: any) {
    console.error('GET /api/progress/summary error:', err);
    return res.status(500).json({ error: 'Failed to retrieve progress summary.' });
  }
});

/** POST /api/progress or PUT /api/progress/:taskId — create or update progress for a task */
async function handleUpdateProgress(req: express.Request, res: express.Response) {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'You must be logged in to update progress.' });
  }

  const taskIdFromParam = req.params?.taskId;
  const {
    taskId: taskIdFromBody,
    analysisId,
    milestone,
    title,
    timeframe,
    resource,
    status,
  } = req.body;

  const validStatuses = ['not_started', 'in_progress', 'completed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be "not_started", "in_progress", or "completed".' });
  }

  const targetAnalysisId = parseInt(analysisId, 10);
  if (isNaN(targetAnalysisId) || targetAnalysisId <= 0) {
    return res.status(400).json({ error: 'Valid analysisId is required.' });
  }

  // Security: verify analysis belongs to authenticated user
  const analysis = await queryOne(
    'SELECT id FROM analyses WHERE id = ? AND userId = ?',
    [targetAnalysisId, userId]
  );
  if (!analysis) {
    return res.status(404).json({ error: 'Analysis not found or access denied.' });
  }

  const finalTaskId = taskIdFromParam || taskIdFromBody || generateTaskId(targetAnalysisId, milestone || '', title || '');
  const cleanMilestone = (milestone || 'Roadmap Milestone').slice(0, 255);
  const cleanTitle = (title || 'Learning Task').slice(0, 500);
  const cleanTimeframe = (timeframe || '').slice(0, 100);
  const cleanResource = (resource || '').slice(0, 500);
  const completedAt = status === 'completed' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;

  try {
    await execute(
      `INSERT INTO task_progress
        (userId, analysisId, taskId, milestone, title, timeframe, resource, status, completedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        completedAt = VALUES(completedAt),
        milestone = VALUES(milestone),
        title = VALUES(title),
        timeframe = VALUES(timeframe),
        resource = VALUES(resource),
        updatedAt = CURRENT_TIMESTAMP`,
      [
        userId,
        targetAnalysisId,
        finalTaskId,
        cleanMilestone,
        cleanTitle,
        cleanTimeframe,
        cleanResource,
        status,
        completedAt,
      ]
    );

    return res.json({
      success: true,
      message: 'Progress updated successfully.',
      data: {
        taskId: finalTaskId,
        status,
        completedAt,
      },
    });
  } catch (err: any) {
    console.error('Update progress error:', err);
    return res.status(500).json({ error: 'Failed to update progress record.' });
  }
}

app.post('/api/progress', handleUpdateProgress);
app.put('/api/progress/:taskId', handleUpdateProgress);

/** DELETE /api/progress/:taskId — reset or delete a progress record */
app.delete('/api/progress/:taskId', async (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'You must be logged in.' });
  }

  const taskId = req.params.taskId;
  if (!taskId) {
    return res.status(400).json({ error: 'Task ID is required.' });
  }

  try {
    const result = await execute(
      'DELETE FROM task_progress WHERE taskId = ? AND userId = ?',
      [taskId, userId]
    );
    return res.json({
      success: true,
      message: 'Task progress reset to not started.',
      affected: result.affectedRows,
    });
  } catch (err: any) {
    console.error('DELETE /api/progress/:taskId error:', err);
    return res.status(500).json({ error: 'Failed to reset task progress.' });
  }
});

// Guard: Ensure any unhandled /api route returns JSON, never HTML
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Mount Vite middleware for dev or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`SkillBridge AI full-stack server running on:`);
    console.log(`  > Local:   http://localhost:${port}`);
    console.log(`  > Network: http://127.0.0.1:${port}`);
  });

  // Close the MySQL pool cleanly so the process can exit without leaving
  // half-open connections behind.
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received - shutting down...`);
    server.close();
    try {
      await closeDb();
    } catch (err) {
      console.error('Error while closing the database pool:', err);
    }
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer();
