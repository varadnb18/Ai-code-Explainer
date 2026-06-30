import { useState, useCallback, useEffect, useRef } from 'react';
import CodeEditor from './components/CodeEditor';
import ExplanationPanel from './components/ExplanationPanel';
import HistorySidebar from './components/HistorySidebar';

const API_URL = 'http://localhost:3001/api';

// Load history from localStorage
function loadHistory() {
  try {
    const stored = localStorage.getItem('code-explainer-history');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save history to localStorage
function saveHistory(history) {
  try {
    localStorage.setItem('code-explainer-history', JSON.stringify(history));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export default function App() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(loadHistory);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortRef = useRef(null);

  // Persist history changes
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // Submit code for explanation (streaming via SSE)
  const handleSubmit = useCallback(async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setStreamingText('');
    setResult(null);

    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${API_URL}/explain/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), language }),
        signal: controller.signal,
      });

      if (!response.ok) {
        // Fallback: if streaming endpoint fails, try non-streaming
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamedContent = '';
      let astData = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === 'ast') {
              astData = {
                astAnnotations: event.astAnnotations,
                astFallback: event.astFallback,
              };
            } else if (event.type === 'chunk') {
              streamedContent += event.content;
              setStreamingText(streamedContent);
            } else if (event.type === 'complete') {
              const finalResult = event.data;

              setResult(finalResult);
              setStreamingText('');

              const entry = {
                id: Date.now().toString(),
                code: code.trim(),
                language,
                result: finalResult,
                timestamp: new Date().toISOString(),
              };
              setHistory((prev) => [entry, ...prev]);
              setActiveHistoryId(entry.id);
            } else if (event.type === 'error') {
              throw new Error(event.error);
            }
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.includes('JSON')) {
              throw parseErr; // Re-throw actual errors, not JSON parse failures
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;

      // Fallback to non-streaming if SSE fails
      try {
        const response = await fetch(`${API_URL}/explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code.trim(), language }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to explain code');

        const entry = {
          id: Date.now().toString(),
          code: code.trim(),
          language,
          result: data.data,
          timestamp: new Date().toISOString(),
        };
        setResult(data.data);
        setHistory((prev) => [entry, ...prev]);
        setActiveHistoryId(entry.id);
      } catch (fallbackErr) {
        setError(fallbackErr.message);
      }
    } finally {
      setLoading(false);
      setStreamingText('');
    }
  }, [code, language]);

  // Select a history item
  const handleSelectHistory = useCallback((entry) => {
    setCode(entry.code);
    setLanguage(entry.language);
    setResult(entry.result);
    setActiveHistoryId(entry.id);
    setError(null);
    setSidebarOpen(false);
  }, []);

  // Clear all history
  const handleClearHistory = useCallback(() => {
    setHistory([]);
    setActiveHistoryId(null);
  }, []);

  return (
    <div className="app">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <HistorySidebar
          history={history}
          activeId={activeHistoryId}
          onSelect={handleSelectHistory}
          onClear={handleClearHistory}
        />
      </aside>

      {/* Main Content */}
      <main className="app-main">
        {/* Header */}
        <header className="header">
          <div className="header-brand">
            <button
              className="header-menu-btn"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Toggle history sidebar"
            >
              ☰
            </button>
            <div className="header-logo">⚡</div>
            <div>
              <div className="header-title">Code Explainer</div>
              <div className="header-subtitle">AI-Powered • AST-Enhanced</div>
            </div>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="error-banner">
            <span className="error-banner-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Content Grid */}
        <div className="content-area">
          {/* Left Panel: Code Editor */}
          <div className="panel">
            <CodeEditor
              code={code}
              language={language}
              onCodeChange={setCode}
              onLanguageChange={setLanguage}
              onSubmit={handleSubmit}
              loading={loading}
            />
          </div>

          {/* Right Panel: Explanation */}
          <div className="panel">
            <ExplanationPanel
              result={result}
              originalCode={code}
              language={language}
              streamingText={streamingText}
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
