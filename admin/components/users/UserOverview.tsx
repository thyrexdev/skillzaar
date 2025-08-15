'use client';

import React, { useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Avatar, Button, Space, Divider } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  UserAddOutlined, 
  UserDeleteOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAdminStore } from '@/stores/adminStore';

const UserOverview: React.FC = () => {
  const { userStats, userActivity, fetchUserStats, fetchUserActivity, loading } = useAdminStore();

  useEffect(() => {
    fetchUserStats();
    fetchUserActivity();
  }, [fetchUserStats, fetchUserActivity]);

  const recentUsersColumns = [
    {
      title: 'User',
      key: 'user',
      render: (record: any) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-gray-500 text-sm">{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'FREELANCER' ? 'blue' : role === 'CLIENT' ? 'green' : 'purple'}>
          {role}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          ACTIVE: 'green',
          SUSPENDED: 'orange',
          BANNED: 'red',
          PENDING: 'blue'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      },
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Button size="small" type="link">View</Button>
          <Button size="small" type="link">Edit</Button>
        </Space>
      ),
    },
  ];

  const activityColumns = [
    {
      title: 'Activity',
      dataIndex: 'action',
      key: 'action',
      render: (action: string, record: any) => (
        <Space>
          <Avatar size="small" src={record.user?.avatar} icon={<UserOutlined />} />
          <span>{record.user?.name} {action}</span>
        </Space>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={userStats?.totalUsers || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={userStats?.activeUsers || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="New This Month"
              value={userStats?.newUsersThisMonth || 0}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Verification"
              value={userStats?.pendingVerification || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* User Distribution & Growth */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="User Distribution" extra={<Button type="link">View All</Button>}>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Freelancers</span>
                  <span>{userStats?.freelancers || 0}</span>
                </div>
                <Progress 
                  percent={((userStats?.freelancers || 0) / (userStats?.totalUsers || 1)) * 100} 
                  strokeColor="#1890ff" 
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Clients</span>
                  <span>{userStats?.clients || 0}</span>
                </div>
                <Progress 
                  percent={((userStats?.clients || 0) / (userStats?.totalUsers || 1)) * 100} 
                  strokeColor="#52c41a" 
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Verified Users</span>
                  <span>{userStats?.verifiedUsers || 0}</span>
                </div>
                <Progress 
                  percent={((userStats?.verifiedUsers || 0) / (userStats?.totalUsers || 1)) * 100} 
                  strokeColor="#722ed1" 
                />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="User Status Overview">
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Active"
                    value={userStats?.activeUsers || 0}
                    valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Suspended"
                    value={userStats?.suspendedUsers || 0}
                    valueStyle={{ color: '#fa8c16', fontSize: '18px' }}
                  />
                </Card>
              </Col>
              <Col span={12} className="mt-4">
                <Card size="small">
                  <Statistic
                    title="Banned"
                    value={userStats?.bannedUsers || 0}
                    valueStyle={{ color: '#ff4d4f', fontSize: '18px' }}
                  />
                </Card>
              </Col>
              <Col span={12} className="mt-4">
                <Card size="small">
                  <Statistic
                    title="Pending"
                    value={userStats?.pendingUsers || 0}
                    valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity & Top Performers */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card 
            title="Recent User Activity" 
            extra={<Button type="link">View All Activity</Button>}
          >
            <Table
              columns={activityColumns}
              dataSource={userActivity?.slice(0, 5) || []}
              pagination={false}
              size="small"
              loading={loading}
              rowKey={(record) => record.id || record.timestamp || Math.random().toString()}
            />
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card title="Quick Actions">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" icon={<UserAddOutlined />} block>
                Add New User
              </Button>
              <Button icon={<ExclamationCircleOutlined />} block>
                View Pending Verifications
              </Button>
              <Button icon={<TrophyOutlined />} block>
                Top Performers Report
              </Button>
              <Divider />
              <div className="text-gray-500 text-sm">
                <div>Last updated: {new Date().toLocaleTimeString()}</div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserOverview;
