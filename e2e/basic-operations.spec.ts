import { test, expect } from '@playwright/test';

/**
 * E2E 测试 - 基础操作流程
 * 
 * 测试场景：
 * 1. 页面加载
 * 2. 添加组件
 * 3. 组件配置
 * 4. 拖拽排序
 * 5. 删除组件
 */

test.describe('基础操作流程', () => {
  test.beforeEach(async ({ page }) => {
    // 访问应用
    await page.goto('/');
    
    // 等待应用加载完成
    await page.waitForSelector('.app-header');
  });

  test('页面应该正确加载并显示所有主要元素', async ({ page }) => {
    // 验证标题
    await expect(page.locator('.app-title')).toContainText('LowCode Form');
    
    // 验证左侧组件库
    await expect(page.locator('.sidebar-left')).toBeVisible();
    await expect(page.locator('text=组件库')).toBeVisible();
    
    // 验证中间画布区域
    await expect(page.locator('.canvas-container')).toBeVisible();
    
    // 验证右侧属性面板
    await expect(page.locator('.sidebar-right')).toBeVisible();
    
    // 验证工具栏按钮
    await expect(page.getByRole('button', { name: /撤销/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /重做/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /预览/ })).toBeVisible();
  });

  test('应该能够点击添加输入框组件', async ({ page }) => {
    // 点击 Input 组件卡片
    await page.locator('.component-card', { hasText: '输入框' }).click();
    
    // 验证画布中出现了组件
    await expect(page.locator('.canvas-paper .sortable-item')).toHaveCount(1);
    
    // 验证右侧属性面板显示组件配置
    await expect(page.locator('.sidebar-right')).toContainText('组件属性');
  });

  test('应该能够添加多个不同类型的组件', async ({ page }) => {
    // 添加输入框
    await page.locator('.component-card', { hasText: '输入框' }).click();
    await page.waitForTimeout(200);
    
    // 添加按钮
    await page.locator('.component-card', { hasText: '按钮' }).click();
    await page.waitForTimeout(200);
    
    // 添加下拉选择
    await page.locator('.component-card', { hasText: '下拉选择' }).click();
    await page.waitForTimeout(200);
    
    // 验证画布中有3个组件
    await expect(page.locator('.canvas-paper .sortable-item')).toHaveCount(3);
  });

  test('应该能够修改组件属性', async ({ page }) => {
    // 添加输入框
    await page.locator('.component-card', { hasText: '输入框' }).click();
    
    // 等待属性面板出现
    await page.waitForSelector('input[placeholder="请输入标签文本"]');
    
    // 修改标签文本
    const labelInput = page.locator('input[placeholder="请输入标签文本"]').first();
    await labelInput.fill('用户名');
    
    // 修改占位符文本
    const placeholderInput = page.locator('input[placeholder="请输入占位符文本"]').first();
    await placeholderInput.fill('请输入您的用户名');
    
    // 验证画布中的组件已更新
    await expect(page.locator('.canvas-paper')).toContainText('用户名');
  });

  test('应该能够删除组件', async ({ page }) => {
    // 添加两个组件
    await page.locator('.component-card', { hasText: '输入框' }).click();
    await page.waitForTimeout(200);
    await page.locator('.component-card', { hasText: '按钮' }).click();
    await page.waitForTimeout(200);
    
    // 验证有2个组件
    await expect(page.locator('.canvas-paper .sortable-item')).toHaveCount(2);
    
    // 点击删除按钮（在属性面板中）
    await page.getByRole('button', { name: /删除组件/ }).click();
    
    // 验证只剩1个组件
    await expect(page.locator('.canvas-paper .sortable-item')).toHaveCount(1);
  });

  test('应该能够使用键盘快捷键删除组件', async ({ page }) => {
    // 添加组件
    await page.locator('.component-card', { hasText: '输入框' }).click();
    
    // 选中组件（点击）
    await page.locator('.canvas-paper .sortable-item').first().click();
    
    // 按 Delete 键删除
    await page.keyboard.press('Delete');
    
    // 验证组件已删除
    await expect(page.locator('.canvas-paper .sortable-item')).toHaveCount(0);
  });

  test('撤销和重做功能应该正常工作', async ({ page }) => {
    // 添加组件
    await page.locator('.component-card', { hasText: '输入框' }).click();
    await expect(page.locator('.canvas-paper .sortable-item')).toHaveCount(1);
    
    // 点击撤销
    await page.getByRole('button', { name: /撤销/ }).click();
    await expect(page.locator('.canvas-paper .sortable-item')).toHaveCount(0);
    
    // 点击重做
    await page.getByRole('button', { name: /重做/ }).click();
    await expect(page.locator('.canvas-paper .sortable-item')).toHaveCount(1);
  });

  test('应该能够清空画布', async ({ page }) => {
    // 添加多个组件
    await page.locator('.component-card', { hasText: '输入框' }).click();
    await page.waitForTimeout(200);
    await page.locator('.component-card', { hasText: '按钮' }).click();
    await page.waitForTimeout(200);
    
    await expect(page.locator('.canvas-paper .sortable-item')).toHaveCount(2);
    
    // 点击清空按钮
    await page.getByRole('button', { name: /清空画布/ }).click();
    
    // 确认对话框
    await page.getByRole('button', { name: '清空' }).click();
    
    // 验证画布已清空
    await expect(page.locator('.canvas-paper .sortable-item')).toHaveCount(0);
  });
});
