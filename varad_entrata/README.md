# ⚡ AI-Powered Code Explainer

A premium web-based tool that takes Python or JavaScript code snippets as input and generates plain-English explanations using an LLM, enhanced by AST (Abstract Syntax Tree) pre-parsing for grounded, accurate analysis.

![Architecture: React + Express + Gemini](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20Gemini-6366f1?style=for-the-badge)
![Languages: Python & JavaScript](https://img.shields.io/badge/languages-Python%20%26%20JavaScript-10b981?style=for-the-badge)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│                                                              │
│  ┌──────────┐  ┌───────────────────┐  ┌─────────────────┐  │
│  │ History   │  │   Monaco Editor   │  │  Explanation    │  │
│  │ Sidebar   │  │   (Code Input)    │  │  Panel          │  │
│  │           │  │                   │  │  • Plain-English│  │
│  │ localStorage│ │  JS / Python     │  │  • Annotated    │  │
│  │ backed    │  │  language toggle  │  │  • Diff View    │  │
│  │           │  │                   │  │  • Complexity   │  │
│  └──────────┘  └─────────┬─────────┘  └────────▲────────┘  │
│                          │                      │            │
└──────────────────────────┼──────────────────────┼────────────┘
                           │ POST /api/explain    │ JSON response
                           ▼                      │
┌──────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)                │
│                                                              │
│  ┌─────────────────┐    ┌──────────────────────────────────┐│
│  │   AST Parser     │    │        LLM Service               ││
│  │                  │    │                                  ││
│  │  JavaScript:     │───▶│  1. Build prompt with AST context││
│  │  @babel/parser   │    │  2. Send to Gemini 2.5 Flash    ││
│  │  @babel/traverse │    │  3. Parse JSON response          ││
│  │                  │    │  4. Return structured result     ││
│  │  Python:         │    │                                  ││
│  │  ast module      │    │  Temperature: 0.2 (deterministic)││
│  │  (child_process) │    │  JSON mode: enabled              ││
│  └─────────────────┘    └──────────────────────────────────┘│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User pastes code** in the Monaco Editor and selects language (JS/Python)
2. **Frontend sends** `POST /api/explain` with `{ code, language }`
3. **Backend parses AST** using `@babel/parser` (JS) or Python's `ast` module
4. **AST annotations** are extracted: functions, classes, loops, conditionals, imports, etc.
5. **Prompt is built** combining raw code + verified AST structural facts
6. **Gemini 2.5 Flash** generates explanation, optimized code, and complexity analysis
7. **Response is returned** with explanation, AST annotations, optimized code, and complexity
8. **Frontend displays** results across three views: Explanation, Annotated Code, and Diff View

---

## 🧠 AI Tool Selection & Reasoning

### Why Google Gemini 2.5 Flash?

| Factor | Gemini 2.5 Flash | Why It Wins |
|--------|------------------|-------------|
| **Speed** | ~1s response time | Fast enough for interactive use, often faster than GPT-4o-mini |
| **Cost** | Free tier / low cost | Extremely accessible via Google AI Studio, great for development |
| **Code Understanding** | Excellent | Multi-modal model trained on vast code corpora, understands Python & JS |
| **JSON Mode** | Native support | Supported via OpenAI-compatible endpoints, ensuring structured outputs |
| **Accuracy** | Very high for code tasks | Comparable to OpenAI models for code explanation specifically |

### Why Not Others?

- **GPT-4o / GPT-4o-mini**: Overkill or requires paid OpenAI API access, whereas Gemini offers a generous free tier for developers.
- **Claude**: Excellent but requires tool/function calling setup to guarantee JSON schemas, adding complexity for a time-boxed project.
- **Local models (Llama, CodeLlama)**: Too slow for an interactive web app, require dedicated GPU infrastructure.

---

## 🛡️ Hallucination & Code Accuracy Strategy

This is the most critical aspect of the system. We use a **multi-layered approach**:

### 1. AST Grounding (Primary Defense)

Before sending code to the LLM, we parse it with real AST tools and inject **verified structural facts** into the prompt:

```
--- AST STRUCTURAL ANALYSIS ---
• [Lines 1-5] FUNCTION: Function "mergeSort" with 1 parameter(s): (arr)
• [Lines 3-4] CONDITIONAL: If statement
• [Lines 7-12] FUNCTION: Function "merge" with 2 parameter(s): (left, right)
• [Lines 8-11] LOOP: While loop
```

This means the LLM can't invent functions that don't exist or miscount parameters — the facts are already in the prompt.

### 2. Structured JSON Output

We force `response_format: { type: "json_object" }`, requiring the LLM to fill specific fields. This prevents:
- Rambling or off-topic explanations
- Made-up code features
- Unsupported claims

### 3. Low Temperature (0.2)

Temperature 0.2 makes the model highly deterministic, favoring the most likely (and therefore most accurate) response over creative but potentially wrong alternatives.

### 4. Explicit Uncertainty Instructions

The system prompt explicitly instructs:
> *"If you cannot determine the complexity, say 'Not determinable from this snippet alone' — NEVER guess."*

