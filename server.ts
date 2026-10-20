import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createRequire } from 'module';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import {
  initDb,
  query,
  queryOne,
  execute,
  closeDb,
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
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // require HTTPS in production
      httpOnly: true,
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
  try {
    const data = await pdfParse(buffer);
    const text = data?.text?.trim() || '';
    return text;
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF document.');
  }
}

// ─────────────────────────────────────────────
// Authentication API Routes
// ─────────────────────────────────────────────

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
app.post('/api/auth/signup', async (req, res) => {
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
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user: any = await queryOne('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
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
// Resume Analysis API Endpoint
// ─────────────────────────────────────────────
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
        const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
        const docBuffer = Buffer.from(base64Data, 'base64');
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

    // Call Gemini with automatic retry for temporary high demand (503) spikes and model fallbacks
    const candidateModels = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let lastError: any = null;
    let responseText: string | undefined = undefined;

    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
              systemInstruction,
              temperature: 0.2,
              thinkingConfig: { thinkingBudget: 0 },
              responseMimeType: 'application/json',
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
                      },
                      required: ['question', 'topic', 'expectedFocus'],
                    },
                    description: 'Realistic interview questions based on the candidate profile.',
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
           recommendations, learningRoadmap, interviewQuestions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      `SELECT id, userId, jobTitle, companyName, matchScore, resumeSource,
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
      `SELECT id, userId, jobTitle, companyName, matchScore, resumeSource,
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
    console.log(`SkillBridge AI full-stack server running on http://0.0.0.0:${port}`);
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
