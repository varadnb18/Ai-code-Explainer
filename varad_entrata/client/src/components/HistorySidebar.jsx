/**
 * HistorySidebar — List of past code submissions with click-to-review.
 * Data is persisted in localStorage by the parent App component.
 */
export default function HistorySidebar({ history, activeId, onSelect, onClear }) {
  // Format timestamp to a short readable form
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Get the first meaningful line of code for preview
  const getPreview = (code) => {
    if (!code) return '';
    const lines = code.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('//'));
    return lines[0]?.trim() || code.split('\n')[0]?.trim() || '';
  };

  return (
    <>
      <div className="sidebar-header">
        <span className="sidebar-title">
          📋 History
        </span>
        {history.length > 0 && (
          <button className="sidebar-clear-btn" onClick={onClear}>
            Clear All
          </button>
        )}
      </div>

      <div className="sidebar-list">
        {history.length === 0 ? (
          <div className="sidebar-empty">
            <div className="sidebar-empty-icon">📭</div>
            <div>No snippets yet.</div>
            <div style={{ marginTop: '4px', fontSize: '0.75rem' }}>
              Submit code to see your history here.
            </div>
          </div>
        ) : (
          history.map((entry) => (
            <div
              key={entry.id}
              className={`history-item ${activeId === entry.id ? 'active' : ''}`}
              onClick={() => onSelect(entry)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(entry)}
            >
              <div className="history-item-header">
                <span className="history-item-lang">{entry.language}</span>
                <span className="history-item-time">
                  {formatTime(entry.timestamp)}
                </span>
              </div>
              <div className="history-item-preview">
                {getPreview(entry.code)}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
