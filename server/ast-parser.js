import babelParser from '@babel/parser';
import _traverse from '@babel/traverse';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Handle @babel/traverse ESM default export
const traverse = _traverse.default || _traverse;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Parse code and extract structural annotations using AST.
 * 
 * @param {string} code - The source code to parse
 * @param {string} language - "javascript" or "python"
 * @returns {Promise<Array>} Array of annotation objects with type, name, startLine, endLine, details
 */
export async function parseCode(code, language) {
  if (language === 'javascript') {
    return parseJavaScript(code);
  } else if (language === 'python') {
    return parsePython(code);
  }
  throw new Error(`Unsupported language: ${language}`);
}

/**
 * Parse JavaScript/JSX code using @babel/parser and traverse the AST
 * to extract functions, classes, loops, conditionals, and variable declarations.
 */
function parseJavaScript(code) {
  try {
    const ast = babelParser.parse(code, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript',
        'optionalChaining',
        'nullishCoalescingOperator',
        'classProperties',
        'decorators-legacy',
      ],
      errorRecovery: true,
    });

    const annotations = [];

    traverse(ast, {
      // Function declarations: function foo(a, b) { ... }
      FunctionDeclaration(path) {
        const { node } = path;
        annotations.push({
          type: 'function',
          name: node.id?.name || '<anonymous>',
          startLine: node.loc.start.line,
          endLine: node.loc.end.line,
          details: `Function "${node.id?.name || 'anonymous'}" with ${node.params.length} parameter(s)`,
        });
      },

      // Arrow functions and function expressions assigned to variables
      VariableDeclarator(path) {
        const { node } = path;
        if (
          node.init &&
          (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression')
        ) {
          annotations.push({
            type: 'function',
            name: node.id?.name || '<anonymous>',
            startLine: node.loc.start.line,
            endLine: node.loc.end.line,
            details: `${node.init.type === 'ArrowFunctionExpression' ? 'Arrow function' : 'Function expression'} "${node.id?.name || 'anonymous'}" with ${node.init.params.length} parameter(s)`,
          });
        }
      },

      // Class declarations
      ClassDeclaration(path) {
        const { node } = path;
        const methods = node.body.body
          .filter((m) => m.type === 'ClassMethod')
          .map((m) => m.key?.name || '<computed>');

        annotations.push({
          type: 'class',
          name: node.id?.name || '<anonymous>',
          startLine: node.loc.start.line,
          endLine: node.loc.end.line,
          details: `Class "${node.id?.name || 'anonymous'}" with methods: [${methods.join(', ')}]${node.superClass ? `, extends ${node.superClass.name || '<expression>'}` : ''}`,
        });
      },

      // For loops (for, for...in, for...of)
      ForStatement(path) {
        annotations.push({
          type: 'loop',
          name: 'for',
          startLine: path.node.loc.start.line,
          endLine: path.node.loc.end.line,
          details: 'Standard for loop',
        });
      },
      ForInStatement(path) {
        annotations.push({
          type: 'loop',
          name: 'for...in',
          startLine: path.node.loc.start.line,
          endLine: path.node.loc.end.line,
          details: 'For...in loop (iterates over object keys)',
        });
      },
      ForOfStatement(path) {
        annotations.push({
          type: 'loop',
          name: 'for...of',
          startLine: path.node.loc.start.line,
          endLine: path.node.loc.end.line,
          details: 'For...of loop (iterates over iterable values)',
        });
      },

      // While loops
      WhileStatement(path) {
        annotations.push({
          type: 'loop',
          name: 'while',
          startLine: path.node.loc.start.line,
          endLine: path.node.loc.end.line,
          details: 'While loop',
        });
      },
      DoWhileStatement(path) {
        annotations.push({
          type: 'loop',
          name: 'do...while',
          startLine: path.node.loc.start.line,
          endLine: path.node.loc.end.line,
          details: 'Do...while loop (executes at least once)',
        });
      },

      // Conditionals
      IfStatement(path) {
        // Only capture top-level ifs, not else-if chains
        if (path.parent.type !== 'IfStatement') {
          const hasElse = !!path.node.alternate;
          annotations.push({
            type: 'conditional',
            name: 'if',
            startLine: path.node.loc.start.line,
            endLine: path.node.loc.end.line,
            details: `If statement${hasElse ? ' with else branch' : ''}`,
          });
        }
      },

      // Switch statements
      SwitchStatement(path) {
        const caseCount = path.node.cases.length;
        annotations.push({
          type: 'conditional',
          name: 'switch',
          startLine: path.node.loc.start.line,
          endLine: path.node.loc.end.line,
          details: `Switch statement with ${caseCount} case(s)`,
        });
      },

      // Try-catch
      TryStatement(path) {
        annotations.push({
          type: 'error_handling',
          name: 'try-catch',
          startLine: path.node.loc.start.line,
          endLine: path.node.loc.end.line,
          details: `Try-catch block${path.node.finalizer ? ' with finally' : ''}`,
        });
      },

      // Return statements — only in top-level (program-scope) functions to avoid flooding
      ReturnStatement(path) {
        // Only include returns that have a value (not bare returns)
        if (!path.node.argument) return;

        // Only annotate returns in functions that are direct children of the program scope.
        // This avoids flooding: a function with 5 nested callbacks would otherwise
        // produce 5 return markers, making the annotated view noisy.
        const enclosingFn = path.getFunctionParent();
        if (!enclosingFn) return;
        const fnParent = enclosingFn.parentPath;
        // Accept if the function is at program level (declaration) or assigned at program level (variable declarator)
        const isTopLevel = fnParent?.isProgram() ||
          (fnParent?.isVariableDeclarator() && fnParent.parentPath?.parentPath?.isProgram()) ||
          fnParent?.isExportDefaultDeclaration() ||
          fnParent?.isExportNamedDeclaration();
        if (!isTopLevel) return;

        annotations.push({
          type: 'return',
          name: 'return',
          startLine: path.node.loc.start.line,
          endLine: path.node.loc.end.line,
          details: 'Return statement',
        });
      },
    });

    // Sort by start line for consistent display
    annotations.sort((a, b) => a.startLine - b.startLine);
    return annotations;
  } catch (err) {
    console.warn(`[AST JS] Parsing/Traversal failed (non-fatal): ${err.message}`);
    return [];
  }
}

/**
 * Parse Python code by calling the python_ast.py script as a child process.
 * Falls back gracefully if Python is not available.
 */
function parsePython(code) {
  return new Promise((resolve, reject) => {
    const scriptPath = join(__dirname, 'python_ast.py');

    // Try python3 first, then python
    const tryPython = (command) => {
      const child = execFile(command, [scriptPath], {
        timeout: 10000,
        maxBuffer: 1024 * 1024,
      }, (error, stdout, stderr) => {
        if (error) {
          if (command === 'python3') {
            // Retry with 'python' on Windows
            tryPython('python');
            return;
          }
          console.warn(`[AST] Python not available: ${error.message}`);
          resolve([]); // Graceful fallback
          return;
        }

        try {
          const result = JSON.parse(stdout);
          if (result.error) {
            console.warn(`[AST] Python parse error: ${result.error}`);
            resolve([]);
          } else {
            resolve(result.annotations || []);
          }
        } catch (parseError) {
          console.warn(`[AST] Failed to parse Python output: ${parseError.message}`);
          resolve([]);
        }
      });

      // Send code via stdin
      child.stdin.write(code);
      child.stdin.end();
    };

    tryPython('python3');
  });
}
