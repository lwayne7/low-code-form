/**
 * 保存到云端模态框
 */
import { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { useCloudStore } from '../../services/cloudStore';
import { useStore } from '../../store';
import { useI18n } from '../../i18n';

interface SaveToCloudModalProps {
    open: boolean;
    onClose: () => void;
}

export function SaveToCloudModal({ open, onClose }: SaveToCloudModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { saveToCloud, updateInCloud, currentFormId } = useCloudStore();
    const components = useStore((s) => s.components);
    const { t } = useI18n();

    const handleSave = async (values: { name: string; description?: string }) => {
        if (components.length === 0) {
            message.warning(t('cloud.emptyCanvas'));
            return;
        }

        setLoading(true);
        try {
            if (currentFormId) {
                // 更新现有表单
                const success = await updateInCloud(currentFormId, {
                    name: values.name,
                    description: values.description,
                    schema: components,
                });
                if (success) {
                    message.success(t('cloud.updateSuccess'));
                    onClose();
                }
            } else {
                // 创建新表单
                const formId = await saveToCloud(values.name, components, values.description);
                if (formId) {
                    message.success(t('cloud.saveSuccess'));
                    onClose();
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={<><CloudUploadOutlined /> {t('cloud.saveTitle')}</>}
            open={open}
            onCancel={onClose}
            footer={null}
            destroyOnClose
            width={450}
        >
            <Form form={form} onFinish={handleSave} layout="vertical">
                <Form.Item
                    name="name"
                    label={t('cloud.formName')}
                    rules={[{ required: true, message: t('cloud.formNamePlaceholder') }]}
                >
                    <Input placeholder={t('cloud.formNameExample')} />
                </Form.Item>
                <Form.Item name="description" label={t('cloud.formDesc')}>
                    <Input.TextArea rows={3} placeholder={t('cloud.formDescPlaceholder')} />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                        {currentFormId ? t('common.update') : t('common.save')}
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
}
