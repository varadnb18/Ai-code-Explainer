/**
 * Prompt Builder — Constructs structured prompts for the LLM.
 *
 * Combines the raw code, language info, and AST annotations into
 * a carefully crafted prompt that produces reliable, grounded explanations.
 */

/**
 * Build the system prompt that defines the LLM's role and output format.
 */
export function buildSystemPrompt() {
  return `You are an expert code analyst. Your job is to analyze code snippets and provide:
1. A clear, plain-English explanation (2-4 sentences) of what the code does
2. An optimized version of the code (if improvements are possible)
3. Time and space complexity analysis
4. Notes about what was optimized and why

CRITICAL RULES:
- Base your explanation ONLY on the actual code provided and the AST annotations. Do not invent functionality that doesn't exist.
- If you cannot determine the complexity, say "Not determinable from this snippet alone" — NEVER guess.
- If the code is already optimal, return the original code as the optimized version and note "Code is already well-optimized."
- Keep explanations accurate and grounded in the actual code structure.
- Reference specific function names, variable names, and constructs that actually exist in the code.
- For the optimized code, preserve the same functionality — only improve readability, performance, or best practices.

You MUST respond in valid JSON with this exact schema:
{
  "explanation": "2-4 sentence plain-English explanation of what the code does",
  "optimizedCode": "the improved version of the code (or original if already optimal)",
  "complexity": {
    "time": "Big-O time complexity (e.g., 'O(n)') or 'Not determinable from this snippet alone'",
    "space": "Big-O space complexity (e.g., 'O(1)') or 'Not determinable from this snippet alone'"
  },
  "optimizationNotes": "1-2 sentences explaining what was changed and why, or 'Code is already well-optimized.'"
}`;
}

/**
 * Build the user prompt that includes the code, language, and AST context.
 *
 * @param {string} code - The raw source code
 * @param {string} language - "python" or "javascript"
 * @param {Array} astAnnotations - Structural annotations from AST parsing
 */
export function buildUserPrompt(code, language, astAnnotations) {
  let prompt = `Analyze this ${language.toUpperCase()} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n`;

  // Include AST context if available — this grounds the LLM in real code structure
  if (astAnnotations && astAnnotations.length > 0) {
    prompt += `\n--- AST STRUCTURAL ANALYSIS ---\nThe following structures were detected by static analysis (these are verified facts about the code):\n\n`;

    for (const ann of astAnnotations) {
      prompt += `• [Lines ${ann.startLine}-${ann.endLine}] ${ann.type.toUpperCase()}: ${ann.details}\n`;
    }

    prompt += `\nUse these verified structural facts to ground your explanation. Reference actual function names, loop constructs, and class definitions found above.\n`;
  } else {
    // No AST annotations available — instruct the LLM to be cautious about complexity
    prompt += `\n--- NOTE ---\nAST structural analysis was not available for this code (parsing failed or returned no structures). Without verified structural data:\n- For complexity analysis, default to "Not determinable without AST verification" unless the complexity is trivially obvious from the code (e.g., a single loop over an array is clearly O(n)).\n- Be extra careful not to invent function names or structures that may not exist.\n- Base your explanation strictly on what you can see in the raw code.\n`;
  }

  prompt += `\nProvide your analysis as a JSON object following the schema in your instructions.`;

  return prompt;
}
