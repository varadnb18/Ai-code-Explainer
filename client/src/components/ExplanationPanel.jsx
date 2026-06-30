import { useState } from 'react';
import AnnotatedCode from './AnnotatedCode';
import DiffView from './DiffView';

/**
 * ExplanationPanel — Displays the LLM explanation, annotated code, complexity, and diff view.
 * Now supports streaming text display and AST fallback indicator.
 */
export default function ExplanationPanel({ result, originalCode, language, streamingText, loading }) {
  const [activeTab, setActiveTab] = useState('explain');

  // Streaming state: show partial content while LLM is generating
  if (!result && loading && streamingText) {
    return (
      <>
        <div className="panel-header">
          <span className="panel-title">
            <span className="panel-title-icon">💡</span>
            Generating...
          </span>
          <div className="streaming-indicator">
            <div className="streaming-dot" />
            <span>Streaming</span>
          </div>
        </div>
        <div className="panel-body">
          <div className="explanation-content">
            <div className="explanation-card">
              <div className="explanation-label">
                💬 AI is analyzing your code...
              </div>
              <div className="explanation-text streaming-text">
                {streamingText}
                <span className="streaming-cursor">▊</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Loading state without streaming text yet
  if (!result && loading) {
    return (
      <>
        <div className="panel-header">
          <span className="panel-title">
            <span className="panel-title-icon">💡</span>
            Analyzing...
          </span>
        </div>
        <div className="panel-body">
          <div className="empty-state">
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            <div className="empty-state-title" style={{ marginTop: 16 }}>Parsing & analyzing code...</div>
            <div className="empty-state-desc">
              Running AST analysis and sending to AI for explanation.
            </div>
          </div>
        </div>
      </>
    );
  }

  // Empty state
  if (!result) {
    return (
      <>
        <div className="panel-header">
          <span className="panel-title">
            <span className="panel-title-icon">💡</span>
            Explanation
          </span>
        </div>
        <div className="panel-body">
          <div className="empty-state">
            <div className="empty-state-icon">🧠</div>
            <div className="empty-state-title">Ready to Explain</div>
            <div className="empty-state-desc">
              Paste a Python or JavaScript code snippet on the left and click
              "Explain This Code" to get an AI-powered analysis.
            </div>
          </div>
        </div>
      </>
    );
  }

  const hasAstFallback = result.astFallback === true;

  return (
    <>
      <div className="panel-header">
        <span className="panel-title">
          <span className="panel-title-icon">💡</span>
          Analysis
        </span>
      </div>

      <div className="panel-body">
        {/* Tabs */}
        <div style={{ padding: '16px 24px 0' }}>
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'explain' ? 'active' : ''}`}
              onClick={() => setActiveTab('explain')}
            >
              📖 Explanation
            </button>
            <button
              className={`tab-btn ${activeTab === 'annotated' ? 'active' : ''}`}
              onClick={() => setActiveTab('annotated')}
            >
              🏷️ Annotated Code
            </button>
            <button
              className={`tab-btn ${activeTab === 'diff' ? 'active' : ''}`}
              onClick={() => setActiveTab('diff')}
            >
              🔀 Diff View
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'explain' && (
          <div className="explanation-content">
            {/* AST Fallback Warning */}
            {hasAstFallback && (
              <div className="ast-fallback-banner">
                <span className="ast-fallback-icon">⚠️</span>
                <div>
                  <strong>AST parsing unavailable</strong> — Structural analysis could not be performed.
                  Complexity estimates may be less reliable.
                </div>
              </div>
            )}

            {/* Explanation Card */}
            <div className="explanation-card">
              <div className="explanation-label">
                💬 What This Code Does
              </div>
              <div className="explanation-text">{result.explanation}</div>
            </div>

            {/* Complexity Badges */}
            {result.complexity && (
              <div className="complexity-container">
                <div className="complexity-badge">
                  <div className="complexity-badge-label">⏱ Time Complexity</div>
                  <div className="complexity-badge-value">
                    {result.complexity.time}
                  </div>
                </div>
                <div className="complexity-badge">
                  <div className="complexity-badge-label">💾 Space Complexity</div>
                  <div className="complexity-badge-value">
                    {result.complexity.space}
                  </div>
                </div>
              </div>
            )}

            {/* Optimization Notes */}
            {result.optimizationNotes && (
              <div className="optimization-card">
                <div className="explanation-label" style={{ color: 'var(--success)' }}>
                  ✨ Optimization Notes
                </div>
                <div className="explanation-text" style={{ color: 'var(--text-secondary)' }}>
                  {result.optimizationNotes}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'annotated' && (
          <div className="explanation-content">
            <AnnotatedCode
              code={originalCode}
              annotations={result.astAnnotations || []}
              language={language}
              astFallback={hasAstFallback}
            />
          </div>
        )}

        {activeTab === 'diff' && (
          <DiffView
            originalCode={originalCode}
            optimizedCode={result.optimizedCode || originalCode}
            language={language}
            optimizationNotes={result.optimizationNotes}
          />
        )}
      </div>
    </>
  );
}
