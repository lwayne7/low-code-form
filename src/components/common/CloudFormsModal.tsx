/**
 * 云端表单列表模态框
 */
import { useEffect } from 'react';
import { Modal, List, Button, Popconfirm, message, Empty, Spin, Typography } from 'antd';
import { CloudOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useCloudStore } from '../../services/cloudStore';
import { useStore } from '../../store';
import { useI18n } from '../../i18n';
import type { ComponentSchema } from '../../types';

interface CloudFormsModalProps {
    open: boolean;
    onClose: () => void;
}

export function CloudFormsModal({ open, onClose }: CloudFormsModalProps) {
    const { cloudForms, fetchFormList, loadFromCloud, deleteFromCloud, syncStatus } = useCloudStore();
    const { addComponents, deleteComponent } = useStore();
    const { t, locale } = useI18n();

    useEffect(() => {
        if (open) {
            fetchFormList();
        }
    }, [open, fetchFormList]);

    const handleLoad = async (formId: number, formName: string) => {
        const schema = await loadFromCloud(formId);
        if (schema && Array.isArray(schema)) {
            // 清空当前画布
            const currentComponents = useStore.getState().components;
            if (currentComponents.length > 0) {
                deleteComponent(currentComponents.map((c) => c.id));
            }
            // 加载云端表单
            addComponents(schema as ComponentSchema[]);
            message.success(t('cloud.loadSuccess') + `: ${formName}`);
            onClose();
        }
    };

    const handleDelete = async (formId: number) => {
        const success = await deleteFromCloud(formId);
        if (success) {
            message.success(t('cloud.deleteSuccess'));
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Modal
            title={<><CloudOutlined /> {t('cloud.forms')}</>}
            open={open}
            onCancel={onClose}
            footer={null}
            width={600}
        >
            <Spin spinning={syncStatus === 'syncing'}>
                {cloudForms.length === 0 ? (
                    <Empty description={t('cloud.noForms')} />
                ) : (
                    <List
                        dataSource={cloudForms}
                        renderItem={(form) => (
                            <List.Item
                                actions={[
                                    <Button
                                        key="load"
                                        type="link"
                                        icon={<DownloadOutlined />}
                                        onClick={() => handleLoad(form.id, form.name)}
                                    >
                                        {t('common.load')}
                                    </Button>,
                                    <Popconfirm
                                        key="delete"
                                        title={t('cloud.deleteConfirm')}
                                        onConfirm={() => handleDelete(form.id)}
                                        okText={t('common.delete')}
                                        cancelText={t('common.cancel')}
                                    >
                                        <Button type="link" danger icon={<DeleteOutlined />}>
                                            {t('common.delete')}
                                        </Button>
                                    </Popconfirm>,
                                ]}
                            >
                                <List.Item.Meta
                                    title={form.name}
                                    description={
                                        <Typography.Text type="secondary">
                                            {form.description || t('cloud.noDescription')} · {t('cloud.updatedAt')} {formatDate(form.updatedAt)}
                                        </Typography.Text>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Spin>
        </Modal>
    );
}
