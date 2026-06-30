/**
 * DefenseSection — Five real hallucination-defense layers from the README,
 * presented as a numbered vertical sequence with cycling node-color accents.
 */

const defenses = [
  {
    number: '01',
    title: 'AST Grounding',
    desc: 'Before sending code to the LLM, we parse it with real AST tools (Babel for JS, Python\'s ast module) and inject verified structural facts into the prompt — the model can\'t invent functions that don\'t exist or miscount parameters.',
  },
  {
    number: '02',
    title: 'Structured JSON Output',
    desc: 'We force response_format: { type: "json_object" }, requiring the LLM to fill specific fields. This prevents rambling, off-topic explanations, and unsupported claims.',
  },
  {
    number: '03',
    title: 'Low Temperature (0.2)',
    desc: 'Temperature 0.2 makes the model highly deterministic, favoring the most likely — and therefore most accurate — response over creative but potentially wrong alternatives.',
  },
  {
    number: '04',
    title: 'Explicit Uncertainty Instructions',
    desc: 'The system prompt instructs: "If you cannot determine the complexity, say \'Not determinable from this snippet alone\' — NEVER guess." This prevents confidently stated incorrect values.',
  },
  {
    number: '05',
    title: 'Line-Accurate Annotations',
    desc: 'Code annotations reference exact line numbers from the AST parser, so highlighted regions in the UI always correspond to real code structures — never LLM-generated positions.',
  },
];

export default function DefenseSection({ sectionRef }) {
  return (
    <section className="defense-section" ref={sectionRef} id="defense-strategy">
      <div className="section-container">
        <div className="section-eyebrow">Hallucination Defense</div>
        <h2 className="section-heading">Five layers, zero guesswork</h2>
        <p className="section-subheading" style={{ marginBottom: 'var(--space-12)' }}>
          A multi-layered pipeline where each step constrains the model further.
          This is a real ordered sequence — not a marketing list.
        </p>

        <div className="defense-list">
          {defenses.map((d, i) => (
            <div key={i} className="defense-item">
              <div className="defense-number">{d.number}</div>
              <div className="defense-content">
                <div className="defense-title">{d.title}</div>
                <div className="defense-desc">{d.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
