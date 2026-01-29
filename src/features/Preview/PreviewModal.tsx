/**
 * PreviewModal - 表单预览弹窗
 * 
 * 支持多种设备尺寸预览和全屏模式
 */

import React, { useState } from 'react';
import { Modal, Button, Tooltip, Space, Divider } from 'antd';
import {
    MobileOutlined,
    TabletOutlined,
    DesktopOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
} from '@ant-design/icons';
import { LazyFormRenderer } from '../../components';
import { useI18n } from '../../i18n';
import type { ComponentSchema } from '../../types';

interface PreviewModalProps {
    open: boolean;
    onClose: () => void;
    components: ComponentSchema[];
}

type PreviewDevice = 'mobile' | 'tablet' | 'desktop';

export const PreviewModal: React.FC<PreviewModalProps> = ({
    open,
    onClose,
    components,
}) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
    const { t } = useI18n();

    const handleClose = () => {
        onClose();
        setIsFullscreen(false);
    };

    const getWidth = () => {
        if (isFullscreen) return '100vw';
        switch (previewDevice) {
            case 'mobile': return 435;
            case 'tablet': return 830;
            default: return 700;
        }
    };

    const getDeviceWidth = () => {
        switch (previewDevice) {
            case 'mobile': return 375;
            case 'tablet': return 768;
            default: return '100%';
        }
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 32 }}>
                    <span>{t('preview.title')}</span>
                    <Space>
                        <Tooltip title={t('preview.mobile')}>
                            <Button
                                type={previewDevice === 'mobile' ? 'primary' : 'text'}
                                icon={<MobileOutlined />}
                                size="small"
                                onClick={() => setPreviewDevice('mobile')}
                            />
                        </Tooltip>
                        <Tooltip title={t('preview.tablet')}>
                            <Button
                                type={previewDevice === 'tablet' ? 'primary' : 'text'}
                                icon={<TabletOutlined />}
                                size="small"
                                onClick={() => setPreviewDevice('tablet')}
                            />
                        </Tooltip>
                        <Tooltip title={t('preview.desktop')}>
                            <Button
                                type={previewDevice === 'desktop' ? 'primary' : 'text'}
                                icon={<DesktopOutlined />}
                                size="small"
                                onClick={() => setPreviewDevice('desktop')}
                            />
                        </Tooltip>
                        <Divider type="vertical" style={{ height: 16 }} />
                        <Tooltip title={isFullscreen ? t('preview.exitFullscreen') : t('preview.fullscreen')}>
                            <Button
                                type="text"
                                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                                size="small"
                                onClick={() => setIsFullscreen(!isFullscreen)}
                            />
                        </Tooltip>
                    </Space>
                </div>
            }
            open={open}
            onCancel={handleClose}
            footer={null}
            width={getWidth()}
            centered={!isFullscreen}
            style={isFullscreen ? { top: 0, maxWidth: '100vw', padding: 0 } : undefined}
            styles={{
                body: { padding: 0, height: isFullscreen ? 'calc(100vh - 55px)' : 'auto', overflow: 'auto' },
            }}
        >
            <div
                style={{
                    padding: 20,
                    maxWidth: getDeviceWidth(),
                    margin: '0 auto',
                    background: previewDevice !== 'desktop' ? '#f5f5f5' : 'transparent',
                    minHeight: previewDevice === 'mobile' ? 600 : previewDevice === 'tablet' ? 500 : 'auto',
                    borderRadius: previewDevice !== 'desktop' ? 8 : 0,
                    boxShadow: previewDevice !== 'desktop' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                }}
            >
                <div style={{ background: 'white', padding: 16, borderRadius: previewDevice !== 'desktop' ? 8 : 0 }}>
                    <LazyFormRenderer components={components} />
                </div>
            </div>
        </Modal>
    );
};

export default PreviewModal;
