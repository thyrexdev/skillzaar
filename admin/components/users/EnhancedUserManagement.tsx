'use client';

import React, { useEffect } from 'react';
import { 
  Table, Card, Space, Button, Input, Select, Tag, Avatar, Modal, Form, 
  message, Drawer, Descriptions, Tabs, Badge, DatePicker,
  Row, Col, Statistic, Typography, Tooltip, List
} from 'antd';
import { 
  UserOutlined, EditOutlined, EyeOutlined, 
  StopOutlined, CheckCircleOutlined, ExportOutlined, FilterOutlined,
  UserAddOutlined, CloseOutlined, ReloadOutlined,
  CrownOutlined, StarOutlined, DollarOutlined, ClockCircleOutlined,
   MessageOutlined, ProjectOutlined
} from '@ant-design/icons';
import { useAdminStore } from '@/stores/adminStore';
import { performUserAction, suspendUser, banUser, verifyUser, getUserDetails } from '@/lib/api/admin-api';
import type { UserDetail } from '@/types/admin.types';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Text, Title } = Typography;

// Extended UserDetail to match component expectations
interface ExtendedUserDetail extends UserDetail {
  name?: string; // Computed from firstName + lastName
  avatar?: string; // From profile.avatar
  lastLoginAt?: string;
  walletBalance?: number;
  profile?: {
    avatar?: string;
    bio?: string;
    location?: string;
    skills?: string[];
    completedJobs?: number;
    totalEarnings?: number;
    rating?: number;
  };
}

// Helper function to transform UserDetail to component format
const transformUserDetail = (user: UserDetail): ExtendedUserDetail => {
  return {
    ...user,
    name: `${user.firstName} ${user.lastName}`.trim(),
    avatar: user.profile?.avatar,
    lastLoginAt: user.lastActivity ? new Date(user.lastActivity).toISOString() : undefined,
    profile: {
      ...user.profile,
      completedJobs: user.statistics?.jobsCompleted,
      totalEarnings: user.statistics?.totalEarnings,
      rating: user.statistics?.rating,
    },
  };
};

