module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // Bug 修复
        'docs',     // 文档变更
        'style',    // 代码格式（不影响代码运行）
        'refactor', // 代码重构
        'perf',     // 性能优化
        'test',     // 测试相关
        'chore',    // 构建工具或辅助工具变动
        'revert',   // 回滚
        'build',    // 打包构建
        'ci',       // CI 配置
      ],
    ],
    'subject-case': [0], // 允许任意大小写
    'header-max-length': [2, 'always', 100],
  },
};
