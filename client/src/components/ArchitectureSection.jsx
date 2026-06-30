import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ArchitectureSection — Interactive 3-layer architecture diagram.
 * Panels expand on click to show sub-parts with tree-rule connectors.
 */

const layers = [
  {
    id: 'frontend',
    label: 'Frontend',
    colorClass: 'frontend',
    title: 'React + Vite',
    desc: 'Component-based UI with Monaco Editor for VS Code-quality editing.',
    subparts: [
      { name: 'Monaco Editor', desc: 'VS Code-quality code input with syntax highlighting and autocomplete', connector: '├─' },
      { name: 'History Sidebar', desc: 'localStorage-backed snippet history for reviewing past submissions', connector: '├─' },
      { name: 'Explanation Panel', desc: 'Tabbed results: plain-English, annotated code, and diff views', connector: '└─' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    colorClass: 'backend',
    title: 'Node.js + Express',
    desc: 'RESTful API that parses code structure before sending to the model.',
    subparts: [
      { name: 'AST Parser', desc: 'Babel parser for JavaScript, Python ast module via child process', connector: '├─' },
      { name: 'LLM Service', desc: 'Builds prompt with verified AST facts, sends to Gemini, parses JSON response', connector: '└─' },
    ],
  },
  {
    id: 'llm',
    label: 'Model',
    colorClass: 'llm',
    title: 'Gemini 2.5 Flash',
    desc: 'Generates explanation, optimized code, and complexity analysis.',
    subparts: [
      { name: 'Temperature 0.2', desc: 'Deterministic output — favors accuracy over creativity', connector: '├─' },
      { name: 'JSON Mode', desc: 'Structured response format prevents rambling or off-topic output', connector: '├─' },
      { name: 'AST-Grounded Prompt', desc: 'Verified structural facts injected before generation begins', connector: '└─' },
    ],
  },
];

export default function ArchitectureSection({ sectionRef }) {
  const [expanded, setExpanded] = useState(null);

  const toggle = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <section className="arch-section" ref={sectionRef} id="architecture">
      <div className="section-container">
        <div className="section-eyebrow">System Architecture</div>
        <h2 className="section-heading">Three layers, one pipeline</h2>
        <p className="section-subheading" style={{ marginBottom: 'var(--space-12)' }}>
          Code is parsed by real AST tools before the model ever sees it.
          Click each layer to see what's inside.
        </p>

        {/* Connector line above */}
        <div className="arch-connectors">
          <div className="arch-connector-line">
            {'┌──────────┬──────────┬──────────┐\n│          │          │          │'}
          </div>
        </div>

        <div className="arch-diagram">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className={`arch-panel ${layer.colorClass} ${expanded === layer.id ? 'expanded' : ''}`}
              onClick={() => toggle(layer.id)}
              onKeyDown={(e) => e.key === 'Enter' && toggle(layer.id)}
              role="button"
              tabIndex={0}
              aria-expanded={expanded === layer.id}
            >
              <span className={`arch-panel-icon ${layer.colorClass}`}>
                {layer.label}
              </span>
              <div className="arch-panel-title">{layer.title}</div>
              <div className="arch-panel-desc">{layer.desc}</div>

              {expanded !== layer.id && (
                <div className="arch-panel-expand-hint">
                  <span>↓</span> Click to expand
                </div>
              )}

              <AnimatePresence>
                {expanded === layer.id && (
                  <motion.div
                    className="arch-subparts"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    {layer.subparts.map((sub, i) => (
                      <div key={i} className="arch-subpart">
                        <span className="arch-subpart-connector">{sub.connector}</span>
                        <div className="arch-subpart-content">
                          <div className="arch-subpart-name">{sub.name}</div>
                          <div className="arch-subpart-desc">{sub.desc}</div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Connector line below */}
        <div className="arch-connectors">
          <div className="arch-connector-line">
            {'│          │          │          │\n└──────────┴──────────┴──────────┘'}
          </div>
        </div>
      </div>
    </section>
  );
}