const EnhancedUserManagement: React.FC = () => {
  const {
    // Data
    users,
    loading,
    // UI State
    searchTerm,
    selectedRole,
    selectedStatus,
    detailDrawerVisible,
    selectedUser,
    userDetails,
    actionModalVisible,
    currentAction,
    dateRange,
    advancedFilters,
    // Actions
    fetchUsers,
    setSearchTerm,
    setSelectedRole,
    setSelectedStatus,
    setDetailDrawerVisible,
    setSelectedUser,
    setUserDetails,
    setActionModalVisible,
    setCurrentAction,
    setDateRange,
    setAdvancedFilters,
  } = useAdminStore();
  
  const [form] = Form.useForm();

  useEffect(() => {
    const filters = {
      search: searchTerm,
      role: selectedRole as 'CLIENT' | 'FREELANCER' | undefined,
      status: selectedStatus as 'ACTIVE' | 'SUSPENDED' | 'BANNED' | undefined,
      dateRange: dateRange ? {
        start: dateRange[0]?.toDate(),
        end: dateRange[1]?.toDate()
      } : undefined
    };
    fetchUsers(filters);
  }, [fetchUsers, searchTerm, selectedRole, selectedStatus, dateRange]);

  const handleUserAction = async (userId: string, action: string, data?: Record<string, unknown>) => {
    try {
      switch (action) {
        case 'suspend':
          await suspendUser(userId, data?.reason as string, data?.duration as number);
          break;
        case 'ban':
          await banUser(userId, data?.reason as string);
          break;
        case 'verify':
          await verifyUser(userId, data?.reason as string);
          break;
        default:
          await performUserAction({
            action: action as 'suspend' | 'unsuspend' | 'ban' | 'unban' | 'verify' | 'unverify', userId, ...data,
            reason: ''
          });
      }
      
      message.success(`User ${action}ed successfully`);
      fetchUsers(); // Refresh the list
      setActionModalVisible(false);
      setCurrentAction(null);
      form.resetFields();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to ${action} user`;
      message.error(errorMessage);
    }
  };

  const showUserDetails = async (user: ExtendedUserDetail) => {
    // Convert ExtendedUserDetail back to UserDetail for store
    const userDetail: UserDetail = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isVerified: user.isVerified,
      status: user.status,
      createdAt: user.createdAt,
      lastActivity: user.lastActivity,
      profile: user.profile,
      statistics: user.statistics,
    };
    
    setSelectedUser(userDetail);
    setDetailDrawerVisible(true);
    
    try {
      const details = await getUserDetails(user.id);
      setUserDetails(details);
    } catch {
      message.error('Failed to load user details');
    }
  };

  const showActionModal = (actionType: string, user: ExtendedUserDetail) => {
    // Convert ExtendedUserDetail back to UserDetail for store
    const userDetail: UserDetail = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isVerified: user.isVerified,
      status: user.status,
      createdAt: user.createdAt,
      lastActivity: user.lastActivity,
      profile: user.profile,
      statistics: user.statistics,
    };
    
    setCurrentAction({ type: actionType, user: userDetail });
    setActionModalVisible(true);
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      fixed: 'left' as const,
      width: 250,
      render: (record: ExtendedUserDetail) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div className="font-medium flex items-center gap-2">
              {record.name}
              {record.isVerified && <CheckCircleOutlined className="text-green-500" />}
              {record.role === 'ADMIN' && <CrownOutlined className="text-yellow-500" />}
            </div>
            <div className="text-gray-500 text-sm">{record.email}</div>
            {record.profile?.rating && (
              <div className="flex items-center gap-1 text-xs text-yellow-600">
                <StarOutlined /> {record.profile.rating.toFixed(1)}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => {
        const colors = {
          FREELANCER: 'blue',
          CLIENT: 'green', 
          ADMIN: 'purple'
        };
        return <Tag color={colors[role as keyof typeof colors]}>{role}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string, record: ExtendedUserDetail) => {
        const colors = {
          ACTIVE: 'green',
          SUSPENDED: 'orange',
          BANNED: 'red'
        };
        return (
          <Tooltip title={`Last login: ${record.lastLoginAt ? new Date(record.lastLoginAt).toLocaleDateString() : 'Never'}`}>
            <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Performance',
      key: 'performance',
      width: 150,
      render: (record: ExtendedUserDetail) => (
        <Space direction="vertical" size="small">
          {record.profile?.completedJobs !== undefined && (
            <Text type="secondary" className="text-xs">
              <ProjectOutlined /> {record.profile.completedJobs} jobs
            </Text>
          )}
          {record.profile?.totalEarnings && (
            <Text type="secondary" className="text-xs">
              <DollarOutlined /> ${record.profile.totalEarnings.toLocaleString()}
            </Text>
          )}
          {record.walletBalance && (
            <Text type="secondary" className="text-xs">
              💰 ${record.walletBalance.toFixed(2)}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (
        <Tooltip title={new Date(date).toLocaleString()}>
          {new Date(date).toLocaleDateString()}
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 200,
      render: (record: ExtendedUserDetail) => (
        <Space wrap>
          <Tooltip title="View Details">
            <Button 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => showUserDetails(record)}
            />
          </Tooltip>
          
          {!record.isVerified && (
            <Tooltip title="Verify User">
              <Button 
                size="small" 
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => showActionModal('verify', record)}
              />
            </Tooltip>
          )}
          
          {record.status === 'ACTIVE' ? (
            <Space>
              <Tooltip title="Suspend User">
                <Button 
                  size="small" 
                  danger 
                  icon={<StopOutlined />}
                  onClick={() => showActionModal('suspend', record)}
                />
              </Tooltip>
              <Tooltip title="Ban User">
                <Button 
                  size="small" 
                  danger 
                  icon={<CloseOutlined />}
                  onClick={() => showActionModal('ban', record)}
                />
              </Tooltip>
            </Space>
          ) : (
            <Tooltip title="Reactivate User">
              <Button 
                size="small" 
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => showActionModal('unsuspend', record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const renderActionModal = () => {
    if (!currentAction) return null;

    const { type, user } = currentAction;
    const titles = {
      suspend: 'Suspend User',
      ban: 'Ban User',
      verify: 'Verify User',
      unsuspend: 'Reactivate User'
    };

    return (
      <Modal
        title={titles[type as keyof typeof titles]}
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false);
          setCurrentAction(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => handleUserAction(user.id, type, values)}
        >
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <Space>
              <Avatar src={user.profile?.avatar} icon={<UserOutlined />} />
              <div>
                <Text strong>{`${user.firstName} ${user.lastName}`.trim()}</Text>
                <br />
                <Text type="secondary">{user.email}</Text>
              </div>
            </Space>
          </div>

          {type === 'suspend' && (
            <>
              <Form.Item
                name="reason"
                label="Suspension Reason"
                rules={[{ required: true, message: 'Please provide a reason' }]}
              >
                <Input.TextArea rows={3} placeholder="Explain why this user is being suspended..." />
              </Form.Item>
              <Form.Item name="duration" label="Duration (days)" initialValue={7}>
                <Select>
                  <Option value={1}>1 Day</Option>
                  <Option value={3}>3 Days</Option>
                  <Option value={7}>1 Week</Option>
                  <Option value={30}>1 Month</Option>
                  <Option value={0}>Indefinite</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {type === 'ban' && (
            <Form.Item
              name="reason"
              label="Ban Reason"
              rules={[{ required: true, message: 'Please provide a reason' }]}
            >
              <Input.TextArea rows={3} placeholder="Explain why this user is being banned..." />
            </Form.Item>
          )}

          {type === 'verify' && (
            <Form.Item name="reason" label="Verification Notes">
              <Input.TextArea rows={2} placeholder="Optional notes about verification..." />
            </Form.Item>
          )}

          {type === 'unsuspend' && (
            <Form.Item name="reason" label="Reactivation Notes">
              <Input.TextArea rows={2} placeholder="Optional notes about reactivation..." />
            </Form.Item>
          )}

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => {
                setActionModalVisible(false);
                setCurrentAction(null);
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                danger={type === 'suspend' || type === 'ban'}
                htmlType="submit"
              >
                {type === 'suspend' ? 'Suspend User' :
                 type === 'ban' ? 'Ban User' :
                 type === 'verify' ? 'Verify User' : 'Reactivate User'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  return (
    <>
      <Card 
        title={(
          <div className="flex items-center justify-between">
            <Space>
              <Title level={4} className="mb-0">User Management</Title>
              <Badge count={users?.pagination.total || 0} showZero color="blue" />
            </Space>
            <Space>
              <Button icon={<ExportOutlined />}>Export</Button>
              <Button type="primary" icon={<UserAddOutlined />}>Add User</Button>
            </Space>
          </div>
        )}
      >
        {/* Advanced Filters */}
        <div className="mb-4">
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={12} md={8} lg={6}>
              <Search
                placeholder="Search users by name or email"
                allowClear
                onSearch={setSearchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col xs={12} sm={6} md={4} lg={3}>
              <Select
                placeholder="Role"
                style={{ width: '100%' }}
                allowClear
                onChange={setSelectedRole}
              >
                <Option value="CLIENT">Client</Option>
                <Option value="FREELANCER">Freelancer</Option>
                <Option value="ADMIN">Admin</Option>
              </Select>
            </Col>
            <Col xs={12} sm={6} md={4} lg={3}>
              <Select
                placeholder="Status"
                style={{ width: '100%' }}
                allowClear
                onChange={setSelectedStatus}
              >
                <Option value="ACTIVE">Active</Option>
                <Option value="SUSPENDED">Suspended</Option>
                <Option value="BANNED">Banned</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <RangePicker
                style={{ width: '100%' }}
                onChange={setDateRange}
                placeholder={['Join Date From', 'Join Date To']}
              />
            </Col>
            <Col xs={24} sm={12} md={4} lg={6} className="text-right">
              <Space>
                <Button 
                  icon={<FilterOutlined />} 
                  onClick={() => setAdvancedFilters(!advancedFilters)}
                >
                  Advanced
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => fetchUsers()}>
                  Refresh
                </Button>
              </Space>
            </Col>
          </Row>

          {/* Advanced Filters Panel */}
          {advancedFilters && (
            <Card size="small" className="bg-gray-50">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={6}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>Verification Status</Text>
                    <Select placeholder="Select" style={{ width: '100%' }} allowClear>
                      <Option value="verified">Verified Only</Option>
                      <Option value="unverified">Unverified Only</Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} md={6}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>Login Activity</Text>
                    <Select placeholder="Select" style={{ width: '100%' }} allowClear>
                      <Option value="recent">Active in 7 days</Option>
                      <Option value="inactive">Inactive {`>`} 30 days</Option>
                      <Option value="never">Never logged in</Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} md={6}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>Performance</Text>
                    <Select placeholder="Select" style={{ width: '100%' }} allowClear>
                      <Option value="top">Top Performers</Option>
                      <Option value="new">New Users</Option>
                      <Option value="problematic">Problematic Users</Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} md={6}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>Wallet Balance</Text>
                    <Input placeholder="Min amount" type="number" />
                  </Space>
                </Col>
              </Row>
            </Card>
          )}
        </div>

        {/* Users Table */}
        <Table
          columns={columns}
          dataSource={users?.data?.map(transformUserDetail) || []}
          rowKey="id"
          loading={loading}
          pagination={{
            current: users?.pagination.page || 1,
            pageSize: users?.pagination.limit || 20,
            total: users?.pagination.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} users`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 1400 }}
          rowSelection={{
            type: 'checkbox',
            onChange: (selectedRowKeys, selectedRows) => {
              console.log('Selected users:', selectedRows);
            },
          }}
        />
      </Card>

      {/* User Detail Drawer */}
      <Drawer
        title={
          selectedUser && (
            <Space>
              <Avatar src={selectedUser.profile?.avatar} icon={<UserOutlined />} />
              <div>
                <Text strong>{`${selectedUser.firstName} ${selectedUser.lastName}`.trim()}</Text>
                <br />
                <Text type="secondary" className="text-sm">{selectedUser.email}</Text>
              </div>
            </Space>
          )
        }
        width={600}
        open={detailDrawerVisible}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedUser(null);
          setUserDetails(null);
        }}
        extra={(
          <Space>
            <Button type="primary">Edit User</Button>
          </Space>
        )}
      >
        {selectedUser && (
          <Tabs defaultActiveKey="overview">
            <TabPane tab="Overview" key="overview">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="User ID">{selectedUser.id}</Descriptions.Item>
                <Descriptions.Item label="Name">{`${selectedUser.firstName} ${selectedUser.lastName}`.trim()}</Descriptions.Item>
                <Descriptions.Item label="Email">{selectedUser.email}</Descriptions.Item>
                <Descriptions.Item label="Role">
                  <Tag color={selectedUser.role === 'FREELANCER' ? 'blue' : 'green'}>
                    {selectedUser.role}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={selectedUser.status === 'ACTIVE' ? 'green' : 'orange'}>
                    {selectedUser.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Verified">
                  {selectedUser.isVerified ? (
                    <Tag color="green" icon={<CheckCircleOutlined />}>Verified</Tag>
                  ) : (
                    <Tag color="orange" icon={<ClockCircleOutlined />}>Pending</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Joined">
                  {new Date(selectedUser.createdAt).toLocaleDateString()}
                </Descriptions.Item>
                <Descriptions.Item label="Last Login">
                  {selectedUser.lastActivity ? new Date(selectedUser.lastActivity).toLocaleDateString() : 'Never'}
                </Descriptions.Item>
              </Descriptions>
              
              {selectedUser.statistics && (
                <>
                  <Title level={5} className="mt-4">Performance Metrics</Title>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic
                          title="Completed Jobs"
                          value={selectedUser.statistics.jobsCompleted || 0}
                          prefix={<ProjectOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic
                          title="Total Earnings"
                          value={selectedUser.statistics.totalEarnings || 0}
                          prefix={<DollarOutlined />}
                          precision={2}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic
                          title="Rating"
                          value={selectedUser.statistics.rating || 0}
                          prefix={<StarOutlined />}
                          precision={1}
                          suffix="/ 5.0"
                        />
                      </Card>
                    </Col>
                  </Row>
                </>
              )}
            </TabPane>
            
            <TabPane tab="Activity" key="activity">
              {userDetails?.activity ? (
                <List
                  dataSource={userDetails.activity}
                  renderItem={(item: { action: string; timestamp: string }) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<ClockCircleOutlined />} size="small" />}
                        title={item.action}
                        description={new Date(item.timestamp).toLocaleString()}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Text type="secondary">No activity data available</Text>
              )}
            </TabPane>
            
            <TabPane tab="Actions" key="actions">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" icon={<EditOutlined />} block>
                  Edit Profile
                </Button>
                <Button icon={<MessageOutlined />} block>
                  Send Message
                </Button>
                {!selectedUser.isVerified && (
                  <Button 
                    type="primary" 
                    icon={<CheckCircleOutlined />} 
                    onClick={() => showActionModal('verify', transformUserDetail(selectedUser))}
                    block
                  >
                    Verify User
                  </Button>
                )}
                {selectedUser.status === 'ACTIVE' && (
                  <>
                    <Button 
                      danger 
                      icon={<StopOutlined />}
                      onClick={() => showActionModal('suspend', transformUserDetail(selectedUser))}
                      block
                    >
                      Suspend User
                    </Button>
                    <Button 
                      danger 
                      icon={<CloseOutlined />}
                      onClick={() => showActionModal('ban', transformUserDetail(selectedUser))}
                      block
                    >
                      Ban User
                    </Button>
                  </>
                )}
                {selectedUser.status !== 'ACTIVE' && (
                  <Button 
                    type="primary" 
                    icon={<ReloadOutlined />}
                    onClick={() => showActionModal('unsuspend', transformUserDetail(selectedUser))}
                    block
                  >
                    Reactivate User
                  </Button>
                )}
              </Space>
            </TabPane>
          </Tabs>
        )}
      </Drawer>

      {/* Action Modal */}
      {renderActionModal()}
    </>
  );
};

export default EnhancedUserManagement;
