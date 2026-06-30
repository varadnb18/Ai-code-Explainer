/**
 * FeaturesSection — MVP features, bonus features, and tech stack chips.
 * No numbered markers (not a genuine sequence). Text chips only (no fake logos).
 */
export default function FeaturesSection({ sectionRef }) {
  const mvpFeatures = [
    'Accept Python and JavaScript code input',
    'AI-generated plain-English explanation (2–4 sentences)',
    'Syntax-highlighted code with key structure annotations',
    'Submit multiple snippets with full history (localStorage)',
  ];

  const bonusFeatures = [
    'AST Pre-Parsing: Babel parser (JS) + Python ast module for structural analysis before LLM call',
    'Diff View: Monaco Diff Editor comparing original code vs. AI-optimized version',
    'Complexity Analysis: Time and space complexity badges',
    'Annotated Code View: Color-coded gutter markers for functions, loops, conditionals, classes',
    'Optimization Notes: Explanation of what was changed and why',
  ];

  const techStack = {
    Frontend: ['React', 'Vite', 'Monaco Editor', 'Prism.js'],
    Backend: ['Node.js', 'Express', '@babel/parser', '@babel/traverse', 'Python ast'],
    AI: ['Gemini 2.5 Flash'],
  };

  const groupColorClass = {
    Frontend: 'frontend',
    Backend: 'backend',
    AI: 'ai',
  };

  return (
    <section className="features-section" ref={sectionRef} id="features">
      <div className="section-container">
        <div className="section-eyebrow">Features & Stack</div>
        <h2 className="section-heading">What's built</h2>

        <div className="features-grid">
          {/* MVP Features */}
          <div className="features-column">
            <div className="features-column-title mvp">MVP Features</div>
            {mvpFeatures.map((f, i) => (
              <div key={i} className="feature-item">
                <span className="feature-check mvp">✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>

          {/* Bonus Features */}
          <div className="features-column">
            <div className="features-column-title bonus">Bonus Features</div>
            {bonusFeatures.map((f, i) => (
              <div key={i} className="feature-item">
                <span className="feature-check bonus">✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="tech-stack">
          <h3 className="tech-stack-title">Tech Stack</h3>
          {Object.entries(techStack).map(([group, items]) => (
            <div key={group} className="tech-stack-group">
              <div className="tech-stack-group-label">{group}</div>
              <div className="tech-chips">
                {items.map((item) => (
                  <span key={item} className={`tech-chip ${groupColorClass[group]}`}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
