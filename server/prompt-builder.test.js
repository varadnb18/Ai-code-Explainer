import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, buildUserPrompt } from './prompt-builder.js';

describe('Prompt Builder', () => {
  describe('buildSystemPrompt', () => {
    it('returns a non-empty system prompt', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toBeTruthy();
      expect(prompt.length).toBeGreaterThan(100);
    });

    it('includes JSON schema instruction', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('explanation');
      expect(prompt).toContain('optimizedCode');
      expect(prompt).toContain('complexity');
    });

    it('includes anti-hallucination instructions', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain('NEVER guess');
      expect(prompt).toContain('Not determinable');
    });
  });

  describe('buildUserPrompt', () => {
    it('includes the code and language', () => {
      const prompt = buildUserPrompt('const x = 1;', 'javascript', []);
      expect(prompt).toContain('JAVASCRIPT');
      expect(prompt).toContain('const x = 1;');
    });

    it('includes AST annotations when provided', () => {
      const annotations = [
        { startLine: 1, endLine: 3, type: 'function', details: 'Function "foo" with 0 parameter(s)' },
      ];
      const prompt = buildUserPrompt('function foo() {}', 'javascript', annotations);
      expect(prompt).toContain('AST STRUCTURAL ANALYSIS');
      expect(prompt).toContain('FUNCTION');
      expect(prompt).toContain('Function "foo"');
      expect(prompt).toContain('[Lines 1-3]');
    });

    it('includes AST fallback warning when annotations are empty', () => {
      const prompt = buildUserPrompt('x = 1', 'python', []);
      expect(prompt).toContain('AST structural analysis was not available');
      expect(prompt).toContain('Not determinable without AST verification');
    });

    it('includes AST fallback warning when annotations are null', () => {
      const prompt = buildUserPrompt('x = 1', 'python', null);
      expect(prompt).toContain('AST structural analysis was not available');
    });
  });
});
