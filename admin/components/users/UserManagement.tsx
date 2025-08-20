'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Tag,
  Avatar,
  Dropdown,
  Modal,
  Form,
  DatePicker,
  Row,
  Col,
  Statistic,
  Spin,
  Alert,
  Space,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  MoreOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { getUsers, getUserStats, suspendUser, banUser, verifyUser } from '@/lib/api/admin-api';
import type { UserDetail, UserStats, UserManagementFilters } from '@/types/admin.types';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { confirm } = Modal;

const UserManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [filters, setFilters] = useState<UserManagementFilters>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'ban' | 'verify'>('suspend');
  const [actionForm] = Form.useForm();

  const fetchUsers = async (page = 1, limit = 20, currentFilters = filters) => {
    try {
      setLoading(true);
      const response = await getUsers(currentFilters, page, limit);
      setUsers(response.data);
      setPagination({
        current: page,
        pageSize: limit,
        total: response.pagination.total,
      });
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const stats = await getUserStats();
      setUserStats(stats);
    } catch (error: any) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, []);

  const handleSearch = (value: string) => {
    const newFilters = { ...filters, search: value };
    setFilters(newFilters);
    fetchUsers(1, pagination.pageSize, newFilters);
  };

  const handleFilterChange = (key: keyof UserManagementFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchUsers(1, pagination.pageSize, newFilters);
  };

  const handleUserAction = async (user: UserDetail, action: 'suspend' | 'ban' | 'verify') => {
    setSelectedUser(user);
    setActionType(action);
    setActionModalVisible(true);
  };

  const executeUserAction = async (values: any) => {
    if (!selectedUser) return;

    try {
      switch (actionType) {
        case 'suspend':
          await suspendUser(selectedUser.id, values.reason, values.duration);
          break;
        case 'ban':
          await banUser(selectedUser.id, values.reason);
          break;
        case 'verify':
          await verifyUser(selectedUser.id, values.reason);
          break;
      }
      
      setActionModalVisible(false);
      actionForm.resetFields();
      fetchUsers(pagination.current, pagination.pageSize);
      fetchUserStats();
    } catch (error: any) {
      console.error(`Failed to ${actionType} user:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'suspended': return 'orange';
      case 'banned': return 'red';
      default: return 'blue';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CLIENT': return 'blue';
      case 'FREELANCER': return 'green';
      case 'ADMIN': return 'red';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (record: UserDetail) => (
        <div className="flex items-center gap-3">
          <Avatar 
            src={record.profile?.avatar} 
            icon={<UserOutlined />}
            size="large"
          />
          <div>
            <div className="font-semibold">
              {record.firstName} {record.lastName}
              {record.isVerified && (
                <CheckCircleOutlined className="text-green-500 ml-2" />
              )}
            </div>
            <div className="text-gray-500 text-sm">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>{role}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Stats',
      key: 'stats',
      render: (record: UserDetail) => (
        <div className="text-sm">
          {record.statistics?.jobsPosted && (
            <div>Jobs Posted: {record.statistics.jobsPosted}</div>
          )}
          {record.statistics?.jobsCompleted && (
            <div>Completed: {record.statistics.jobsCompleted}</div>
          )}
          {record.statistics?.totalEarnings && (
            <div className="text-green-600">
              Earned: ${record.statistics.totalEarnings}
            </div>
          )}
          {record.statistics?.totalSpent && (
            <div className="text-blue-600">
              Spent: ${record.statistics.totalSpent}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      render: (date: string) => 
        date ? new Date(date).toLocaleDateString() : 'Never',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: UserDetail) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View Details',
              },
              {
                key: 'verify',
                icon: <CheckCircleOutlined />,
                label: 'Verify User',
                disabled: record.isVerified,
                onClick: () => handleUserAction(record, 'verify'),
              },
              {
                key: 'suspend',
                icon: <StopOutlined />,
                label: 'Suspend User',
                disabled: record.status === 'suspended' || record.status === 'banned',
                onClick: () => handleUserAction(record, 'suspend'),
              },
              {
                key: 'ban',
                icon: <DeleteOutlined />,
                label: 'Ban User',
                danger: true,
                disabled: record.status === 'banned',
                onClick: () => handleUserAction(record, 'ban'),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {userStats && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Users"
                value={userStats.totalUsers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active Users"
                value={userStats.activeUsers}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Verified Users"
                value={userStats.verifiedUsers}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="New This Month"
                value={userStats.newUsersThisMonth}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card title="User Management" className="mb-6">
        <div className="space-y-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Search
                placeholder="Search by name, email..."
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder="Role"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('role', value)}
              >
                <Option value="CLIENT">Client</Option>
                <Option value="FREELANCER">Freelancer</Option>
              </Select>
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder="Status"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('status', value)}
              >
                <Option value="active">Active</Option>
                <Option value="suspended">Suspended</Option>
                <Option value="banned">Banned</Option>
              </Select>
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder="Verification"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('isVerified', value)}
              >
                <Option value={true}>Verified</Option>
                <Option value={false}>Unverified</Option>
              </Select>
            </Col>
            <Col xs={24} md={4}>
              <RangePicker
                style={{ width: '100%' }}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    handleFilterChange('dateRange', {
                      start: dates[0].toDate(),
                      end: dates[1].toDate(),
                    });
                  } else {
                    handleFilterChange('dateRange', undefined);
                  }
                }}
              />
            </Col>
          </Row>
        </div>

        {/* Users Table */}
        <Table
          dataSource={users}
          columns={columns}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (page, pageSize) => fetchUsers(page, pageSize),
          }}
          rowKey="id"
          className="mt-4"
        />
      </Card>

      {/* Action Modal */}
      <Modal
        title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} User`}
        open={actionModalVisible}
        onCancel={() => setActionModalVisible(false)}
        footer={null}
      >
        <Form
          form={actionForm}
          onFinish={executeUserAction}
          layout="vertical"
        >
          <Form.Item
            name="reason"
            label="Reason"
            rules={[
              { required: true, message: 'Please provide a reason' },
              { min: 10, message: 'Reason must be at least 10 characters' },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter reason for this action..."
            />
          </Form.Item>
          
          {actionType === 'suspend' && (
            <Form.Item
              name="duration"
              label="Duration (days)"
              help="Leave empty for permanent suspension"
            >
              <Input
                type="number"
                min={1}
                placeholder="Enter duration in days"
              />
            </Form.Item>
          )}

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setActionModalVisible(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                danger={actionType === 'ban'}
                htmlType="submit"
              >
                {actionType.charAt(0).toUpperCase() + actionType.slice(1)} User
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
