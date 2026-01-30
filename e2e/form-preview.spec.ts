import { test, expect } from '@playwright/test';

/**
 * E2E 测试 - 表单预览和导出功能
 * 
 * 测试场景：
 * 1. 预览表单
 * 2. 响应式预览切换
 * 3. 导出 JSON
 * 4. 导出代码
 */

test.describe('表单预览和导出', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.app-header');
    
    // 添加几个测试组件
    await page.getByTestId('material-Input').click();
    await page.waitForTimeout(200);
    await page.getByTestId('material-Button').click();
    await page.waitForTimeout(200);
  });

  test('应该能够打开预览模态框', async ({ page }) => {
    // 点击预览按钮
    await page.getByTestId('btn-preview').click();
    
    // 验证预览模态框已打开
    await expect(page.locator('.ant-modal')).toBeVisible();
    
    // 验证预览内容中有表单组件
    await expect(page.locator('.ant-modal .ant-form')).toBeVisible();
  });

  test('应该能够切换预览设备尺寸', async ({ page }) => {
    // 打开预览
    await page.getByTestId('btn-preview').click();
    
    // 点击手机预览按钮
    await page.getByTestId('preview-device-mobile').click();
    await page.waitForTimeout(200);
    
    // 验证预览区域调整为手机尺寸
    const previewContainer = page.locator('.ant-modal-body > div').first();
    await expect(previewContainer).toBeVisible();
  });

  test('应该能够全屏预览', async ({ page }) => {
    // 打开预览
    await page.getByTestId('btn-preview').click();
    
    // 点击全屏按钮（如果存在）
    await page.getByTestId('preview-fullscreen').click();
    await page.waitForTimeout(200);
    
    // 验证模态框仍可见
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
  });

  test('应该能够导出 JSON', async ({ page }) => {
    // 点击 JSON 按钮
    await page.getByTestId('btn-json').click();
    
    // 验证 JSON 编辑器出现
    await expect(page.locator('.ant-modal')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
    
    // 验证 JSON 内容不为空
    const jsonContent = await page.locator('textarea').inputValue();
    expect(jsonContent.length).toBeGreaterThan(10);
    expect(jsonContent).toContain('"type"');
  });

  test('应该能够导出代码', async ({ page }) => {
    // 点击导出按钮
    await page.getByTestId('btn-export').click();
    
    // 验证导出模态框出现
    await expect(page.locator('.ant-modal')).toBeVisible();
    
    // 验证有 React 代码
    await expect(page.locator('textarea').first()).toBeVisible();
    const code = await page.locator('textarea').first().inputValue();
    expect(code).toContain('import React');
    expect(code).toContain('Form');
  });
});
