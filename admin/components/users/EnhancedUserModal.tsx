/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Modal, Form, Input, Select, Button, Tabs, Card, 
  Table, Tag, Avatar, Space, Descriptions, Typography, Row, Col,
  Statistic, Progress, Timeline, Alert, Tooltip, Badge,
  Switch, Rate, Spin, message
} from 'antd';
import { 
  UserOutlined, EditOutlined, SaveOutlined, CloseOutlined,
  HistoryOutlined, DollarOutlined, StarOutlined, ProjectOutlined,
  MessageOutlined, SecurityScanOutlined,
 CreditCardOutlined, ShoppingOutlined,
  CheckCircleOutlined, StopOutlined, DeleteOutlined
} from '@ant-design/icons';
import type { UserDetail, Transaction, PaginatedResponse } from '@/types/admin.types';
import { 
  getExtendedUserDetails, 
  getUserTransactionHistory, 
  updateUserProfile,
  performUserAction,
  suspendUser,
  banUser,
  verifyUser,
  getUserActivity,
  getUserFinancialSummary
} from '@/lib/api/admin-api';

const { Option } = Select;
const { Title, Text } = Typography;

interface EnhancedUserModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string | null;
  onUserUpdated?: (user: UserDetail) => void;
}

interface ExtendedUserData {
  user: UserDetail;
  transactions: PaginatedResponse<Transaction>;
  activity: any[];
  financialSummary: {
    totalEarnings: number;
    totalSpent: number;
    pendingAmount: number;
  };
  verificationDocuments?: any[];
  jobHistory?: any[];
  proposalHistory?: any[];
}

