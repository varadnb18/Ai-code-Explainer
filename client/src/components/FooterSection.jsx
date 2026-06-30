/**
 * FooterSection — Minimal footer with GitHub link and honest build-time caption.
 */
export default function FooterSection() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-left">
          <span className="footer-logo">&lt;/&gt;</span>
          <span className="footer-caption">Varad Nashikkar</span>
        </div>
        <div className="footer-links">
          <a
            href="https://github.com/varadnb18/Ai-code-Explainer"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            GitHub ↗
          </a>
          <span className="footer-caption">MIT License</span>
        </div>
      </div>
    </footer>
  );
}
