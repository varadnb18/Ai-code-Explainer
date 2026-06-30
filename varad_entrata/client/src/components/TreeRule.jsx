/**
 * TreeRule — Reusable section divider using tree-style connector glyphs (├─ └─ │).
 * A direct visual quote of the AST tree concept.
 */
export default function TreeRule({ variant = 'default' }) {
  const glyphs = {
    default: '│\n├──\n│',
    branch:  '│\n├──┬──\n│  └──',
    end:     '│\n└──',
  };

  return (
    <div className="tree-rule" aria-hidden="true">
      <div className="tree-rule-glyphs">
        {glyphs[variant] || glyphs.default}
      </div>
    </div>
  );
}
