import { describe, expect, it } from 'vitest';
import type { ComponentSchema } from '../types';
import { moveComponent } from '../utils/componentTreeOps';
import { generateFullCode } from '../utils/codeGenerator';
import { evaluateConditionSafe, validateConditionExpression } from '../utils/expression';

function now() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function createInput(id: string): ComponentSchema {
  return {
    id,
    type: 'Input',
    props: { label: `Input ${id}`, placeholder: '' },
  };
}

function buildFlat(count: number): ComponentSchema[] {
  const result: ComponentSchema[] = [];
  for (let i = 0; i < count; i++) result.push(createInput(`input-${i}`));
  return result;
}

describe('perf budget (CI guardrails)', () => {
  it('expression evaluation stays under budget', () => {
    const expr = "values['age'] >= 18 && values['active'] === true";
    const validation = validateConditionExpression(expr);
    expect(validation.ok).toBe(true);

    const values = { age: 20, active: true };
    const iterations = 20_000;

    const start = now();
    let truthy = 0;
    for (let i = 0; i < iterations; i++) {
      if (evaluateConditionSafe(expr, values)) truthy++;
    }
    const durationMs = now() - start;

    expect(truthy).toBe(iterations);
    expect(durationMs).toBeLessThan(500);
  });

  it('tree move operation stays under budget', () => {
    const size = 400;
    const moves = 200;
    let components = buildFlat(size);

    const ids = components.map((c) => c.id);

    const start = now();
    for (let i = 0; i < moves; i++) {
      const id = ids[i % ids.length];
      const index = (i * 7) % components.length;
      components = moveComponent(components, id, { parentId: null, index }).components;
    }
    const durationMs = now() - start;

    expect(components).toHaveLength(size);
    expect(durationMs).toBeLessThan(800);
  });

  it('code generation stays under budget', () => {
    const components = buildFlat(300);

    const start = now();
    const code = generateFullCode(components);
    const durationMs = now() - start;

    expect(code).toContain('GeneratedForm');
    expect(durationMs).toBeLessThan(1200);
  });
});

