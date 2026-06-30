import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { parseCode } from './ast-parser.js';
import { explainCode, explainCodeStreaming } from './llm-service.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50kb' }));

// Rate limiting — 20 requests per minute per IP
const explainLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a minute before trying again.' },
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Shared validation for explain requests. Returns { code, language } or sends an error response.
 */
function validateExplainRequest(req, res) {
  const { code, language } = req.body;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "code" field. Must be a non-empty string.' });
    return null;
  }

  if (!['python', 'javascript'].includes(language)) {
    res.status(400).json({ error: 'Invalid "language". Must be "python" or "javascript".' });
    return null;
  }

  if (code.length > 10000) {
    res.status(400).json({ error: 'Code snippet too long. Maximum 10,000 characters.' });
    return null;
  }

  return { code: code.trim(), language };
}

/**
 * Runs AST parsing, returns { astAnnotations, astFallback }.
 * AST failure is non-fatal — sets astFallback: true when annotations are unavailable.
 */
async function runAstParsing(code, language) {
  let astAnnotations = [];
  let astFallback = false;

  try {
    astAnnotations = await parseCode(code, language);
    console.log(`[AST] Found ${astAnnotations.length} structural elements`);
    if (astAnnotations.length === 0) {
      astFallback = true;
    }
  } catch (astError) {
    console.warn(`[AST] Parsing failed (non-fatal): ${astError.message}`);
    astAnnotations = [];
    astFallback = true;
  }

  return { astAnnotations, astFallback };
}

/**
 * POST /api/explain
 * Body: { code: string, language: "python" | "javascript" }
 * Returns: { explanation, annotations, optimizedCode, complexity, optimizationNotes, astFallback }
 */
app.post('/api/explain', explainLimiter, async (req, res) => {
  try {
    const validated = validateExplainRequest(req, res);
    if (!validated) return;
    const { code, language } = validated;

    // Step 1: Parse AST to extract structural annotations
    console.log(`[AST] Parsing ${language} code (${code.length} chars)...`);
    const { astAnnotations, astFallback } = await runAstParsing(code, language);

    // Step 2: Send to LLM with AST context
    console.log(`[LLM] Sending to Gemini...`);
    const result = await explainCode(code, language, astAnnotations);
    console.log(`[LLM] Explanation generated successfully`);

    res.json({
      success: true,
      data: {
        ...result,
        astAnnotations,
        astFallback,
        language,
        codeLength: code.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[ERROR]', error.message);

    if (error.message.includes('API key')) {
      return res.status(500).json({ error: 'Gemini API key is missing or invalid. Set GEMINI_API_KEY in .env' });
    }

    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/explain/stream
 * Server-Sent Events endpoint for streaming explanations.
 * Body: { code: string, language: "python" | "javascript" }
 *
 * Events sent:
 *   data: {"type":"ast","astAnnotations":[...],"astFallback":false}
 *   data: {"type":"chunk","content":"..."}       // partial JSON from LLM
 *   data: {"type":"complete","data":{...}}        // final parsed result
 *   data: {"type":"error","error":"..."}
 */
app.post('/api/explain/stream', explainLimiter, async (req, res) => {
  const validated = validateExplainRequest(req, res);
  if (!validated) return;
  const { code, language } = validated;

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Step 1: AST parsing (send immediately so UI can show annotations while LLM streams)
    console.log(`[AST] Parsing ${language} code (${code.length} chars)...`);
    const { astAnnotations, astFallback } = await runAstParsing(code, language);
    sendEvent({ type: 'ast', astAnnotations, astFallback });

    // Step 2: Stream LLM response
    console.log(`[LLM] Streaming from Gemini...`);
    const result = await explainCodeStreaming(code, language, astAnnotations, (chunk) => {
      sendEvent({ type: 'chunk', content: chunk });
    });
    console.log(`[LLM] Stream complete`);

    // Step 3: Send final parsed result
    sendEvent({
      type: 'complete',
      data: {
        ...result,
        astAnnotations,
        astFallback,
        language,
        codeLength: code.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[STREAM ERROR]', error.message);
    sendEvent({ type: 'error', error: error.message });
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 AI Code Explainer API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   API Key: ${(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) ? '✅ Configured' : '❌ Missing — set GEMINI_API_KEY in .env'}\n`);
});
