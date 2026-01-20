import { test, expect } from '@playwright/test';

/**
 * E2E 测试 - 性能测试
 * 
 * 测试场景：
 * 1. 大量组件渲染性能
 * 2. 页面加载性能
 * 3. 交互响应性能
 */

test.describe('性能测试', () => {
  test('页面首次加载应该在合理时间内完成', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForSelector('.app-header');
    
    const loadTime = Date.now() - startTime;
    
    // 页面加载时间应该少于3秒
    expect(loadTime).toBeLessThan(3000);
    
    console.log(`页面加载时间: ${loadTime}ms`);
  });

  test('添加100个组件应该保持响应', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.app-header');
    
    const startTime = Date.now();
    
    // 使用控制台执行批量添加
    await page.evaluate(() => {
      const { addComponent } = (window as any).useStore.getState();
      for (let i = 0; i < 100; i++) {
        addComponent('Input');
      }
    });
    
    // 等待DOM更新
    await page.waitForTimeout(1000);
    
    const addTime = Date.now() - startTime;
    
    // 添加100个组件应该在5秒内完成
    expect(addTime).toBeLessThan(5000);
    
    console.log(`添加100个组件耗时: ${addTime}ms`);
    
    // 验证组件数量
    const count = await page.evaluate(() => {
      return (window as any).useStore.getState().components.length;
    });
    expect(count).toBe(100);
  });

  test('测试撤销性能（50次操作）', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.app-header');
    
    // 添加50个组件
    await page.evaluate(() => {
      const { addComponent } = (window as any).useStore.getState();
      for (let i = 0; i < 50; i++) {
        addComponent('Input');
      }
    });
    
    await page.waitForTimeout(500);
    
    const startTime = Date.now();
    
    // 撤销50次
    await page.evaluate(() => {
      const { undo } = (window as any).useStore.getState();
      for (let i = 0; i < 50; i++) {
        undo();
      }
    });
    
    const undoTime = Date.now() - startTime;
    
    // 撤销50次应该在2秒内完成
    expect(undoTime).toBeLessThan(2000);
    
    console.log(`撤销50次耗时: ${undoTime}ms`);
    
    // 验证已全部撤销
    const count = await page.evaluate(() => {
      return (window as any).useStore.getState().components.length;
    });
    expect(count).toBe(0);
  });

  test('测试复制粘贴性能', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.app-header');
    
    // 添加50个组件
    await page.evaluate(() => {
      const { addComponent } = (window as any).useStore.getState();
      for (let i = 0; i < 50; i++) {
        addComponent('Input');
      }
    });
    
    await page.waitForTimeout(500);
    
    const startTime = Date.now();
    
    // 全选、复制、粘贴
    await page.evaluate(() => {
      const { selectAll, copyComponents, pasteComponents } = (window as any).useStore.getState();
      selectAll();
      copyComponents();
      pasteComponents();
    });
    
    const copyPasteTime = Date.now() - startTime;
    
    // 复制粘贴50个组件应该在2秒内完成
    expect(copyPasteTime).toBeLessThan(2000);
    
    console.log(`复制粘贴50个组件耗时: ${copyPasteTime}ms`);
    
    // 验证组件数量翻倍
    const count = await page.evaluate(() => {
      return (window as any).useStore.getState().components.length;
    });
    expect(count).toBe(100);
  });

  test('测试深度嵌套容器的渲染性能', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.app-header');
    
    const startTime = Date.now();
    
    // 创建深度嵌套结构（深度5层）
    await page.evaluate(() => {
      const { addComponent } = (window as any).useStore.getState();
      
      let parentId: string | undefined = undefined;
      
      // 创建5层嵌套容器
      for (let depth = 0; depth < 5; depth++) {
        addComponent('Container', parentId);
        const components = (window as any).useStore.getState().components;
        
        // 获取最新添加的容器ID
        if (parentId === undefined) {
          parentId = components[components.length - 1].id;
        } else {
          const findLastContainer = (items: any[]): any => {
            for (let i = items.length - 1; i >= 0; i--) {
              if (items[i].type === 'Container') {
                if (items[i].children && items[i].children.length > 0) {
                  const found = findLastContainer(items[i].children);
                  if (found) return found;
                }
                return items[i];
              }
            }
            return null;
          };
          const lastContainer = findLastContainer(components);
          parentId = lastContainer?.id;
        }
        
        // 在每层添加3个Input
        for (let i = 0; i < 3; i++) {
          addComponent('Input', parentId);
        }
      }
    });
    
    await page.waitForTimeout(1000);
    
    const renderTime = Date.now() - startTime;
    
    // 深度嵌套渲染应该在5秒内完成
    expect(renderTime).toBeLessThan(5000);
    
    console.log(`渲染深度嵌套结构耗时: ${renderTime}ms`);
  });
});
