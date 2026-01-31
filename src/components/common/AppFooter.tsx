/**
 * AppFooter - 页脚组件
 *
 * 显示品牌信息和作者署名
 */

import React from 'react';
import { Typography, Space, Tooltip } from 'antd';
import { GithubOutlined, HeartFilled } from '@ant-design/icons';
import { useI18n } from '../../i18n';

const { Text, Link } = Typography;

interface AppFooterProps {
  isDark?: boolean;
}

export const AppFooter: React.FC<AppFooterProps> = ({ isDark = false }) => {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        padding: '12px 24px',
        background: isDark ? 'rgba(31, 31, 31, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        zIndex: 10,
      }}
    >
      {/* 左侧 - 版权信息 */}
      <Space size={8} wrap>
        <Text
          style={{
            fontSize: 12,
            color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)',
          }}
        >
          © {currentYear}{' '}
          <strong
            style={{
              background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 600,
            }}
          >
            FormCraft
          </strong>
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
          }}
        >
          {t('footer.createdBy')}
        </Text>
      </Space>

      {/* 中间 - 技术栈 */}
      <Space size={4}>
        <Text
          style={{
            fontSize: 11,
            color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
          }}
        >
          {t('footer.builtWith')}
        </Text>
        <Tooltip title="Made with love">
          <HeartFilled
            style={{
              fontSize: 10,
              color: '#ff4d4f',
              animation: 'heartbeat 1.5s ease infinite',
            }}
          />
        </Tooltip>
      </Space>

      {/* 右侧 - GitHub 链接 */}
      <Space size={12}>
        <Text
          style={{
            fontSize: 11,
            color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
          }}
        >
          {t('footer.version')} 3.0.0
        </Text>
        <Tooltip title={t('footer.github')}>
          <Link
            href="https://github.com/lwayne7/low-code-form"
            target="_blank"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)',
              transition: 'all 0.2s ease',
            }}
          >
            <GithubOutlined style={{ fontSize: 16 }} />
          </Link>
        </Tooltip>
      </Space>
    </footer>
  );
};

export default AppFooter;
