/**
 * 表单校验工具函数
 */

import type { ValidationRule } from '../types';

/**
 * 校验单个值
 */
export function validateValue(
  value: unknown, 
  rules: ValidationRule[] | undefined, 
  label: string
): string | null {
  if (!rules || rules.length === 0) return null;

  for (const rule of rules) {
    const error = validateByRule(value, rule, label);
    if (error) return error;
  }
  return null;
}

/**
 * 根据单条规则校验
 */
function validateByRule(
  value: unknown, 
  rule: ValidationRule, 
  label: string
): string | null {
  switch (rule.type) {
    case 'required':
      if (isEmpty(value)) {
        return rule.message || `${label}不能为空`;
      }
      break;
      
    case 'minLength':
      if (typeof value === 'string' && value.length < (rule.value as number)) {
        return rule.message || `${label}至少需要${rule.value}个字符`;
      }
      break;
      
    case 'maxLength':
      if (typeof value === 'string' && value.length > (rule.value as number)) {
        return rule.message || `${label}最多${rule.value}个字符`;
      }
      break;
      
    case 'min':
      if (typeof value === 'number' && value < (rule.value as number)) {
        return rule.message || `${label}不能小于${rule.value}`;
      }
      break;
      
    case 'max':
      if (typeof value === 'number' && value > (rule.value as number)) {
        return rule.message || `${label}不能大于${rule.value}`;
      }
      break;
      
    case 'pattern':
      if (typeof value === 'string' && rule.value) {
        const regex = new RegExp(rule.value as string);
        if (!regex.test(value)) {
          return rule.message || `${label}格式不正确`;
        }
      }
      break;
      
    case 'email':
      if (typeof value === 'string' && value && !isValidEmail(value)) {
        return rule.message || '请输入有效的邮箱地址';
      }
      break;
      
    case 'phone':
      if (typeof value === 'string' && value && !isValidPhone(value)) {
        return rule.message || '请输入有效的手机号码';
      }
      break;
  }
  
  return null;
}

/**
 * 判断值是否为空
 */
function isEmpty(value: unknown): boolean {
  return (
    value === undefined || 
    value === null || 
    value === '' || 
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * 验证邮箱格式
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号格式（中国大陆）
 */
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}
