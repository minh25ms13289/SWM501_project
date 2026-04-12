import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const { Title } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      const user = useAuthStore.getState().user;
      const routes: Record<string, string> = {
        learner: '/learner/dashboard',
        admin: '/admin/dashboard',
        instructor: '/instructor/schedule',
        director: '/admin/dashboard',
      };
      navigate(routes[user?.role || 'learner']);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Login failed';
      if (err.response?.status === 423) message.error('Account locked for 15 minutes');
      else message.error(msg);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card style={{ width: 420, borderRadius: 12 }}>
        <Title level={3} style={{ textAlign: 'center' }}>SDS - Smart Driving School</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Password is required' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>Log In</Button>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <a href="/forgot-password">Forgot password?</a>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
