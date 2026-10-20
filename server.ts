import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createRequire } from 'module';
import Database from 'better-sqlite3';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// ─────────────────────────────────────────────
// SQLite database initialisation
// ─────────────────────────────────────────────
const DB_PATH = path.resolve(__dirname, 'analyses.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent-read performance
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS analyses (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    jobTitle           TEXT    NOT NULL DEFAULT '',
    companyName        TEXT    NOT NULL DEFAULT '',
    matchScore         INTEGER NOT NULL,
    resumeSource       TEXT    NOT NULL DEFAULT '',
    matchedSkills      TEXT    NOT NULL DEFAULT '[]',
    missingSkills      TEXT    NOT NULL DEFAULT '[]',
    resumeEvidence     TEXT    NOT NULL DEFAULT '[]',
    recommendations    TEXT    NOT NULL DEFAULT '[]',
    learningRoadmap    TEXT    NOT NULL DEFAULT '[]',
    interviewQuestions TEXT    NOT NULL DEFAULT '[]',
    createdAt          TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

console.log(`SQLite database ready at: ${DB_PATH}`);

// Allow payloads up to 15MB for PDF base64 handling
app.use(express.json({ limit: '15mb' }));

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

// POST endpoint for resume analysis using real Gemini API
app.post('/api/analyze-resume', async (req, res) => {
  try {
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

    // Check Gemini API key configuration (supports 'resumeAnalyzer' or 'GEMINI_API_KEY')
    const apiKey =
      process.env.resumeAnalyzer ||
      process.env.GEMINI_API_KEY ||
      process.env.RESUME_ANALYZER ||
      process.env.RESUMEANALYZER;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      return res.status(503).json({
        error:
          'Gemini API key is not configured on the server. Please ensure your secret (resumeAnalyzer or GEMINI_API_KEY) is added in the AI Studio Settings > Secrets panel.',
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
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
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
              temperature: 0.3,
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
            // Wait 1.2s before quick retry on high-demand spike
            await new Promise((resolve) => setTimeout(resolve, 1200));
            continue;
          } else {
            // Move to next candidate model
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

    // ─── Persist the analysis to SQLite ───────────────────────────────────────
    // Extract a best-effort job title and company from the job description
    const jdLines = jobDescription.trim().split('\n').map((l: string) => l.trim()).filter(Boolean);
    const titleLine  = jdLines.find((l: string) => /^role[:\s]/i.test(l))   || jdLines[0] || 'Unknown Role';
    const companyLine = jdLines.find((l: string) => /^company[:\s]/i.test(l)) || '';
    const jobTitle   = titleLine.replace(/^role[:\s]*/i, '').trim().slice(0, 200);
    const companyName = companyLine.replace(/^company[:\s]*/i, '').trim().slice(0, 200);
    const resumeSource = fileBase64 ? fileName : 'Pasted Text';

    let savedId: number | null = null;
    try {
      const insert = db.prepare(`
        INSERT INTO analyses
          (jobTitle, companyName, matchScore, resumeSource,
           matchedSkills, missingSkills, resumeEvidence,
           recommendations, learningRoadmap, interviewQuestions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = insert.run(
        jobTitle,
        companyName,
        parsedResult.matchScore ?? 0,
        resumeSource,
        JSON.stringify(parsedResult.matchedSkills    ?? []),
        JSON.stringify(parsedResult.missingSkills    ?? []),
        JSON.stringify(parsedResult.resumeEvidence   ?? []),
        JSON.stringify(parsedResult.recommendations  ?? []),
        JSON.stringify(parsedResult.learningRoadmap  ?? []),
        JSON.stringify(parsedResult.interviewQuestions ?? []),
      );
      savedId = Number(info.lastInsertRowid);
    } catch (dbErr) {
      // Log but do not fail the response — the analysis itself succeeded
      console.error('Failed to save analysis to SQLite:', dbErr);
    }
    // ──────────────────────────────────────────────────────────────────────────

    // Return the verified analysis data
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

    // Handle quota limits and specific API errors gracefully
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
// Analysis History Routes
// ─────────────────────────────────────────────

/** Helper: parse JSON columns and convert a raw DB row to a typed object */
function rowToAnalysis(row: any) {
  return {
    id:                 row.id,
    jobTitle:           row.jobTitle,
    companyName:        row.companyName,
    matchScore:         row.matchScore,
    resumeSource:       row.resumeSource,
    createdAt:          row.createdAt,
    matchedSkills:      JSON.parse(row.matchedSkills     || '[]'),
    missingSkills:      JSON.parse(row.missingSkills     || '[]'),
    resumeEvidence:     JSON.parse(row.resumeEvidence    || '[]'),
    recommendations:    JSON.parse(row.recommendations   || '[]'),
    learningRoadmap:    JSON.parse(row.learningRoadmap   || '[]'),
    interviewQuestions: JSON.parse(row.interviewQuestions || '[]'),
  };
}

/** GET /api/analyses — list all analyses, newest first */
app.get('/api/analyses', (_req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM analyses ORDER BY id DESC'
    ).all();
    return res.json({ success: true, data: rows.map(rowToAnalysis) });
  } catch (err: any) {
    console.error('GET /api/analyses error:', err);
    return res.status(500).json({ error: 'Failed to retrieve analyses.' });
  }
});

/** GET /api/analyses/:id — fetch one analysis in full */
app.get('/api/analyses/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid analysis ID.' });
  }
  try {
    const row = db.prepare('SELECT * FROM analyses WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({ error: 'Analysis not found.' });
    }
    return res.json({ success: true, data: rowToAnalysis(row) });
  } catch (err: any) {
    console.error('GET /api/analyses/:id error:', err);
    return res.status(500).json({ error: 'Failed to retrieve analysis.' });
  }
});

/** DELETE /api/analyses/:id — delete one analysis */
app.delete('/api/analyses/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid analysis ID.' });
  }
  try {
    const info = db.prepare('DELETE FROM analyses WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Analysis not found.' });
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/analyses/:id error:', err);
    return res.status(500).json({ error: 'Failed to delete analysis.' });
  }
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

  app.listen(port, '0.0.0.0', () => {
    console.log(`SkillBridge AI full-stack server running on http://0.0.0.0:${port}`);
  });
}

startServer();
