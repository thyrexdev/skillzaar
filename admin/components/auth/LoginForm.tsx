'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Alert, Form } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [form] = Form.useForm();

  const onSubmit = async (values: LoginFormData) => {
    try {
      clearError();
      await login(values.email, values.password);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card 
        className="w-full max-w-md shadow-lg"
        title={
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              Frevix Admin
            </div>
            <div className="text-gray-500">
              Sign in to your admin account
            </div>
          </div>
        }
      >
        {error && (
          <Alert
            message="Login Failed"
            description={error}
            type="error"
            showIcon
            className="mb-4"
            closable
            onClose={clearError}
          />
        )}

        <Form
          form={form}
          onFinish={onSubmit}
          layout="vertical"
          size="large"
          className="space-y-4"
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[{ required: true, message: 'Please enter your email' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={isLoading}
              icon={<LoginOutlined />}
              className="w-full"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Form.Item>

          <div className="text-center text-sm text-gray-500">
            <p>Admin access only</p>
            <p className="mt-2">
              Need help? Contact your system administrator
            </p>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginForm;
