/**
 * MobileDrawers - 移动端抽屉组件
 * 
 * 包含组件库抽屉和属性面板抽屉
 */

import React from 'react';
import { Drawer, Space, Input } from 'antd';
import { AppstoreAddOutlined, SettingOutlined } from '@ant-design/icons';
import { PropertyPanel } from '../../components';
import { COMPONENT_MATERIALS } from '../../constants';
import { useI18n } from '../../i18n';
import type { ComponentSchema, ComponentType } from '../../types';

interface MobileDrawersProps {
    // 组件抽屉
    isMobileDrawerOpen: boolean;
    onMobileDrawerClose: () => void;
    componentSearch: string;
    onSearchChange: (value: string) => void;
    onAddComponent: (type: ComponentType) => void;
    // 属性抽屉
    isPropertyDrawerOpen: boolean;
    onPropertyDrawerClose: () => void;
    selectedIds: string[];
    selectedComponent: ComponentSchema | undefined;
    components: ComponentSchema[];
    updateComponentProps: (id: string, props: Partial<ComponentSchema['props']>) => void;
    deleteComponent: (ids: string | string[]) => void;
}

export const MobileDrawers: React.FC<MobileDrawersProps> = ({
    isMobileDrawerOpen,
    onMobileDrawerClose,
    componentSearch,
    onSearchChange,
    onAddComponent,
    isPropertyDrawerOpen,
    onPropertyDrawerClose,
    selectedIds,
    selectedComponent,
    components,
    updateComponentProps,
    deleteComponent,
}) => {
    const { t } = useI18n();

    const filteredMaterials = COMPONENT_MATERIALS.filter((item) =>
        item.label.toLowerCase().includes(componentSearch.toLowerCase()) ||
        item.type.toLowerCase().includes(componentSearch.toLowerCase())
    );

    return (
        <>
            {/* 📱 移动端组件库抽屉 */}
            <Drawer
                title={
                    <Space>
                        <AppstoreAddOutlined style={{ color: '#1677ff' }} />
                        <span>{t('components.library')}</span>
                    </Space>
                }
                placement="left"
                open={isMobileDrawerOpen}
                onClose={onMobileDrawerClose}
                width={280}
            >
                <Input
                    placeholder={t('components.search')}
                    value={componentSearch}
                    onChange={(e) => onSearchChange(e.target.value)}
                    allowClear
                    style={{ marginBottom: 12 }}
                />
                <div className="component-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    {filteredMaterials.map((item) => (
                        <div
                            key={item.type}
                            className="component-card"
                            onClick={() => {
                                onAddComponent(item.type as ComponentType);
                                onMobileDrawerClose();
                            }}
                        >
                            {item.icon}
                            <span className="component-card-label">{item.label}</span>
                        </div>
                    ))}
                </div>
            </Drawer>

            {/* 📱 移动端属性面板抽屉 */}
            <Drawer
                title={
                    <Space>
                        <SettingOutlined style={{ color: '#1677ff' }} />
                        <span>{t('property.title')}</span>
                    </Space>
                }
                placement="right"
                open={isPropertyDrawerOpen}
                onClose={onPropertyDrawerClose}
                width={320}
            >
                <PropertyPanel
                    selectedIds={selectedIds}
                    selectedComponent={selectedComponent}
                    components={components}
                    updateComponentProps={updateComponentProps}
                    deleteComponent={deleteComponent}
                />
            </Drawer>
        </>
    );
};

export default MobileDrawers;
