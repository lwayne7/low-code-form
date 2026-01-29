/**
 * 登录/注册模态框
 */
import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Segmented, Typography } from 'antd';
import { LockOutlined, MailOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../services/authStore';
import { useI18n } from '../../i18n';

const { Text } = Typography;

interface AuthModalProps {
    open: boolean;
    onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [form] = Form.useForm();
    const { login, register, isLoading, error, clearError } = useAuthStore();
    const { t } = useI18n();

    useEffect(() => {
        if (error) {
            message.error(error);
            clearError();
        }
    }, [error, clearError]);

    const handleSubmit = async (values: { email: string; password: string }) => {
        const success = activeTab === 'login'
            ? await login(values.email, values.password)
            : await register(values.email, values.password);

        if (success) {
            message.success(activeTab === 'login' ? t('auth.loginSuccess') : t('auth.registerSuccess'));
            form.resetFields();
            onClose();
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            destroyOnClose
            width={420}
            centered
            styles={{
                body: {
                    padding: 0,
                    overflow: 'hidden',
                },
            }}
            style={{ borderRadius: 16 }}
            closeIcon={null}
        >
            {/* 顶部装饰区域 */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 50%, #69b1ff 100%)',
                    padding: '40px 32px 32px',
                    textAlign: 'center',
                    position: 'relative',
                }}
            >
                {/* 关闭按钮 */}
                <Button
                    type="text"
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: 18,
                    }}
                >
                    ✕
                </Button>

                {/* Logo */}
                <div
                    style={{
                        width: 64,
                        height: 64,
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    {activeTab === 'login' ? (
                        <LoginOutlined style={{ fontSize: 28, color: '#fff' }} />
                    ) : (
                        <UserAddOutlined style={{ fontSize: 28, color: '#fff' }} />
                    )}
                </div>
                <Text
                    style={{
                        fontSize: 22,
                        fontWeight: 600,
                        color: '#fff',
                        display: 'block',
                        marginBottom: 4,
                    }}
                >
                    {activeTab === 'login' ? t('auth.welcome') : t('auth.createAccount')}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                    {activeTab === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
                </Text>
            </div>

            {/* 表单区域 */}
            <div style={{ padding: '24px 32px 32px' }}>
                {/* 切换标签 */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                    <Segmented
                        value={activeTab}
                        onChange={(value) => {
                            setActiveTab(value as 'login' | 'register');
                            form.resetFields();
                        }}
                        options={[
                            { label: t('header.login'), value: 'login', icon: <LoginOutlined /> },
                            { label: t('auth.registerBtn'), value: 'register', icon: <UserAddOutlined /> },
                        ]}
                        size="large"
                        style={{ borderRadius: 8 }}
                    />
                </div>

                <Form
                    form={form}
                    onFinish={handleSubmit}
                    layout="vertical"
                    size="large"
                    requiredMark={false}
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: t('error.emailRequired') },
                            { type: 'email', message: t('error.invalidEmail') },
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder={t('auth.email')}
                            style={{ borderRadius: 8, height: 48 }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: t('error.passwordRequired') },
                            ...(activeTab === 'register' ? [{ min: 6, message: t('error.passwordTooShort') }] : []),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder={activeTab === 'register' ? t('auth.passwordHint') : t('auth.password')}
                            style={{ borderRadius: 8, height: 48 }}
                        />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isLoading}
                            block
                            style={{
                                height: 48,
                                borderRadius: 8,
                                fontSize: 16,
                                fontWeight: 500,
                                boxShadow: '0 4px 12px rgba(22, 119, 255, 0.35)',
                            }}
                        >
                            {activeTab === 'login' ? t('auth.loginBtn') : t('auth.registerBtn')}
                        </Button>
                    </Form.Item>
                </Form>

                {/* 底部提示 */}
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        {activeTab === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                setActiveTab(activeTab === 'login' ? 'register' : 'login');
                                form.resetFields();
                            }}
                            style={{ padding: '0 4px', fontSize: 13 }}
                        >
                            {activeTab === 'login' ? t('auth.registerNow') : t('auth.loginNow')}
                        </Button>
                    </Text>
                </div>
            </div>
        </Modal>
    );
}
