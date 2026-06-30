/**
 * ProblemSection — Frames the hallucination risk with a before/after micro-demo.
 * Reuses the annotation chip visual from the hero for consistency.
 */
export default function ProblemSection({ sectionRef }) {
  return (
    <section className="problem-section" ref={sectionRef} id="the-problem">
      <div className="section-container">
        <div className="section-eyebrow">The Problem</div>
        <h2 className="section-heading">LLMs hallucinate about code</h2>

        <div className="problem-grid">
          {/* Left: statement */}
          <div className="problem-statement">
            <p style={{ marginBottom: 'var(--space-6)' }}>
              When you ask a language model to explain code, it can <strong>invent a function
              that isn't there</strong>, <strong>miscount parameters</strong>, or confidently
              state a wrong complexity. The output reads well — the mistakes are subtle.
            </p>
            <p>
              The fix isn't a better prompt. It's giving the model <strong>verified facts
              before it starts generating</strong> — parsing the AST with real compilers
              and injecting the structure into the prompt as ground truth.
            </p>
          </div>

          {/* Right: before/after demo */}
          <div className="problem-demo">
            <div className="problem-demo-card without">
              <div className="problem-demo-label without">✕ Without AST grounding</div>
              <div className="problem-demo-text struck">
                "The function <code>mergeSort</code> takes <code>3 parameters</code> and contains
                a <code>for loop</code> that iterates over the array…"
              </div>
            </div>

            <div className="problem-demo-card with">
              <div className="problem-demo-label with">✓ With AST grounding</div>
              <div className="problem-demo-text">
                "The function{' '}
                <span className="chip-inline fn">function</span>{' '}
                <code>mergeSort</code> takes{' '}
                <strong>1 parameter</strong>{' '}
                <code>(arr)</code> and contains a{' '}
                <span className="chip-inline loop">while loop</span>{' '}
                with an{' '}
                <span className="chip-inline cond">if</span>{' '}
                conditional inside."
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
