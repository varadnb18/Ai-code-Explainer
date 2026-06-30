import { DiffEditor } from '@monaco-editor/react';

/**
 * DiffView — Monaco Diff Editor showing original vs. optimized code side by side.
 */
export default function DiffView({
  originalCode,
  optimizedCode,
  language,
  optimizationNotes,
}) {
  const monacoLang = language === 'python' ? 'python' : 'javascript';

  // If no optimization was made, show a message
  const hasChanges = originalCode?.trim() !== optimizedCode?.trim();

  return (
    <div className="diff-container">
      <div className="diff-editor-wrapper">
        <DiffEditor
          height="100%"
          language={monacoLang}
          original={originalCode || ''}
          modified={optimizedCode || originalCode || ''}
          theme="vs-dark"
          options={{
            readOnly: true,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            minimap: { enabled: false },
            renderSideBySide: true,
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            renderIndicators: true,
            originalEditable: false,
            enableSplitViewResizing: true,
          }}
        />
      </div>

      {/* Optimization Notes */}
      <div className="diff-notes">
        <div className="diff-notes-label">
          {hasChanges ? '✨ Changes Made' : '✅ No Changes Needed'}
        </div>
        <div className="diff-notes-text">
          {optimizationNotes || 'No optimization notes available.'}
        </div>
      </div>
    </div>
  );
}
