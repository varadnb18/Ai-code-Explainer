import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';

/**
 * HeroSection — The thesis section with live-typing demo.
 * Left pane: Monaco types out mergeSort character-by-character.
 * Right pane: annotation chips fade in as typing reaches AST boundaries.
 */

// The real mergeSort example from the README
const DEMO_CODE = `function mergeSort(arr) {
  if (arr.length <= 1) {
    return arr;
  }

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left, right) {
  const result = [];

  while (left.length && right.length) {
    if (left[0] <= right[0]) {
      result.push(left.shift());
    } else {
      result.push(right.shift());
    }
  }

  return [...result, ...left, ...right];
}`;

// AST annotations that appear as typing progresses
const ANNOTATIONS = [
  { charThreshold: 25,  type: 'function',    label: 'FUNCTION',    detail: 'mergeSort(arr)', nodeClass: 'node-function' },
  { charThreshold: 52,  type: 'conditional',  label: 'CONDITIONAL', detail: 'if (arr.length <= 1)', nodeClass: 'node-conditional' },
  { charThreshold: 250, type: 'function',    label: 'FUNCTION',    detail: 'merge(left, right)', nodeClass: 'node-function' },
  { charThreshold: 310, type: 'loop',        label: 'WHILE LOOP',  detail: 'while (left.length && right.length)', nodeClass: 'node-loop' },
  { charThreshold: 340, type: 'conditional',  label: 'CONDITIONAL', detail: 'if (left[0] <= right[0])', nodeClass: 'node-conditional' },
];

const TYPING_SPEED = 18; // ms per character — fast enough to feel snappy
const EXPLANATION_TEXT = 'This code implements merge sort — a divide-and-conquer algorithm that splits an array in half, recursively sorts each half, then merges the sorted halves back together in O(n log n) time.';

export default function HeroSection({ onNavigate }) {
  const [typedLength, setTypedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const timerRef = useRef(null);
  const editorRef = useRef(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setPrefersReducedMotion(true);
      setTypedLength(DEMO_CODE.length);
      setIsComplete(true);
      setShowExplanation(true);
    }

    const handler = (e) => {
      if (e.matches) {
        setPrefersReducedMotion(true);
        skipToEnd();
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Typing animation
  useEffect(() => {
    if (prefersReducedMotion || isComplete) return;

    if (typedLength < DEMO_CODE.length) {
      timerRef.current = setTimeout(() => {
        setTypedLength((prev) => prev + 1);
      }, TYPING_SPEED);
    } else {
      setIsComplete(true);
      setTimeout(() => setShowExplanation(true), 400);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [typedLength, isComplete, prefersReducedMotion]);

  const skipToEnd = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTypedLength(DEMO_CODE.length);
    setIsComplete(true);
    setShowExplanation(true);
  }, []);

  const displayedCode = DEMO_CODE.slice(0, typedLength);
  const visibleAnnotations = ANNOTATIONS.filter((a) => typedLength >= a.charThreshold);

  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.updateOptions({ readOnly: true });
  }, []);

  return (
    <section className="hero" id="hero">
      <div className="hero-inner">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            AST-Grounded Code Analysis
          </div>

          <h1 className="hero-heading">
            The AST is parsed <em>before</em> the model sees the prompt
          </h1>

          <p className="hero-subheading">
            Real compilers verify your code's structure first — then the LLM explains
            what it actually does, not what it imagines.
          </p>

          <div className="hero-ctas">
            <a
              href="https://github.com/varadnb18/Ai-code-Explainer"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              View on GitHub ↗
            </a>
            <button
              className="btn-secondary"
              onClick={() => onNavigate('architecture')}
            >
              Read the architecture ↓
            </button>
          </div>
        </div>

        {/* Live Demo */}
        <div
          className="hero-demo"
          onClick={!isComplete ? skipToEnd : undefined}
          role={!isComplete ? 'button' : undefined}
          tabIndex={!isComplete ? 0 : undefined}
          onKeyDown={!isComplete ? (e) => e.key === 'Enter' && skipToEnd() : undefined}
          aria-label={!isComplete ? 'Click to skip typing animation' : undefined}
        >
          {/* Left: Code typing */}
          <div className="hero-demo-pane">
            <div className="hero-demo-pane-header">
              <span className="hero-demo-pane-header-dot" style={{ background: 'var(--node-function)' }} />
              Code Input — JavaScript
            </div>
            <div className="hero-demo-code">
              <Editor
                height="340px"
                language="javascript"
                value={displayedCode}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  padding: { top: 12, bottom: 12 },
                  renderLineHighlight: 'none',
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                  domReadOnly: true,
                }}
              />
            </div>
            {!isComplete && (
              <span className="hero-skip-hint">click to skip</span>
            )}
          </div>

          {/* Right: AST annotations */}
          <div className="hero-demo-pane" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="hero-demo-pane-header">
              <span className="hero-demo-pane-header-dot" style={{ background: 'var(--node-conditional)' }} />
              AST Annotations
            </div>
            <div className="hero-annotations-list">
              {visibleAnnotations.length === 0 && !isComplete && (
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  opacity: 0.5,
                  padding: 'var(--space-4)',
                }}>
                  Parsing AST nodes...
                </div>
              )}
              {visibleAnnotations.map((ann, i) => (
                <div
                  key={i}
                  className={`hero-annotation-chip ${ann.nodeClass}`}
                  style={{
                    animation: prefersReducedMotion ? 'none' : 'fadeSlideIn 0.4s ease-out',
                  }}
                >
                  <span>{ann.label}</span>
                  <span className="hero-annotation-detail">{ann.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Explanation line */}
        {showExplanation && (
          <div
            className="hero-explanation"
            style={{
              animation: prefersReducedMotion ? 'none' : 'fadeSlideIn 0.5s ease-out',
              background: 'var(--ink-surface)',
              borderRadius: 'var(--radius-md)',
              marginTop: 'var(--space-4)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span style={{ color: 'var(--node-conditional)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 'var(--space-2)' }}>
              ✓ Explanation
            </span>
            {EXPLANATION_TEXT}
          </div>
        )}
      </div>
    </section>
  );
}
