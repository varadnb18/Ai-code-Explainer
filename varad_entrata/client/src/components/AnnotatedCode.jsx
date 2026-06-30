import { useState, useMemo, useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';

/**
 * AnnotatedCode — Renders code with AST-based colored line markers and hover tooltips.
 *
 * Each line that falls within an AST annotation's range gets a colored gutter marker.
 * Hovering over annotated lines shows a tooltip with the annotation details.
 */
export default function AnnotatedCode({ code, annotations, language, astFallback }) {
  const [hoveredLine, setHoveredLine] = useState(null);
  const codeRef = useRef(null);

  // Split code into lines and apply syntax highlighting
  const highlightedLines = useMemo(() => {
    if (!code) return [];

    const prismLang = language === 'python' ? 'python' : 'javascript';
    const grammar = Prism.languages[prismLang];

    if (!grammar) {
      // Fallback: no syntax highlighting
      return code.split('\n').map((line) => line);
    }

    // Highlight the entire code block
    const highlighted = Prism.highlight(code, grammar, prismLang);
    return highlighted.split('\n');
  }, [code, language]);

  // Build a map: lineNumber → [annotations] for quick lookup
  const lineAnnotationMap = useMemo(() => {
    const map = {};
    if (!annotations) return map;

    for (const ann of annotations) {
      for (let line = ann.startLine; line <= ann.endLine; line++) {
        if (!map[line]) map[line] = [];
        map[line].push(ann);
      }
    }
    return map;
  }, [annotations]);

  // Get unique annotation types for the legend
  const legendTypes = useMemo(() => {
    if (!annotations) return [];
    const types = new Set(annotations.map((a) => a.type));
    return Array.from(types);
  }, [annotations]);

  // Human-readable type labels
  const typeLabels = {
    function: 'Function',
    class: 'Class',
    loop: 'Loop',
    conditional: 'Conditional',
    error_handling: 'Error Handling',
    return: 'Return',
    import: 'Import',
    comprehension: 'Comprehension',
    context_manager: 'Context Manager',
  };

  if (!code) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📝</div>
        <div className="empty-state-title">No code to annotate</div>
      </div>
    );
  }

  return (
    <div>
      {/* AST fallback warning */}
      {(astFallback || (!annotations || annotations.length === 0)) && (
        <div className="ast-fallback-banner" style={{ margin: '0 0 12px 0' }}>
          <span className="ast-fallback-icon">⚠️</span>
          <div>
            <strong>AST annotations unavailable</strong> — Code structure parsing failed or found no
            structures to annotate. Syntax highlighting is still applied, but no structural markers
            are shown.
          </div>
        </div>
      )}
      <div className="annotated-code" ref={codeRef}>
        {highlightedLines.map((lineHtml, index) => {
          const lineNum = index + 1;
          const lineAnns = lineAnnotationMap[lineNum];
          const isHighlighted = !!lineAnns;
          // Use the first (most important) annotation for the marker color
          const primaryAnn = lineAnns ? lineAnns[0] : null;
          const isHovered = hoveredLine === lineNum;

          return (
            <div
              key={lineNum}
              className={`annotated-line ${isHighlighted ? 'highlighted' : ''}`}
              onMouseEnter={() => isHighlighted && setHoveredLine(lineNum)}
              onMouseLeave={() => setHoveredLine(null)}
              style={isHighlighted ? {
                background: isHovered
                  ? `var(--ann-${primaryAnn.type}-bg)`
                  : undefined,
              } : undefined}
            >
              {/* Annotation gutter marker */}
              <div
                className={`line-annotation-marker ${primaryAnn ? primaryAnn.type : ''}`}
                style={{ opacity: isHighlighted ? 1 : 0 }}
              />

              {/* Line number */}
              <span className="line-number">{lineNum}</span>

              {/* Code content (with Prism HTML) */}
              <span
                className="line-content"
                dangerouslySetInnerHTML={{ __html: lineHtml || '&nbsp;' }}
              />

              {/* Tooltip on hover */}
              {isHovered && lineAnns && (
                <div className="annotation-tooltip">
                  {lineAnns.map((ann, i) => (
                    <div key={i} style={{ marginBottom: i < lineAnns.length - 1 ? '4px' : 0 }}>
                      <span className={`annotation-tooltip-type ${ann.type}`}>
                        {typeLabels[ann.type] || ann.type}
                      </span>
                      <span>{ann.details}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {legendTypes.length > 0 && (
        <div className="annotation-legend">
          {legendTypes.map((type) => (
            <div key={type} className="legend-item">
              <div className={`legend-dot ${type}`} />
              <span>{typeLabels[type] || type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
