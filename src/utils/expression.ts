type TokenType =
  | 'parenL'
  | 'parenR'
  | 'bracketL'
  | 'bracketR'
  | 'op'
  | 'identifier'
  | 'string'
  | 'number'
  | 'eof';

type Token =
  | { type: 'parenL' | 'parenR' | 'bracketL' | 'bracketR' | 'eof'; pos: number }
  | { type: 'op'; value: string; pos: number }
  | { type: 'identifier'; value: string; pos: number }
  | { type: 'string'; value: string; pos: number }
  | { type: 'number'; value: number; raw: string; pos: number };

export type ExpressionNode =
  | { type: 'Literal'; value: string | number | boolean | null }
  | { type: 'ValuesRef'; key: string }
  | { type: 'Unary'; operator: '!'; argument: ExpressionNode }
  | {
      type: 'Binary';
      operator: '&&' | '||' | '===' | '!==' | '==' | '!=' | '<' | '<=' | '>' | '>=';
      left: ExpressionNode;
      right: ExpressionNode;
    };

export type ConditionValidationResult =
  | { ok: true; ast: ExpressionNode }
  | { ok: false; error: string; pos?: number };

class ExpressionParseError extends Error {
  public readonly pos: number;
  constructor(message: string, pos: number) {
    super(message);
    this.name = 'ExpressionParseError';
    this.pos = pos;
  }
}

function isIdentifierStart(char: string) {
  return /[A-Za-z_$]/.test(char);
}

function isIdentifierPart(char: string) {
  return /[A-Za-z0-9_$]/.test(char);
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const length = input.length;
  let index = 0;

  const push = (token: Token) => tokens.push(token);

  while (index < length) {
    const char = input[index];

    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      index += 1;
      continue;
    }

    if (char === '(') {
      push({ type: 'parenL', pos: index });
      index += 1;
      continue;
    }
    if (char === ')') {
      push({ type: 'parenR', pos: index });
      index += 1;
      continue;
    }
    if (char === '[') {
      push({ type: 'bracketL', pos: index });
      index += 1;
      continue;
    }
    if (char === ']') {
      push({ type: 'bracketR', pos: index });
      index += 1;
      continue;
    }

    // Operators (longest match first)
    const nextTwo = input.slice(index, index + 2);
    const nextThree = input.slice(index, index + 3);

    if (nextThree === '!==') {
      push({ type: 'op', value: '!==', pos: index });
      index += 3;
      continue;
    }
    if (nextThree === '===') {
      push({ type: 'op', value: '===', pos: index });
      index += 3;
      continue;
    }
    if (nextTwo === '&&' || nextTwo === '||' || nextTwo === '==' || nextTwo === '!=' || nextTwo === '<=' || nextTwo === '>=') {
      push({ type: 'op', value: nextTwo, pos: index });
      index += 2;
      continue;
    }
    if (char === '!' || char === '<' || char === '>') {
      push({ type: 'op', value: char, pos: index });
      index += 1;
      continue;
    }

    // String literal
    if (char === "'" || char === '"') {
      const quote = char;
      const startPos = index;
      index += 1;
      let value = '';
      while (index < length) {
        const current = input[index];
        if (current === quote) {
          index += 1;
          break;
        }
        if (current === '\\') {
          const next = input[index + 1];
          if (next === undefined) throw new ExpressionParseError('字符串转义不完整', index);
          switch (next) {
            case 'n':
              value += '\n';
              break;
            case 'r':
              value += '\r';
              break;
            case 't':
              value += '\t';
              break;
            case '\\':
              value += '\\';
              break;
            case '"':
              value += '"';
              break;
            case "'":
              value += "'";
              break;
            default:
              value += next;
              break;
          }
          index += 2;
          continue;
        }
        value += current;
        index += 1;
      }
      if (input[startPos] === quote && input[index - 1] !== quote) {
        throw new ExpressionParseError('字符串未闭合', startPos);
      }
      push({ type: 'string', value, pos: startPos });
      continue;
    }

    // Number literal
    if (/[0-9]/.test(char)) {
      const startPos = index;
      let raw = '';
      while (index < length && /[0-9.]/.test(input[index])) {
        raw += input[index];
        index += 1;
      }
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new ExpressionParseError(`非法数字: ${raw}`, startPos);
      push({ type: 'number', value, raw, pos: startPos });
      continue;
    }

    // Identifier
    if (isIdentifierStart(char)) {
      const startPos = index;
      let value = '';
      while (index < length && isIdentifierPart(input[index])) {
        value += input[index];
        index += 1;
      }
      push({ type: 'identifier', value, pos: startPos });
      continue;
    }

    throw new ExpressionParseError(`不支持的字符: ${char}`, index);
  }

  push({ type: 'eof', pos: input.length });
  return tokens;
}