This prevents the model from confidently stating incorrect complexity values.

### 5. Line-Accurate Annotations

Code annotations reference exact line numbers from the AST parser, so highlighted regions in the UI **always** correspond to real code structures — never LLM-generated positions.

---

## 🚀 Features

### MVP Features
- ✅ Accept Python and JavaScript code input
- ✅ AI-generated plain-English explanation (2-4 sentences)
- ✅ Syntax-highlighted code with key structure annotations
- ✅ Submit multiple snippets with full history (localStorage)

### Bonus Features
- ✅ **AST Pre-Parsing**: Babel parser (JS) + Python `ast` module for structural analysis before LLM call
- ✅ **Diff View**: Monaco Diff Editor comparing original code vs. AI-optimized version
- ✅ **Complexity Analysis**: Time and space complexity badges
- ✅ **Annotated Code View**: Color-coded gutter markers for functions (blue), loops (orange), conditionals (green), classes (pink), etc.
- ✅ **Optimization Notes**: Explanation of what was changed and why

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + Vite | Component-based UI with fast HMR |
| Code Editor | Monaco Editor | VS Code-quality editing + built-in diff view |
| Syntax Highlighting | Prism.js | Lightweight highlighting for annotated code view |
| Backend | Node.js + Express | RESTful API server |
| JS AST Parser | @babel/parser + @babel/traverse | JavaScript AST extraction |
| Python AST Parser | Python `ast` module (child process) | Python AST extraction |
| LLM | Google Gemini 2.5 Flash | Code explanation + optimization |
| Styling | Vanilla CSS | Glassmorphism dark theme, no framework overhead |
| Persistence | localStorage | Snippet history (client-side) |

---

## 📦 Getting Started

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **Python** 3.8+ (for Python AST parsing — [download](https://python.org/))
- **Gemini API Key** ([get one from Google AI Studio](https://aistudio.google.com/))

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd ai-code-explainer

# 2. Create your .env file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 3. Install all dependencies
npm run install:all

# 4. Start both servers (concurrently)
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

### Manual Start (if preferred)

```bash
# Terminal 1: Start the backend
cd server && npm start

# Terminal 2: Start the frontend
cd client && npm run dev
```

---

## 📁 Project Structure

```
ai-code-explainer/
├── .env.example            # Environment variable template
├── .gitignore
├── package.json            # Root scripts (concurrent dev)
├── README.md
│
├── server/                 # Backend
│   ├── package.json
│   ├── server.js           # Express API server
│   ├── ast-parser.js       # AST parsing (Babel + Python)
│   ├── python_ast.py       # Python AST extraction script
│   ├── prompt-builder.js   # LLM prompt construction
│   └── llm-service.js      # OpenAI API integration
│
└── client/                 # Frontend
    ├── package.json
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx             # Main layout + state management
        ├── index.css           # Design system (dark glassmorphism)
        └── components/
            ├── CodeEditor.jsx      # Monaco Editor wrapper
            ├── ExplanationPanel.jsx # Tabbed results display
            ├── AnnotatedCode.jsx   # AST-highlighted code view
            ├── DiffView.jsx        # Monaco Diff Editor
            └── HistorySidebar.jsx  # Snippet history list
```

---

## 🔌 API Reference

### `POST /api/explain`

**Request:**
```json
{
  "code": "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n-1)",
  "language": "python"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "explanation": "This function calculates the factorial of a number using recursion...",
    "optimizedCode": "def factorial(n):\n    ...",
    "complexity": {
      "time": "O(n)",
      "space": "O(n) due to recursive call stack"
    },
    "optimizationNotes": "Added input validation and an iterative option...",
    "astAnnotations": [
      {
        "type": "function",
        "name": "factorial",
        "startLine": 1,
        "endLine": 4,
        "details": "Function \"factorial\" with 1 parameter(s): (n)"
      }
    ],
    "language": "python",
    "codeLength": 78,
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

### `GET /api/health`

Returns `{ "status": "ok", "timestamp": "..." }`

---

## 🧪 Testing

```bash
# Test the API directly
curl -X POST http://localhost:3001/api/explain \
  -H "Content-Type: application/json" \
  -d '{"code": "const add = (a, b) => a + b;", "language": "javascript"}'

# Health check
curl http://localhost:3001/api/health
```

---

## 📝 Design Decisions

1. **Monorepo structure** (not separate repos) — simpler for a focused project, single `npm run dev` starts everything.

2. **AST parsing before LLM** — The key differentiator. By pre-parsing code with real parsers, we inject verified facts into the prompt, significantly reducing hallucination risk.

3. **Non-fatal AST failures** — If AST parsing fails (syntax errors, missing Python), the LLM is still called without annotations. The explanation may be slightly less grounded but still useful.

4. **Monaco Editor for both input and diff** — Reuses the same editor engine, ensuring consistent behavior and reducing bundle duplication.

5. **localStorage for history** — Simple, no backend needed for persistence. Good enough for a demo; production would use a database.

6. **Vanilla CSS** — Maximum control over the glassmorphism aesthetic without framework constraints.

---

## 📜 License

MIT
