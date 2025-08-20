'use client';

import React, { useEffect, useState } from 'react';
import { 
  Card, Row, Col, Statistic, Table, Tag, Button, Space, Modal, Form, 
  Input, Select, DatePicker, Tabs, Typography, Progress, Alert, Badge,
  Tooltip, List, Avatar, Divider
} from 'antd';
import { 
  DollarOutlined, RiseOutlined, FallOutlined, 
  WalletOutlined, BankOutlined, SecurityScanOutlined, 
  ExclamationCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, FilterOutlined, DownloadOutlined, ReloadOutlined,
  CreditCardOutlined, SwapOutlined, LockOutlined, UnlockOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import { useAdminStore } from '@/stores/adminStore';
import { 
  getFinancialStats, getTransactions, getWithdrawals, 
  approveWithdrawal, rejectWithdrawal, getEscrowStats,
  updatePlatformFees
} from '@/lib/api/admin-api';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;
const { Text, Title } = Typography;

const FinancialOverview: React.FC = () => {
  const { loading } = useAdminStore();
  const [financialStats, setFinancialStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any>(null);
  const [escrowStats, setEscrowStats] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState<any>(null);
  const [form] = Form.useForm();

  // Filters
  const [transactionFilters, setTransactionFilters] = useState<any>({});
  const [withdrawalFilters, setWithdrawalFilters] = useState<any>({});

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      const [statsData, transData, withdrawData, escrowData] = await Promise.all([
        getFinancialStats(),
        getTransactions(),
        getWithdrawals(),
        getEscrowStats()
      ]);
      
      setFinancialStats(statsData);
      setTransactions(transData);
      setWithdrawals(withdrawData);
      setEscrowStats(escrowData);
    } catch (error) {
      console.error('Failed to load financial data:', error);
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, action: 'approve' | 'reject', data?: any) => {
    try {
      if (action === 'approve') {
        await approveWithdrawal(withdrawalId, data?.notes);
      } else {
        await rejectWithdrawal(withdrawalId, data?.reason);
      }
      
      // Reload data
      loadFinancialData();
      setActionModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      console.error('Failed to process withdrawal:', error);
    }
  };

  const showWithdrawalAction = (action: 'approve' | 'reject', withdrawal: any) => {
    setCurrentAction({ type: action, data: withdrawal });
    setActionModalVisible(true);
  };

  const transactionColumns = [
    {
      title: 'Transaction ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text code className="text-xs">{id.substring(0, 8)}...</Text>
      ),
    },
    {
      title: 'User',
      key: 'user',
      render: (record: any) => (
        <Space>
          <Avatar src={record.user?.avatar} icon={<DollarOutlined />} size="small" />
          <div>
            <div className="font-medium text-sm">{record.user?.name}</div>
            <Text type="secondary" className="text-xs">{record.user?.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors = {
          PAYMENT: 'green',
          WITHDRAWAL: 'orange',
          REFUND: 'blue',
          FEE: 'purple',
          ESCROW: 'cyan'
        };
        return <Tag color={colors[type as keyof typeof colors]}>{type}</Tag>;
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: any) => (
        <Text strong className={record.type === 'WITHDRAWAL' ? 'text-red-500' : 'text-green-500'}>
          {record.type === 'WITHDRAWAL' ? '-' : '+'}${amount.toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          COMPLETED: 'green',
          PENDING: 'orange',
          FAILED: 'red',
          CANCELLED: 'default'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Button size="small" icon={<EyeOutlined />} type="link">
          View
        </Button>
      ),
    },
  ];

  const withdrawalColumns = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text code className="text-xs">{id.substring(0, 8)}...</Text>
      ),
    },
    {
      title: 'User',
      key: 'user',
      render: (record: any) => (
        <Space>
          <Avatar src={record.user?.avatar} icon={<BankOutlined />} size="small" />
          <div>
            <div className="font-medium text-sm">{record.user?.name}</div>
            <Text type="secondary" className="text-xs">{record.user?.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong className="text-orange-500">${amount.toFixed(2)}</Text>
      ),
    },
    {
      title: 'Bank Details',
      key: 'bankDetails',
      render: (record: any) => (
        <div>
          <div className="text-sm">{record.bankName}</div>
          <Text type="secondary" className="text-xs">
            ****{record.accountNumber?.slice(-4)}
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          PENDING: 'orange',
          APPROVED: 'green',
          REJECTED: 'red',
          COMPLETED: 'blue'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      },
    },
    {
      title: 'Requested',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space>
          {record.status === 'PENDING' && (
            <>
              <Button 
                size="small" 
                type="primary" 
                icon={<CheckCircleOutlined />}
                onClick={() => showWithdrawalAction('approve', record)}
              >
                Approve
              </Button>
              <Button 
                size="small" 
                danger 
                icon={<CloseCircleOutlined />}
                onClick={() => showWithdrawalAction('reject', record)}
              >
                Reject
              </Button>
            </>
          )}
          <Button size="small" icon={<EyeOutlined />} type="link">
            View
          </Button>
        </Space>
      ),
    },
  ];

  const renderActionModal = () => {
    if (!currentAction) return null;

    const { type, data } = currentAction;
    const isApprove = type === 'approve';

    return (
      <Modal
        title={`${isApprove ? 'Approve' : 'Reject'} Withdrawal Request`}
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Amount: </Text>
              <Text className="text-lg">${data.amount.toFixed(2)}</Text>
            </Col>
            <Col span={12}>
              <Text strong>User: </Text>
              <Text>{data.user?.name}</Text>
            </Col>
          </Row>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => handleWithdrawalAction(data.id, type, values)}
        >
          <Form.Item
            name={isApprove ? 'notes' : 'reason'}
            label={isApprove ? 'Approval Notes (Optional)' : 'Rejection Reason'}
            rules={!isApprove ? [{ required: true, message: 'Please provide a reason' }] : []}
          >
            <Input.TextArea 
              rows={3} 
              placeholder={isApprove ? 'Optional notes...' : 'Explain why this withdrawal is being rejected...'}
            />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setActionModalVisible(false)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                danger={!isApprove}
                htmlType="submit"
              >
                {isApprove ? 'Approve Withdrawal' : 'Reject Withdrawal'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  return (
    <div className="space-y-6">
      {/* Financial Overview Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={financialStats?.totalRevenue || 0}
              prefix={<RiseOutlined />}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="text-xs text-gray-500 mt-2">
              +{financialStats?.revenueGrowth || 0}% vs last month
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Platform Fees Collected"
              value={financialStats?.platformFees || 0}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Withdrawals"
              value={withdrawals?.data?.filter((w: any) => w.status === 'PENDING').length || 0}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Escrow Balance"
              value={escrowStats?.totalBalance || 0}
              prefix={<SecurityScanOutlined />}
              precision={2}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Platform Health Indicators */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Financial Health Overview">
            <Row gutter={16}>
              <Col span={8}>
                <div className="text-center">
                  <Progress 
                    type="circle" 
                    percent={financialStats?.paymentSuccessRate || 0} 
                    strokeColor="#52c41a"
                    size={80}
                  />
                  <div className="mt-2 text-sm font-medium">Payment Success Rate</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="text-center">
                  <Progress 
                    type="circle" 
                    percent={financialStats?.withdrawalProcessingRate || 0} 
                    strokeColor="#1890ff"
                    size={80}
                  />
                  <div className="mt-2 text-sm font-medium">Withdrawal Processing</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="text-center">
                  <Progress 
                    type="circle" 
                    percent={financialStats?.escrowUtilization || 0} 
                    strokeColor="#722ed1"
                    size={80}
                  />
                  <div className="mt-2 text-sm font-medium">Escrow Utilization</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Quick Actions">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<BankOutlined />} 
                block
                badge={{ count: withdrawals?.data?.filter((w: any) => w.status === 'PENDING').length }}
              >
                Review Withdrawals
              </Button>
              <Button icon={<CreditCardOutlined />} block>
                Payment Gateway Settings
              </Button>
              <Button icon={<PercentageOutlined />} block>
                Update Platform Fees
              </Button>
              <Button icon={<DownloadOutlined />} block>
                Financial Report
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Detailed Financial Management */}
      <Card>
        <Tabs activeKey={selectedTab} onChange={setSelectedTab}>
          <TabPane tab={
            <span>
              <SwapOutlined />
              Transactions
            </span>
          } key="transactions">
            <div className="mb-4">
              <Space>
                <Select placeholder="Filter by type" style={{ width: 150 }} allowClear>
                  <Option value="PAYMENT">Payment</Option>
                  <Option value="WITHDRAWAL">Withdrawal</Option>
                  <Option value="REFUND">Refund</Option>
                  <Option value="FEE">Fee</Option>
                </Select>
                <Select placeholder="Status" style={{ width: 120 }} allowClear>
                  <Option value="COMPLETED">Completed</Option>
                  <Option value="PENDING">Pending</Option>
                  <Option value="FAILED">Failed</Option>
                </Select>
                <RangePicker placeholder={['Start Date', 'End Date']} />
                <Button icon={<FilterOutlined />}>Apply Filters</Button>
              </Space>
            </div>
            
            <Table
              columns={transactionColumns}
              dataSource={transactions?.data || []}
              rowKey="id"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} transactions`,
              }}
              scroll={{ x: 1000 }}
            />
          </TabPane>

          <TabPane tab={
            <span>
              <BankOutlined />
              Withdrawals
              {withdrawals?.data?.filter((w: any) => w.status === 'PENDING').length > 0 && (
                <Badge 
                  count={withdrawals.data.filter((w: any) => w.status === 'PENDING').length} 
                  size="small" 
                  offset={[10, 0]}
                />
              )}
            </span>
          } key="withdrawals">
            <div className="mb-4">
              <Space>
                <Select placeholder="Filter by status" style={{ width: 150 }} allowClear>
                  <Option value="PENDING">Pending</Option>
                  <Option value="APPROVED">Approved</Option>
                  <Option value="REJECTED">Rejected</Option>
                  <Option value="COMPLETED">Completed</Option>
                </Select>
                <RangePicker placeholder={['Start Date', 'End Date']} />
                <Button icon={<FilterOutlined />}>Apply Filters</Button>
                <Button icon={<ReloadOutlined />} onClick={loadFinancialData}>
                  Refresh
                </Button>
              </Space>
            </div>

            {withdrawals?.data?.filter((w: any) => w.status === 'PENDING').length > 0 && (
              <Alert
                message={`${withdrawals.data.filter((w: any) => w.status === 'PENDING').length} withdrawal requests pending review`}
                type="warning"
                showIcon
                className="mb-4"
                action={
                  <Button size="small" type="primary">
                    Review All
                  </Button>
                }
              />
            )}

            <Table
              columns={withdrawalColumns}
              dataSource={withdrawals?.data || []}
              rowKey="id"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} withdrawals`,
              }}
              scroll={{ x: 1000 }}
            />
          </TabPane>

          <TabPane tab={
            <span>
              <LockOutlined />
              Escrow Management
            </span>
          } key="escrow">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="Escrow Statistics" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div className="flex justify-between">
                      <Text>Total Funds in Escrow:</Text>
                      <Text strong>${escrowStats?.totalBalance?.toFixed(2) || '0.00'}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text>Active Escrows:</Text>
                      <Text strong>{escrowStats?.activeEscrows || 0}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text>Disputed Escrows:</Text>
                      <Text strong className="text-red-500">{escrowStats?.disputedEscrows || 0}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text>Average Hold Duration:</Text>
                      <Text strong>{escrowStats?.avgHoldDuration || 0} days</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Recent Escrow Activities" size="small">
                  <List
                    size="small"
                    dataSource={escrowStats?.recentActivities || []}
                    renderItem={(item: any) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<SecurityScanOutlined />} size="small" />}
                          title={item.action}
                          description={`${item.amount} - ${new Date(item.timestamp).toLocaleDateString()}`}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* Action Modal */}
      {renderActionModal()}
    </div>
  );
};

export default FinancialOverview;
