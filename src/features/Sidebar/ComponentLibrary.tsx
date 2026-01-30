/**
 * ComponentLibrary - 左侧组件库
 * 
 * 包含组件搜索和可拖拽的组件卡片
 */

import React from 'react';
import { Input, Space, Typography } from 'antd';
import { AppstoreAddOutlined } from '@ant-design/icons';
import { DraggableSidebarItem } from '../../components';
import { COMPONENT_MATERIALS } from '../../constants';
import { useI18n } from '../../i18n';
import type { ComponentType } from '../../types';

const { Title } = Typography;

// 组件类型到翻译 key 的映射
const COMPONENT_TYPE_I18N_KEYS: Record<ComponentType, string> = {
    Container: 'components.container',
    Input: 'components.input',
    TextArea: 'components.textarea',
    InputNumber: 'components.inputNumber',
    Select: 'components.select',
    Radio: 'components.radio',
    Checkbox: 'components.checkbox',
    Switch: 'components.switch',
    DatePicker: 'components.datePicker',
    TimePicker: 'components.timePicker',
    Button: 'components.button',
};

interface ComponentLibraryProps {
    isDark: boolean;
    componentSearch: string;
    onSearchChange: (value: string) => void;
    onAddComponent: (type: ComponentType) => void;
}

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
    isDark,
    componentSearch,
    onSearchChange,
    onAddComponent,
}) => {
    const { t } = useI18n();

    // 获取组件的翻译名称
    const getComponentLabel = (type: ComponentType) => {
        const key = COMPONENT_TYPE_I18N_KEYS[type];
        return key ? t(key as keyof typeof t) : type;
    };

    const filteredMaterials = COMPONENT_MATERIALS.filter((item) => {
        const translatedLabel = getComponentLabel(item.type);
        return translatedLabel.toLowerCase().includes(componentSearch.toLowerCase()) ||
            item.type.toLowerCase().includes(componentSearch.toLowerCase());
    });

    return (
        <div style={{ padding: '20px 16px' }}>
            <Space align="center" style={{ marginBottom: 12 }}>
                <AppstoreAddOutlined style={{ color: isDark ? '#4096ff' : '#1677ff' }} />
                <Title level={5} style={{ margin: 0, color: isDark ? '#e6e6e6' : undefined }}>
                    {t('components.library')}
                </Title>
            </Space>

            {/* 组件搜索 */}
            <Input
                placeholder={t('components.search')}
                aria-label={t('components.search')}
                value={componentSearch}
                onChange={(e) => onSearchChange(e.target.value)}
                allowClear
                style={{ marginBottom: 12 }}
            />

            <div className="component-grid">
                {filteredMaterials.map((item) => (
                    <DraggableSidebarItem
                        key={item.type}
                        id={`new-${item.type}`}
                        onClick={() => onAddComponent(item.type as ComponentType)}
                    >
                        {item.icon}
                        <span className="component-card-label">{getComponentLabel(item.type)}</span>
                    </DraggableSidebarItem>
                ))}
                {filteredMaterials.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-color-tertiary, #999)', padding: 16 }}>
                        {t('components.notFound')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComponentLibrary;
