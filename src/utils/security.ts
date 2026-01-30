/**
 * Security Utilities - 安全工具函数
 * 
 * 面试考点：
 * 1. XSS 防护
 * 2. CSP (Content Security Policy)
 * 3. 输入验证与净化
 * 4. 安全编码实践
 * 
 * @example
 * ```tsx
 * // 防止 XSS 攻击
 * const safeHtml = escapeHtml(userInput);
 * 
 * // 验证 URL 安全性
 * if (isSafeUrl(url)) {
 *   window.open(url);
 * }
 * ```
 */

// ============ XSS 防护 ============

/**
 * HTML 实体转义映射
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * 转义 HTML 特殊字符，防止 XSS 攻击
 * @param str 需要转义的字符串
 * @returns 转义后的安全字符串
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/**
 * 转义 JavaScript 字符串
 * @param str 需要转义的字符串
 * @returns 转义后的安全字符串
 */
export function escapeJsString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

// ============ URL 安全验证 ============

/**
 * 危险的 URL 协议列表
 */
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
];

/**
 * 验证 URL 是否安全
 * @param url 需要验证的 URL
 * @returns 是否安全
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // 检查危险协议
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (trimmedUrl.startsWith(protocol)) {
      return false;
    }
  }
  
  // 允许相对 URL、http、https
  try {
    const parsed = new URL(url, window.location.origin);
    return ['http:', 'https:', ''].includes(parsed.protocol);
  } catch {
    // 相对 URL 或无效 URL
    return !trimmedUrl.includes(':') || trimmedUrl.startsWith('/');
  }
}

/**
 * 净化 URL，移除危险协议
 * @param url 需要净化的 URL
 * @returns 净化后的 URL 或空字符串
 */
export function sanitizeUrl(url: string): string {
  return isSafeUrl(url) ? url : '';
}

// ============ 代码安全检查 ============

/**
 * 危险的代码模式
 */
const DANGEROUS_PATTERNS = [
  // 直接执行代码
  /\beval\s*\(/i,
  /\bFunction\s*\(/i,
  /\bsetTimeout\s*\(\s*["'`]/i,
  /\bsetInterval\s*\(\s*["'`]/i,
  // DOM 操作
  /\binnerHTML\s*=/i,
  /\bouterHTML\s*=/i,
  /\bdocument\.write\s*\(/i,
  // 事件处理
  /\bon\w+\s*=/i,
  // 导入/动态加载
  /\bimport\s*\(/i,
];

/**
 * 检查代码是否包含危险模式
 * @param code 需要检查的代码
 * @returns 是否包含危险代码
 */
export function containsDangerousCode(code: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(code));
}

/**
 * 检查表达式是否安全（用于条件表达式验证）
 * @param expression 需要检查的表达式
 * @returns 是否安全
 */
export function isExpressionSafe(expression: string): boolean {
  if (!expression || typeof expression !== 'string') return true;
  
  // 不允许的关键字
  const blockedKeywords = [
    'eval', 'Function', 'constructor',
    'prototype', '__proto__', '__defineGetter__',
    '__defineSetter__', '__lookupGetter__', '__lookupSetter__',
    'window', 'document', 'globalThis', 'self',
    'fetch', 'XMLHttpRequest', 'WebSocket',
    'import', 'require', 'module', 'exports',
  ];
  
  const lowerExpr = expression.toLowerCase();
  return !blockedKeywords.some((keyword) => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(lowerExpr)
  );
}

// ============ 输入净化 ============

/**
 * 净化用户输入，移除潜在的危险字符
 * @param input 用户输入
 * @param options 净化选项
 * @returns 净化后的字符串
 */
export function sanitizeInput(
  input: string,
  options: {
    maxLength?: number;
    allowNewlines?: boolean;
    stripHtml?: boolean;
  } = {}
): string {
  const { maxLength = 10000, allowNewlines = true, stripHtml = true } = options;
  
  let result = input;
  
  // 限制长度
  if (result.length > maxLength) {
    result = result.slice(0, maxLength);
  }
  
  // 移除 HTML 标签
  if (stripHtml) {
    result = result.replace(/<[^>]*>/g, '');
  }
  
  // 处理换行符
  if (!allowNewlines) {
    result = result.replace(/[\r\n]/g, ' ');
  }
  
  // 移除零宽字符
  result = result.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  return result.trim();
}

// ============ CSP 辅助函数 ============

/**
 * 生成随机 nonce 值
 * @returns 随机 nonce 字符串
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * CSP 策略配置
 */
export interface CSPConfig {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  fontSrc?: string[];
  connectSrc?: string[];
  frameSrc?: string[];
  objectSrc?: string[];
  baseUri?: string[];
  formAction?: string[];
  upgradeInsecureRequests?: boolean;
}

/**
 * 生成 CSP 头部字符串
 * @param config CSP 配置
 * @returns CSP 头部值
 */
export function generateCSP(config: CSPConfig): string {
  const directives: string[] = [];
  
  if (config.defaultSrc) {
    directives.push(`default-src ${config.defaultSrc.join(' ')}`);
  }
  if (config.scriptSrc) {
    directives.push(`script-src ${config.scriptSrc.join(' ')}`);
  }
  if (config.styleSrc) {
    directives.push(`style-src ${config.styleSrc.join(' ')}`);
  }
  if (config.imgSrc) {
    directives.push(`img-src ${config.imgSrc.join(' ')}`);
  }
  if (config.fontSrc) {
    directives.push(`font-src ${config.fontSrc.join(' ')}`);
  }
  if (config.connectSrc) {
    directives.push(`connect-src ${config.connectSrc.join(' ')}`);
  }
  if (config.frameSrc) {
    directives.push(`frame-src ${config.frameSrc.join(' ')}`);
  }
  if (config.objectSrc) {
    directives.push(`object-src ${config.objectSrc.join(' ')}`);
  }
  if (config.baseUri) {
    directives.push(`base-uri ${config.baseUri.join(' ')}`);
  }
  if (config.formAction) {
    directives.push(`form-action ${config.formAction.join(' ')}`);
  }
  if (config.upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests');
  }
  
  return directives.join('; ');
}