class Parser {
  private readonly tokens: Token[];
  private index = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private current(): Token {
    return this.tokens[this.index] ?? { type: 'eof', pos: this.tokens[this.tokens.length - 1]?.pos ?? 0 };
  }

  private consume(): Token {
    const token = this.current();
    this.index += 1;
    return token;
  }

  private expect(type: TokenType, value?: string): Token {
    const token = this.current();
    if (token.type !== type) {
      throw new ExpressionParseError(`期望 ${type}，但得到 ${token.type}`, token.pos);
    }
    if (value !== undefined && token.type === 'op' && token.value !== value) {
      throw new ExpressionParseError(`期望运算符 ${value}，但得到 ${token.value}`, token.pos);
    }
    return this.consume();
  }

  parseExpression(): ExpressionNode {
    const expr = this.parseOr();
    const tail = this.current();
    if (tail.type !== 'eof') {
      throw new ExpressionParseError('表达式结尾存在多余内容', tail.pos);
    }
    return expr;
  }

  private parseOr(): ExpressionNode {
    let left = this.parseAnd();
    while (this.current().type === 'op' && (this.current() as { type: 'op'; value: string }).value === '||') {
      this.consume();
      const right = this.parseAnd();
      left = { type: 'Binary', operator: '||', left, right };
    }
    return left;
  }

  private parseAnd(): ExpressionNode {
    let left = this.parseEquality();
    while (this.current().type === 'op' && (this.current() as { type: 'op'; value: string }).value === '&&') {
      this.consume();
      const right = this.parseEquality();
      left = { type: 'Binary', operator: '&&', left, right };
    }
    return left;
  }

  private parseEquality(): ExpressionNode {
    let left = this.parseRelational();
    while (this.current().type === 'op') {
      const op = (this.current() as { type: 'op'; value: string }).value;
      if (op !== '===' && op !== '!==' && op !== '==' && op !== '!=') break;
      this.consume();
      const right = this.parseRelational();
      left = { type: 'Binary', operator: op, left, right } as ExpressionNode;
    }
    return left;
  }

  private parseRelational(): ExpressionNode {
    let left = this.parseUnary();
    while (this.current().type === 'op') {
      const op = (this.current() as { type: 'op'; value: string }).value;
      if (op !== '<' && op !== '<=' && op !== '>' && op !== '>=') break;
      this.consume();
      const right = this.parseUnary();
      left = { type: 'Binary', operator: op, left, right } as ExpressionNode;
    }
    return left;
  }