const EnhancedUserModal: React.FC<EnhancedUserModalProps> = ({
  visible,
  onClose,
  userId,
  onUserUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<ExtendedUserData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && userId) {
      loadUserData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, userId]);

  const loadUserData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const [user, transactions, activity, financialSummary] = await Promise.all([
        getExtendedUserDetails(userId),
        getUserTransactionHistory(userId, 1, 10),
        getUserActivity(userId, 20),
        getUserFinancialSummary(userId)
      ]);

      setUserData({
        user,
        transactions,
        activity,
        financialSummary
      });

      // Populate form with user data
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
      message.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (values: any) => {
    if (!userId) return;

    setActionLoading(true);
    try {
      await updateUserProfile(userId, values);
      message.success('User profile updated successfully');
      setEditMode(false);
      loadUserData(); // Refresh data
      if (onUserUpdated && userData) {
        onUserUpdated({ ...userData.user, ...values });
      }
    } catch (error) {
      console.error('Failed to update user profile:', error);
      message.error('Failed to update user profile');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserAction = async (action: string, reason?: string, duration?: number) => {
    if (!userId || !userData) return;

    setActionLoading(true);
    try {
      let result;
      switch (action) {
        case 'suspend':
          result = await suspendUser(userId, reason || 'Admin action', duration);
          break;
        case 'ban':
          result = await banUser(userId, reason || 'Admin action');
          break;
        case 'verify':
          result = await verifyUser(userId, reason);
          break;
        default:
          result = await performUserAction({
            userId,
            action: action as any,
            reason: reason || 'Admin action',
            duration
          });
      }

      message.success(result.message);
      loadUserData(); // Refresh data
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      message.error(`Failed to ${action} user`);
    } finally {
      setActionLoading(false);
    }
  };

  const renderOverviewTab = () => {
    if (!userData) return null;

    const { user, financialSummary } = userData;

    return (
      <div>
        {/* User Profile Card */}
        <Card className="mb-4">
          <Row gutter={24}>
            <Col span={6}>
              <div className="text-center">
                <Avatar 
                  size={120} 
                  src={user.profile?.avatar} 
                  icon={<UserOutlined />} 
                />
                <div className="mt-2">
                  <Title level={4} className="mb-0">
                    {`${user.name}`}
                  </Title>
                  <Text type="secondary">{user.email}</Text>
                  <div className="mt-2">
                    <Space>
                      <Tag color={user.role === 'FREELANCER' ? 'blue' : 'green'}>
                        {user.role}
                      </Tag>
                      <Tag color={user.status === 'ACTIVE' ? 'green' : 'red'}>
                        {user.status}
                      </Tag>
                      {user.isVerified && (
                        <Tag color="green" icon={<CheckCircleOutlined />}>
                          Verified
                        </Tag>
                      )}
                    </Space>
                  </div>
                </div>
              </div>
            </Col>
            <Col span={18}>
              {editMode ? (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSaveProfile}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="First Name"
                        name="firstName"
                        rules={[{ required: true }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Last Name"
                        name="lastName"
                        rules={[{ required: true }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[{ required: true, type: 'email' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="Role" name="role">
                        <Select>
                          <Option value="CLIENT">Client</Option>
                          <Option value="FREELANCER">Freelancer</Option>
                          <Option value="ADMIN">Admin</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="Status" name="status">
                        <Select>
                          <Option value="ACTIVE">Active</Option>
                          <Option value="SUSPENDED">Suspended</Option>
                          <Option value="BANNED">Banned</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="Verified" name="isVerified" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item>
                    <Space>
                      <Button 
                        type="primary" 
                        htmlType="submit"
                        loading={actionLoading}
                        icon={<SaveOutlined />}
                      >
                        Save Changes
                      </Button>
                      <Button 
                        onClick={() => setEditMode(false)}
                        icon={<CloseOutlined />}
                      >
                        Cancel
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              ) : (
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="Full Name">
                    {`${user.name}`.trim()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                  <Descriptions.Item label="Role">
                    <Tag color={user.role === 'FREELANCER' ? 'blue' : 'green'}>
                      {user.role}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={user.status === 'ACTIVE' ? 'green' : 'red'}>
                      {user.status}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Verified">
                    {user.isVerified ? (
                      <Tag color="green" icon={<CheckCircleOutlined />}>Verified</Tag>
                    ) : (
                      <Tag color="orange">Unverified</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Member Since">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Last Activity">
                    {user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : 'Never'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Bio">
                    {user.profile?.bio || 'No bio available'}
                  </Descriptions.Item>
                </Descriptions>
              )}
            </Col>
          </Row>
        </Card>

        {/* Financial Summary */}
        <Card title="Financial Summary" className="mb-4">
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Total Earnings"
                value={financialSummary.totalEarnings}
                prefix={<DollarOutlined />}
                precision={2}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Total Spent"
                value={financialSummary.totalSpent}
                prefix={<ShoppingOutlined />}
                precision={2}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Pending Amount"
                value={financialSummary.pendingAmount}
                prefix={<CreditCardOutlined />}
                precision={2}
              />
            </Col>
          </Row>
        </Card>

        {/* Performance Metrics */}
        {user.statistics && (
          <Card title="Performance Metrics">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Jobs Completed"
                  value={user.statistics.jobsCompleted || 0}
                  prefix={<ProjectOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Rating"
                  value={user.statistics.rating || 0}
                  suffix="/ 5.0"
                  prefix={<StarOutlined />}
                />
                <div className="mt-2">
                  <Rate disabled value={user.statistics.rating || 0} />
                </div>
              </Col>
              <Col span={6}>
                <Statistic
                  title="Review Count"
                  value={user.statistics.reviewCount || 0}
                  prefix={<MessageOutlined />}
                />
              </Col>
              <Col span={6}>
                <div>
                  <Text strong>Success Rate</Text>
                  <Progress 
                    percent={85} 
                    size="small" 
                    status="active" 
                    className="mt-1"
                  />
                </div>
              </Col>
            </Row>
          </Card>
        )}
      </div>
    );
  };

  const renderTransactionsTab = () => {
    if (!userData?.transactions) return null;

    const columns = [
      {
        title: 'Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date: string) => new Date(date).toLocaleDateString(),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        render: (type: string) => (
          <Tag color={type === 'DEPOSIT' ? 'green' : 'red'}>{type}</Tag>
        ),
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount: number) => `$${amount.toFixed(2)}`,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => (
          <Tag color={status === 'COMPLETED' ? 'green' : 'orange'}>{status}</Tag>
        ),
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={userData.transactions.data}
        rowKey="id"
        pagination={{
          total: userData.transactions.pagination.total,
          pageSize: userData.transactions.pagination.limit,
          current: userData.transactions.pagination.page,
        }}
      />
    );
  };

  const renderActivityTab = () => {
    if (!userData?.activity) return null;

    return (
      <Timeline>
        {userData.activity.map((activity, index) => (
          <Timeline.Item key={index}>
            <Text strong>{activity.userName}</Text>
            <div>{activity.action || 'Activity recorded'}</div>
            <Text type="secondary">
              {new Date(activity.lastActivity).toLocaleString()}
            </Text>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  const renderActionsTab = () => {
    if (!userData) return null;

    const { user } = userData;

    return (
      <div>
        <Alert
          message="Admin Actions"
          description="Use these actions carefully. All actions are logged and audited."
          type="warning"
          showIcon
          className="mb-4"
        />

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Profile Management */}
          <Card title="Profile Management" size="small">
            <Space wrap>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setEditMode(!editMode)}
                loading={actionLoading}
              >
                {editMode ? 'Cancel Edit' : 'Edit Profile'}
              </Button>
              
              {!user.isVerified && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleUserAction('verify', 'Manual verification by admin')}
                  loading={actionLoading}
                >
                  Verify User
                </Button>
              )}
            </Space>
          </Card>

          {/* Account Actions */}
          {user.status === 'ACTIVE' && (
            <Card title="Account Actions" size="small">
              <Space wrap>
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() => {
                    Modal.confirm({
                      title: 'Suspend User',
                      content: 'Are you sure you want to suspend this user?',
                      onOk: () => handleUserAction('suspend', 'Suspended by admin', 30)
                    });
                  }}
                  loading={actionLoading}
                >
                  Suspend User
                </Button>
                
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    Modal.confirm({
                      title: 'Ban User',
                      content: 'Are you sure you want to ban this user? This action cannot be undone.',
                      onOk: () => handleUserAction('ban', 'Banned by admin')
                    });
                  }}
                  loading={actionLoading}
                >
                  Ban User
                </Button>
              </Space>
            </Card>
          )}

          {/* Reactivation */}
          {user.status !== 'ACTIVE' && (
            <Card title="Account Recovery" size="small">
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleUserAction('unsuspend', 'Reactivated by admin')}
                loading={actionLoading}
              >
                Reactivate User
              </Button>
            </Card>
          )}
        </Space>
      </div>
    );
  };

  if (!visible || !userId) {
    return null;
  }

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <Space>
            <UserOutlined />
            <span>Enhanced User Management</span>
            {userData && (
              <Badge 
                status={userData.user.status === 'ACTIVE' ? 'success' : 'error'} 
                text={userData.user.status}
              />
            )}
          </Space>
          <Space>
            <Tooltip title="Refresh Data">
              <Button 
                type="text" 
                icon={<HistoryOutlined />} 
                onClick={loadUserData}
                loading={loading}
              />
            </Tooltip>
          </Space>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      className="enhanced-user-modal"
    >
      <Spin spinning={loading}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: (
                <span>
                  <UserOutlined />
                  Overview
                </span>
              ),
              children: renderOverviewTab(),
            },
            {
              key: 'transactions',
              label: (
                <span>
                  <CreditCardOutlined />
                  Transactions
                </span>
              ),
              children: renderTransactionsTab(),
            },
            {
              key: 'activity',
              label: (
                <span>
                  <HistoryOutlined />
                  Activity Log
                </span>
              ),
              children: renderActivityTab(),
            },
            {
              key: 'actions',
              label: (
                <span>
                  <SecurityScanOutlined />
                  Admin Actions
                </span>
              ),
              children: renderActionsTab(),
            },
          ]}
        />
      </Spin>
    </Modal>
  );
};

export default EnhancedUserModal;
