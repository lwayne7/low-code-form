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
import type { ComponentType } from '../../types';

const { Title } = Typography;

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
    const filteredMaterials = COMPONENT_MATERIALS.filter((item) =>
        item.label.toLowerCase().includes(componentSearch.toLowerCase()) ||
        item.type.toLowerCase().includes(componentSearch.toLowerCase())
    );

    return (
        <div style={{ padding: '20px 16px' }}>
            <Space align="center" style={{ marginBottom: 12 }}>
                <AppstoreAddOutlined style={{ color: isDark ? '#4096ff' : '#1677ff' }} />
                <Title level={5} style={{ margin: 0, color: isDark ? '#e6e6e6' : undefined }}>
                    组件库
                </Title>
            </Space>

            {/* 组件搜索 */}
            <Input
                placeholder="搜索组件..."
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
                        <span className="component-card-label">{item.label}</span>
                    </DraggableSidebarItem>
                ))}
                {filteredMaterials.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: isDark ? '#737373' : '#999', padding: 16 }}>
                        未找到匹配的组件
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComponentLibrary;
