import { z } from 'zod';
import type { ComponentSchema, ComponentType } from '../types';
import type { ExpressionNode } from './expression';
import { validateConditionExpression } from './expression';

type ValueKind = 'string' | 'number' | 'boolean' | 'stringArray' | 'unknown';

type TypeValidationWarning =
  | { kind: 'unknownKey'; key: string }
  | { kind: 'typeMismatch'; key: string; expected: ValueKind; operator: string; actual: ValueKind };

export type ConditionValidationWithWarnings =
  | { ok: true; ast: ExpressionNode; warnings: TypeValidationWarning[] }
  | { ok: false; error: string; pos?: number };

function getValueKind(value: unknown): ValueKind {
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) return 'stringArray';
  return 'unknown';
}

function getComponentValueKind(type: ComponentType): ValueKind | null {
  switch (type) {
    case 'Input':
    case 'TextArea':
    case 'Select':
    case 'Radio':
      return 'string';
    case 'InputNumber':
      return 'number';
    case 'Switch':
      return 'boolean';
    case 'Checkbox':
      return 'stringArray';
    case 'DatePicker':
    case 'TimePicker':
      return 'unknown';
    case 'Button':
    case 'Container':
      return null;
  }
}

export function buildFormValuesZodSchema(allComponents: ComponentSchema[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const component of allComponents) {
    const kind = getComponentValueKind(component.type);
    if (!kind) continue;
    if (kind === 'string') shape[component.id] = z.string().optional();
    if (kind === 'number') shape[component.id] = z.number().optional();
    if (kind === 'boolean') shape[component.id] = z.boolean().optional();
    if (kind === 'stringArray') shape[component.id] = z.array(z.string()).optional();
    if (kind === 'unknown') shape[component.id] = z.unknown().optional();
  }

  return { schema: z.object(shape).passthrough(), shape };
}

function collectValueRefs(node: ExpressionNode, out: Set<string>) {
  switch (node.type) {
    case 'ValuesRef':
      out.add(node.key);
      return;
    case 'Literal':
      return;
    case 'Unary':
      collectValueRefs(node.argument, out);
      return;
    case 'Binary':
      collectValueRefs(node.left, out);
      collectValueRefs(node.right, out);
      return;
  }
}

type Expected = { key: string; expected: ValueKind; operator: string };

function collectExpectedTypes(node: ExpressionNode, out: Expected[]) {
  if (node.type === 'Binary') {
    const { operator, left, right } = node;
    // Recurse first so we collect nested expectations too.
    collectExpectedTypes(left, out);
    collectExpectedTypes(right, out);

    const expectsNumberOrString = operator === '<' || operator === '<=' || operator === '>' || operator === '>=';
    const isEquality = operator === '===' || operator === '!==' || operator === '==' || operator === '!=';

    if (!expectsNumberOrString && !isEquality) return;

    const addExpectation = (ref: ExpressionNode, other: ExpressionNode) => {
      if (ref.type !== 'ValuesRef') return;

      if (expectsNumberOrString) {
        if (other.type === 'Literal') {
          const otherKind = getValueKind(other.value);
          if (otherKind === 'number' || otherKind === 'string') {
            out.push({ key: ref.key, expected: otherKind, operator });
          }
        }
        return;
      }

      // equality operators
      if (other.type === 'Literal') {
        const otherKind = getValueKind(other.value);
        if (otherKind !== 'unknown') {
          out.push({ key: ref.key, expected: otherKind, operator });
        }
      }
    };

    addExpectation(left, right);
    addExpectation(right, left);
  } else if (node.type === 'Unary') {
    collectExpectedTypes(node.argument, out);
  }
}

export function validateConditionExpressionWithTypes(
  expression: string,
  allComponents: ComponentSchema[],
): ConditionValidationWithWarnings {
  const parsed = validateConditionExpression(expression);
  if (!parsed.ok) return parsed;

  const { shape } = buildFormValuesZodSchema(allComponents);

  const referencedKeys = new Set<string>();
  collectValueRefs(parsed.ast, referencedKeys);

  const warnings: TypeValidationWarning[] = [];

  for (const key of referencedKeys) {
    if (!(key in shape)) {
      warnings.push({ kind: 'unknownKey', key });
    }
  }

  const expectations: Expected[] = [];
  collectExpectedTypes(parsed.ast, expectations);

  for (const exp of expectations) {
    const validator = shape[exp.key];
    if (!validator) continue;

    const expectedValue: unknown =
      exp.expected === 'string'
        ? ''
        : exp.expected === 'number'
          ? 0
          : exp.expected === 'boolean'
            ? true
            : exp.expected === 'stringArray'
              ? ['x']
              : undefined;

    const result = validator.safeParse(expectedValue);
    if (!result.success) {
      // derive schema expected kind by probing with different samples
      const sampleKinds: Array<[ValueKind, unknown]> = [
        ['string', ''],
        ['number', 0],
        ['boolean', true],
        ['stringArray', ['x']],
      ];

      let inferred: ValueKind = 'unknown';
      for (const [kind, sample] of sampleKinds) {
        if (validator.safeParse(sample).success) {
          inferred = kind;
          break;
        }
      }

      warnings.push({
        kind: 'typeMismatch',
        key: exp.key,
        expected: inferred,
        operator: exp.operator,
        actual: exp.expected,
      });
    }
  }

  return { ok: true, ast: parsed.ast, warnings };
}
