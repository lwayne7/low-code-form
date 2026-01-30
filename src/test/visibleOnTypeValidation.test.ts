import { describe, expect, it } from 'vitest';
import type { ComponentSchema } from '../types';
import { validateConditionExpressionWithTypes } from '../utils/visibleOnTypeValidation';

function inputNumber(id: string): ComponentSchema {
  return {
    id,
    type: 'InputNumber',
    props: { label: 'n', placeholder: '' },
  };
}

function input(id: string): ComponentSchema {
  return {
    id,
    type: 'Input',
    props: { label: 's', placeholder: '' },
  };
}

describe('visibleOn type validation (zod)', () => {
  it('warns on unknown referenced key', () => {
    const components = [input('a')];
    const result = validateConditionExpressionWithTypes("values['missing'] === 'x'", components);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnings.some((w) => w.kind === 'unknownKey' && w.key === 'missing')).toBe(true);
    }
  });

  it('warns on type mismatch (number vs string literal)', () => {
    const components = [inputNumber('num')];
    const result = validateConditionExpressionWithTypes("values['num'] === 'x'", components);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(
        result.warnings.some(
          (w) =>
            w.kind === 'typeMismatch' &&
            w.key === 'num' &&
            w.actual === 'string' &&
            w.expected === 'number' &&
            w.operator === '===',
        ),
      ).toBe(true);
    }
  });
});

