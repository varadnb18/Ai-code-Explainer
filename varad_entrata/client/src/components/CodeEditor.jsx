import { useCallback } from 'react';
import Editor from '@monaco-editor/react';

/**
 * CodeEditor — Monaco Editor wrapper with language selector and submit button.
 */
export default function CodeEditor({
  code,
  language,
  onCodeChange,
  onLanguageChange,
  onSubmit,
  loading,
}) {
  const handleEditorMount = useCallback((editor, monaco) => {
    // Focus the editor on mount
    editor.focus();

    // Register custom completions for Python
    monaco.languages.registerCompletionItemProvider('python', {
      triggerCharacters: ['.'],
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        // Triggered by "df."
        if (textUntilPosition.endsWith('df.')) {
          return {
            suggestions: [
              {
                label: 'isnull',
                kind: monaco.languages.CompletionItemKind.Method,
                documentation: 'Detect missing values in the DataFrame.',
                insertText: 'isnull()',
                range: null,
              },
              {
                label: 'dropna',
                kind: monaco.languages.CompletionItemKind.Method,
                documentation: 'Remove missing values from the DataFrame.',
                insertText: 'dropna()',
                range: null,
              },
              {
                label: 'head',
                kind: monaco.languages.CompletionItemKind.Method,
                documentation: 'Return the first n rows.',
                insertText: 'head(${1:5})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: null,
              },
              {
                label: 'describe',
                kind: monaco.languages.CompletionItemKind.Method,
                documentation: 'Generate descriptive statistics.',
                insertText: 'describe()',
                range: null,
              },
              {
                label: 'columns',
                kind: monaco.languages.CompletionItemKind.Field,
                documentation: 'The column labels of the DataFrame.',
                insertText: 'columns',
                range: null,
              },
              {
                label: 'info',
                kind: monaco.languages.CompletionItemKind.Method,
                documentation: 'Print a concise summary of the DataFrame.',
                insertText: 'info()',
                range: null,
              },
              {
                label: 'groupby',
                kind: monaco.languages.CompletionItemKind.Method,
                documentation: 'Group DataFrame using a mapper or by a Series of columns.',
                insertText: 'groupby(\'${1:column}\')',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: null,
              },
            ],
          };
        }

        // Triggered by "pd."
        if (textUntilPosition.endsWith('pd.')) {
          return {
            suggestions: [
              {
                label: 'read_csv',
                kind: monaco.languages.CompletionItemKind.Method,
                documentation: 'Read a comma-separated values (csv) file into DataFrame.',
                insertText: 'read_csv(\'${1:file.csv}\')',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: null,
              },
              {
                label: 'DataFrame',
                kind: monaco.languages.CompletionItemKind.Class,
                documentation: 'Two-dimensional, size-mutable, potentially heterogeneous tabular data.',
                insertText: 'DataFrame(${1:data})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: null,
              },
              {
                label: 'Series',
                kind: monaco.languages.CompletionItemKind.Class,
                documentation: 'One-dimensional ndarray with axis labels.',
                insertText: 'Series(${1:data})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: null,
              },
              {
                label: 'concat',
                kind: monaco.languages.CompletionItemKind.Method,
                documentation: 'Concatenate pandas objects along a particular axis.',
                insertText: 'concat([${1:df1}, ${2:df2}])',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: null,
              },
            ],
          };
        }

        // General suggestions for Python
        return {
          suggestions: [
            {
              label: 'print',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'print(${1:value})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: null,
            },
            {
              label: 'len',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'len(${1:iterable})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: null,
            },
            {
              label: 'range',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'range(${1:stop})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: null,
            },
            {
              label: 'def',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'def ${1:function_name}(${2:params}):\n\t${3:pass}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: null,
            },
            {
              label: 'class',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'class ${1:ClassName}:\n\tdef __init__(self):\n\t\t${2:pass}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: null,
            },
          ],
        };
      },
    });

    // Register custom completions for JavaScript
    monaco.languages.registerCompletionItemProvider('javascript', {
      triggerCharacters: ['.'],
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        // Triggered by "console."
        if (textUntilPosition.endsWith('console.')) {
          return {
            suggestions: [
              {
                label: 'log',
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: 'log(${1:message})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: null,
              },
              {
                label: 'error',
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: 'error(${1:message})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: null,
              },
              {
                label: 'warn',
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: 'warn(${1:message})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: null,
              },
            ],
          };
        }

        // General suggestions for JavaScript
        return {
          suggestions: [
            {
              label: 'forEach',
              kind: monaco.languages.CompletionItemKind.Method,
              insertText: 'forEach(${1:item} => {\n\t${2}\n})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: null,
            },
            {
              label: 'map',
              kind: monaco.languages.CompletionItemKind.Method,
              insertText: 'map(${1:item} => ${2})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: null,
            },
            {
              label: 'filter',
              kind: monaco.languages.CompletionItemKind.Method,
              insertText: 'filter(${1:item} => ${2})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: null,
            },
            {
              label: 'function',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'function ${1:name}(${2:params}) {\n\t${3}\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: null,
            },
            {
              label: 'const',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'const ${1:name} = ${2:value};',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: null,
            },
          ],
        };
      },
    });
  }, []);

  // Map our language names to Monaco language IDs
  const monacoLang = language === 'python' ? 'python' : 'javascript';

  return (
    <>
      {/* Panel Header: Language Selector */}
      <div className="panel-header">
        <span className="panel-title">
          <span className="panel-title-icon">📝</span>
          Code Input
        </span>
        <div className="language-selector">
          <button
            className={`language-btn ${language === 'javascript' ? 'active' : ''}`}
            onClick={() => onLanguageChange('javascript')}
          >
            <span className="language-icon">JS</span>
            JavaScript
          </button>
          <button
            className={`language-btn ${language === 'python' ? 'active' : ''}`}
            onClick={() => onLanguageChange('python')}
          >
            <span className="language-icon">🐍</span>
            Python
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="panel-body">
        <Editor
          height="100%"
          language={monacoLang}
          value={code}
          onChange={(value) => onCodeChange(value || '')}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            minimap: { enabled: false },
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            tabSize: 2,
            placeholder: language === 'python'
              ? '# Paste your Python code here...'
              : '// Paste your JavaScript code here...',
          }}
        />
      </div>

      {/* Submit Button */}
      <div className="submit-area">
        <button
          className="submit-btn"
          onClick={onSubmit}
          disabled={loading || !code.trim()}
          id="submit-explain-btn"
        >
          {loading ? (
            <>
              <div className="spinner" />
              Analyzing...
            </>
          ) : (
            <>
              <span className="submit-btn-icon">🔍</span>
              Explain This Code
            </>
          )}
        </button>
      </div>
    </>
  );
}
