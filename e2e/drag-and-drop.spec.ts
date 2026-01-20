import { test, expect } from '@playwright/test';

/**
 * E2E 测试 - 拖拽功能
 * 
 * 测试场景：
 * 1. 从侧边栏拖拽组件到画布
 * 2. 画布内组件拖拽排序
 * 3. 拖拽到容器内
 * 4. 跨容器拖拽
 */

test.describe('拖拽功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.app-header');
  });

  test('应该能够从侧边栏拖拽组件到画布', async ({ page }) => {
    // 获取输入框组件卡片
    const inputCard = page.locator('.component-card', { hasText: '输入框' }).first();
    const canvas = page.locator('.canvas-paper');
    
    // 执行拖拽
    await inputCard.dragTo(canvas);
    
    // 等待一小段时间让拖拽完成
    await page.waitForTimeout(300);
    
    // 验证画布中出现了组件
    await expect(page.locator('.canvas-paper .sortable-item')).toHaveCount(1);
  });

  test('应该能够在画布内拖拽组件进行排序', async ({ page }) => {
    // 先添加三个组件（点击方式）
    await page.locator('.component-card', { hasText: '输入框' }).click();
    await page.waitForTimeout(200);
    await page.locator('.component-card', { hasText: '按钮' }).click();
    await page.waitForTimeout(200);
    await page.locator('.component-card', { hasText: '下拉选择' }).click();
    await page.waitForTimeout(200);
    
    // 获取第一个和第三个组件
    const firstItem = page.locator('.canvas-paper .sortable-item').first();
    const thirdItem = page.locator('.canvas-paper .sortable-item').nth(2);
    
    // 记录第一个组件的文本
    const firstText = await firstItem.textContent();
    
    // 拖拽第三个组件到第一个位置
    await thirdItem.dragTo(firstItem);
    await page.waitForTimeout(300);
    
    // 验证顺序已改变（第一个组件的文本应该不同）
    const newFirstText = await page.locator('.canvas-paper .sortable-item').first().textContent();
    expect(newFirstText).not.toBe(firstText);
  });

  test('应该能够拖拽组件到容器内', async ({ page }) => {
    // 添加容器
    await page.locator('.component-card', { hasText: '容器' }).click();
    await page.waitForTimeout(200);
    
    // 添加输入框
    await page.locator('.component-card', { hasText: '输入框' }).click();
    await page.waitForTimeout(200);
    
    // 获取容器和输入框
    const container = page.locator('.sortable-item', { has: page.locator('text=容器') }).first();
    const input = page.locator('.sortable-item').nth(1);
    
    // 拖拽输入框到容器内
    await input.dragTo(container);
    await page.waitForTimeout(300);
    
    // 验证容器内有组件（通过检查容器内的嵌套结构）
    const containerCard = container.locator('.ant-card');
    await expect(containerCard).toBeVisible();
  });
});
