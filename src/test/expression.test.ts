import { describe, expect, it, vi } from 'vitest';
import { evaluateConditionSafe, validateConditionExpression } from '../utils/expression';

describe('expression - visibleOn safe evaluator', () => {
  it('validates and evaluates basic equality', () => {
    const expr = "values['a'] === 'x'";
    const validation = validateConditionExpression(expr);
    expect(validation.ok).toBe(true);
    expect(evaluateConditionSafe(expr, { a: 'x' })).toBe(true);
    expect(evaluateConditionSafe(expr, { a: 'y' })).toBe(false);
  });

  it('supports boolean logic and unary !', () => {
    const expr = "!values['a'] || (values['b'] && values['c'] === 1)";
    expect(evaluateConditionSafe(expr, { a: false, b: true, c: 1 })).toBe(true);
    expect(evaluateConditionSafe(expr, { a: true, b: true, c: 1 })).toBe(true);
    expect(evaluateConditionSafe(expr, { a: true, b: false, c: 1 })).toBe(false);
  });

  it('supports relational operators with numbers', () => {
    const expr = "values['age'] >= 18 && values['age'] < 65";
    expect(evaluateConditionSafe(expr, { age: 18 })).toBe(true);
    expect(evaluateConditionSafe(expr, { age: 70 })).toBe(false);
  });

  it('fails open on invalid expression (security)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const expr = "alert('xss')";
    const validation = validateConditionExpression(expr);
    expect(validation.ok).toBe(false);
    expect(evaluateConditionSafe(expr, {})).toBe(true);
  });

  it('rejects unknown identifiers', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const expr = "window.location.href === 'x'";
    const validation = validateConditionExpression(expr);
    expect(validation.ok).toBe(false);
    expect(evaluateConditionSafe(expr, {})).toBe(true);
  });
});
