import { describe, it, expect } from 'vitest';
import { parseCode } from './ast-parser.js';

describe('AST Parser', () => {
  describe('JavaScript parsing', () => {
    it('extracts function declarations', async () => {
      const code = `function greet(name) {
  return "Hello, " + name;
}`;
      const annotations = await parseCode(code, 'javascript');

      const functions = annotations.filter((a) => a.type === 'function');
      expect(functions).toHaveLength(1);
      expect(functions[0].name).toBe('greet');
      expect(functions[0].startLine).toBe(1);
      expect(functions[0].details).toContain('1 parameter');
    });

    it('extracts arrow functions assigned to variables', async () => {
      const code = `const add = (a, b) => a + b;`;
      const annotations = await parseCode(code, 'javascript');

      const functions = annotations.filter((a) => a.type === 'function');
      expect(functions).toHaveLength(1);
      expect(functions[0].name).toBe('add');
      expect(functions[0].details).toContain('Arrow function');
      expect(functions[0].details).toContain('2 parameter');
    });

    it('extracts loops', async () => {
      const code = `for (let i = 0; i < 10; i++) {
  console.log(i);
}
while (true) { break; }`;
      const annotations = await parseCode(code, 'javascript');

      const loops = annotations.filter((a) => a.type === 'loop');
      expect(loops).toHaveLength(2);
      expect(loops[0].name).toBe('for');
      expect(loops[1].name).toBe('while');
    });

    it('extracts conditionals (only top-level ifs)', async () => {
      const code = `if (x > 0) {
  console.log("positive");
} else if (x < 0) {
  console.log("negative");
} else {
  console.log("zero");
}`;
      const annotations = await parseCode(code, 'javascript');

      // Should only capture one top-level if (else-if is part of it, not separate)
      const conditionals = annotations.filter((a) => a.type === 'conditional');
      expect(conditionals).toHaveLength(1);
      expect(conditionals[0].details).toContain('else');
    });

    it('extracts class declarations with methods', async () => {
      const code = `class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return this.name;
  }
}`;
      const annotations = await parseCode(code, 'javascript');

      const classes = annotations.filter((a) => a.type === 'class');
      expect(classes).toHaveLength(1);
      expect(classes[0].name).toBe('Animal');
      expect(classes[0].details).toContain('constructor');
      expect(classes[0].details).toContain('speak');
    });

    it('extracts try-catch blocks', async () => {
      const code = `try {
  doSomething();
} catch (e) {
  console.error(e);
} finally {
  cleanup();
}`;
      const annotations = await parseCode(code, 'javascript');

      const errorHandling = annotations.filter((a) => a.type === 'error_handling');
      expect(errorHandling).toHaveLength(1);
      expect(errorHandling[0].details).toContain('finally');
    });

    it('only annotates returns in top-level functions (not nested)', async () => {
      const code = `function outer() {
  const inner = () => {
    return 1;
  };
  return inner();
}`;
      const annotations = await parseCode(code, 'javascript');

      // Should only have the return from outer(), not inner()
      const returns = annotations.filter((a) => a.type === 'return');
      expect(returns).toHaveLength(1);
      expect(returns[0].startLine).toBe(5); // The `return inner()` line
    });

    it('handles duplicate declaration errors gracefully (errorRecovery)', async () => {
      const code = `const x = 1;
const x = 2;
function greet() {}`;
      // Should not throw and should return empty array because traverse fails on duplicate block scopes
      const annotations = await parseCode(code, 'javascript');
      expect(annotations).toEqual([]);
    });

    it('handles unrecoverable syntax errors by returning an empty array gracefully', async () => {
      const code = `const x = {`;
      // Should not throw, should return empty array
      const annotations = await parseCode(code, 'javascript');
      expect(annotations).toEqual([]);
    });

    it('returns sorted annotations by start line', async () => {
      const code = `const b = () => 2;
function a() { return 1; }`;
      const annotations = await parseCode(code, 'javascript');

      for (let i = 1; i < annotations.length; i++) {
        expect(annotations[i].startLine).toBeGreaterThanOrEqual(annotations[i - 1].startLine);
      }
    });
  });

  describe('Python parsing', () => {
    it('extracts function definitions', async () => {
      const code = `def greet(name):
    return f"Hello, {name}"`;
      const annotations = await parseCode(code, 'python');

      const functions = annotations.filter((a) => a.type === 'function');
      expect(functions).toHaveLength(1);
      expect(functions[0].name).toBe('greet');
      expect(functions[0].details).toContain('1 parameter');
    });

    it('extracts class definitions with methods', async () => {
      const code = `class Dog:
    def __init__(self, name):
        self.name = name
    def bark(self):
        return "Woof!"`;
      const annotations = await parseCode(code, 'python');

      const classes = annotations.filter((a) => a.type === 'class');
      expect(classes).toHaveLength(1);
      expect(classes[0].name).toBe('Dog');
      expect(classes[0].details).toContain('__init__');
      expect(classes[0].details).toContain('bark');
    });

    it('extracts loops', async () => {
      const code = `for i in range(10):
    print(i)
while True:
    break`;
      const annotations = await parseCode(code, 'python');

      const loops = annotations.filter((a) => a.type === 'loop');
      expect(loops).toHaveLength(2);
    });

    it('extracts conditionals', async () => {
      const code = `if x > 0:
    print("positive")
else:
    print("non-positive")`;
      const annotations = await parseCode(code, 'python');

      const conditionals = annotations.filter((a) => a.type === 'conditional');
      expect(conditionals.length).toBeGreaterThanOrEqual(1);
    });

    it('extracts imports', async () => {
      const code = `import os
from sys import path`;
      const annotations = await parseCode(code, 'python');

      const imports = annotations.filter((a) => a.type === 'import');
      expect(imports).toHaveLength(2);
    });

    it('extracts list comprehensions', async () => {
      const code = `squares = [x**2 for x in range(10)]`;
      const annotations = await parseCode(code, 'python');

      const comps = annotations.filter((a) => a.type === 'comprehension');
      expect(comps).toHaveLength(1);
    });

    it('extracts try-except blocks', async () => {
      const code = `try:
    risky()
except ValueError as e:
    print(e)
finally:
    cleanup()`;
      const annotations = await parseCode(code, 'python');

      const errorHandling = annotations.filter((a) => a.type === 'error_handling');
      expect(errorHandling).toHaveLength(1);
      expect(errorHandling[0].details).toContain('ValueError');
      expect(errorHandling[0].details).toContain('finally');
    });
  });

  describe('Edge cases', () => {
    it('throws on unsupported language', async () => {
      await expect(parseCode('code', 'ruby')).rejects.toThrow('Unsupported language');
    });

    it('handles empty code', async () => {
      const annotations = await parseCode('', 'javascript');
      expect(annotations).toEqual([]);
    });
  });
});
