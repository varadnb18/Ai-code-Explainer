import { useState } from 'react';

/**
 * NavBar — Sticky navigation with mono logo, section links, and mobile menu.
 */
export default function NavBar({ activeSection, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { id: 'architecture', label: 'Architecture' },
    { id: 'defense-strategy', label: 'Defense Strategy' },
    { id: 'features', label: 'Tech Stack' },
    { id: 'try-live-demo', label: 'Try Live Demo' },
  ];

  const handleClick = (id) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <nav className="nav" role="navigation" aria-label="Main navigation">
      <div className="nav-inner">
        <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <span className="nav-logo-glyph">&lt;/&gt;</span>
          <span className="nav-logo-text">ast.explain</span>
        </a>

        <ul className={`nav-links ${mobileOpen ? 'mobile-open' : ''}`}>
          {links.map((link) => (
            <li key={link.id} style={{ listStyle: 'none' }}>
              <button
                className={`nav-link ${activeSection === link.id ? 'active' : ''}`}
                onClick={() => handleClick(link.id)}
              >
                {link.label}
              </button>
            </li>
          ))}
          <li style={{ listStyle: 'none' }}>
            <a
              href="https://github.com/varadnb18/Ai-code-Explainer"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
            >
              GitHub
            </a>
          </li>
        </ul>

        <button
          className="nav-mobile-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
}
