import OpenAI from 'openai';
import { buildSystemPrompt, buildUserPrompt } from './prompt-builder.js';

/**
 * LLM Service — Sends code + AST annotations to Google Gemini (or OpenAI) and parses the response.
 *
 * Uses Google Gemini (via OpenAI-compatibility layer) or GPT-4o-mini with JSON mode.
 * Temperature is set to 0.2 for deterministic, factual responses.
 */

let openaiClient = null;

function getClient() {
  if (!openaiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'AIzaSy-your-api-key-here' || apiKey === 'sk-your-api-key-here') {
      throw new Error('API key not configured. Set GEMINI_API_KEY in .env file.');
    }

    // Auto-detect if key is a Google Gemini key.
    // Gemini keys from Google AI Studio typically start with 'AIzaSy' or other patterns.
    // OpenAI keys typically start with 'sk-'.
    const isGemini = apiKey.startsWith('AIza') || apiKey.startsWith('AQ') || !apiKey.startsWith('sk-');

    if (isGemini) {
      console.log('[LLM] Using Gemini API key and routing to Gemini OpenAI-compatibility layer.');
      openaiClient = new OpenAI({
        apiKey,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      });
      openaiClient.isGemini = true;
    } else {
      console.log('[LLM] Using OpenAI API key.');
      openaiClient = new OpenAI({ apiKey });
      openaiClient.isGemini = false;
    }
  }
  return openaiClient;
}

/**
 * Parse and validate the LLM's JSON response, with safe defaults.
 */
function parseResponse(content, fallbackCode) {
  const parsed = JSON.parse(content);

  return {
    explanation: parsed.explanation || 'Unable to generate explanation.',
    optimizedCode: parsed.optimizedCode || fallbackCode,
    complexity: parsed.complexity || {
      time: 'Not determinable from this snippet alone',
      space: 'Not determinable from this snippet alone',
    },
    optimizationNotes: parsed.optimizationNotes || 'No optimization notes available.',
  };
}

/**
 * Send code to the LLM for explanation, optimization, and complexity analysis.
 * (Standard non-streaming mode)
 *
 * @param {string} code - The source code to explain
 * @param {string} language - "python" or "javascript"
 * @param {Array} astAnnotations - Structural annotations from AST parsing
 * @returns {Promise<Object>} { explanation, optimizedCode, complexity, optimizationNotes }
 */
export async function explainCode(code, language, astAnnotations) {
  const client = getClient();

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(code, language, astAnnotations);

  const modelName = client.isGemini ? 'gemini-2.5-flash' : 'gpt-4o-mini';

  const response = await client.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from LLM');
  }

  try {
    return parseResponse(content, code);
  } catch (parseError) {
    console.error('[LLM] Failed to parse JSON response:', content);
    throw new Error('Failed to parse LLM response as JSON');
  }
}

/**
 * Stream code explanation from the LLM via Server-Sent Events.
 *
 * Collects the full JSON string from chunks, then parses it.
 * Calls `onChunk(text)` for each delta to relay to the client.
 *
 * @param {string} code - The source code to explain
 * @param {string} language - "python" or "javascript"
 * @param {Array} astAnnotations - Structural annotations from AST parsing
 * @param {Function} onChunk - Callback receiving each text delta
 * @returns {Promise<Object>} Final parsed result
 */
export async function explainCodeStreaming(code, language, astAnnotations, onChunk) {
  const client = getClient();

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(code, language, astAnnotations);

  const modelName = client.isGemini ? 'gemini-2.5-flash' : 'gpt-4o-mini';

  const stream = await client.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 2000,
    stream: true,
  });

  let fullContent = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      fullContent += delta;
      onChunk(delta);
    }
  }

  if (!fullContent) {
    throw new Error('Empty response from LLM stream');
  }

  try {
    return parseResponse(fullContent, code);
  } catch (parseError) {
    console.error('[LLM] Failed to parse streamed JSON response:', fullContent);
    throw new Error('Failed to parse LLM response as JSON');
  }
}