  private parseUnary(): ExpressionNode {
    if (this.current().type === 'op' && (this.current() as { type: 'op'; value: string }).value === '!') {
      this.consume();
      return { type: 'Unary', operator: '!', argument: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ExpressionNode {
    const token = this.current();

    if (token.type === 'parenL') {
      this.consume();
      const expr = this.parseOr();
      this.expect('parenR');
      return expr;
    }

    if (token.type === 'number') {
      this.consume();
      return { type: 'Literal', value: token.value };
    }

    if (token.type === 'string') {
      this.consume();
      return { type: 'Literal', value: token.value };
    }

    if (token.type === 'identifier') {
      const ident = token.value;
      if (ident === 'true' || ident === 'false') {
        this.consume();
        return { type: 'Literal', value: ident === 'true' };
      }
      if (ident === 'null') {
        this.consume();
        return { type: 'Literal', value: null };
      }
      if (ident !== 'values') {
        throw new ExpressionParseError(`不支持的标识符: ${ident}（仅允许 values/true/false/null）`, token.pos);
      }

      // values['id']
      this.consume(); // values
      this.expect('bracketL');
      const keyToken = this.current();
      if (keyToken.type !== 'string') {
        throw new ExpressionParseError("values[...] 仅允许字符串字面量，例如 values['xxx']", keyToken.pos);
      }
      this.consume();
      this.expect('bracketR');
      return { type: 'ValuesRef', key: keyToken.value };
    }

    throw new ExpressionParseError('期望字面量、values[...] 或括号表达式', token.pos);
  }
}

function toBoolean(value: unknown): boolean {
  return Boolean(value);
}

function evaluateNode(node: ExpressionNode, values: Record<string, unknown>): unknown {
  switch (node.type) {
    case 'Literal':
      return node.value;
    case 'ValuesRef':
      return values[node.key];
    case 'Unary':
      return !toBoolean(evaluateNode(node.argument, values));
    case 'Binary': {
      const left = evaluateNode(node.left, values);
      const right = evaluateNode(node.right, values);

      switch (node.operator) {
        case '&&':
          return toBoolean(left) && toBoolean(right);
        case '||':
          return toBoolean(left) || toBoolean(right);
        case '===':
          return left === right;
        case '!==':
          return left !== right;
        case '==':
          // 为了可预测性，按严格相等处理（与 === 一致）
          return left === right;
        case '!=':
          // 为了可预测性，按严格不等处理（与 !== 一致）
          return left !== right;
        case '<':
        case '<=':
        case '>':
        case '>=': {
          if (typeof left === 'number' && typeof right === 'number') {
            if (node.operator === '<') return left < right;
            if (node.operator === '<=') return left <= right;
            if (node.operator === '>') return left > right;
            return left >= right;
          }
          if (typeof left === 'string' && typeof right === 'string') {
            if (node.operator === '<') return left < right;
            if (node.operator === '<=') return left <= right;
            if (node.operator === '>') return left > right;
            return left >= right;
          }
          return false;
        }
      }
    }
  }
}

const parseCache = new Map<string, ExpressionNode>();
const errorOnce = new Set<string>();

function parseWithCache(expression: string): ConditionValidationResult {
  const trimmed = expression.trim();
  if (!trimmed) {
    return { ok: true, ast: { type: 'Literal', value: true } };
  }

  const cached = parseCache.get(trimmed);
  if (cached) return { ok: true, ast: cached };

  try {
    const tokens = tokenize(trimmed);
    const ast = new Parser(tokens).parseExpression();
    parseCache.set(trimmed, ast);
    return { ok: true, ast };
  } catch (error) {
    if (error instanceof ExpressionParseError) {
      return { ok: false, error: error.message, pos: error.pos };
    }
    return { ok: false, error: error instanceof Error ? error.message : '表达式解析失败' };
  }
}

export function validateConditionExpression(expression: string): ConditionValidationResult {
  return parseWithCache(expression);
}

export function evaluateConditionSafe(expression: string, values: Record<string, unknown>): boolean {
  const parsed = parseWithCache(expression);
  if (!parsed.ok) {
    const key = `${expression}@@${parsed.error}`;
    if (!errorOnce.has(key)) {
      errorOnce.add(key);
      console.warn('[visibleOn] invalid expression:', parsed.error, { expression, pos: parsed.pos });
    }
    return true; // fail-open: 默认显示，避免因为表达式错误导致组件“消失”
  }

  try {
    return toBoolean(evaluateNode(parsed.ast, values));
  } catch (error) {
    const key = `${expression}@@runtime`;
    if (!errorOnce.has(key)) {
      errorOnce.add(key);
      console.warn('[visibleOn] evaluation failed:', error, { expression });
    }
    return true;
  }
}
