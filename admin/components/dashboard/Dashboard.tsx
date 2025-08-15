'use client';

import React, { useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, Table, Tag, Avatar, List, Spin, Alert } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  WalletOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getDashboardOverview, getUserActivity, getReportedContent } from '@/lib/api/admin-api';
import { useAdminStore } from '@/stores/adminStore';
import { useColors, useSemanticColors, useTagColors } from '@/hooks/useColors';
import ThemeTag from '@/components/common/ThemeTag';
import { toast } from 'sonner';

const Dashboard: React.FC = () => {
  const {
    dashboardData,
    dashboardLoading,
    dashboardError,
    reportedContent,
    moderationLoading,
    setDashboardData,
    setDashboardLoading,
    setDashboardError,
    setReportedContent,
    setModerationLoading,
  } = useAdminStore();
  
  const { primary, secondary, success, error, warning, info, theme } = useColors();
  const { getSemanticColor } = useSemanticColors();
  const { getSemanticTagColor, getTagColor } = useTagColors();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDashboardLoading(true);
        setModerationLoading(true);
        
        const [dashboard, reports] = await Promise.all([
          getDashboardOverview(),
          getReportedContent({ status: 'pending' }, 1, 5)
        ]);

        setDashboardData(dashboard);
        setReportedContent(reports.data);
        
        toast.success('Dashboard loaded successfully');
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to load dashboard data';
        setDashboardError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setDashboardLoading(false);
        setModerationLoading(false);
      }
    };

    fetchDashboardData();
  }, [setDashboardData, setDashboardLoading, setDashboardError, setReportedContent, setModerationLoading]);

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (dashboardError) {
    return (
      <Alert
        message="Error Loading Dashboard"
        description={dashboardError}
        type="error"
        showIcon
        className="mb-6"
      />
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { overview, userStats, jobStats, financialStats } = dashboardData;

  // Transform financial data for charts
  const revenueChartData = financialStats.revenueByMonth.map(item => ({
    month: item.month,
    revenue: item.revenue,
    transactions: item.transactions
  }));

  // Sample category data using brand colors
  const brandColors = [primary.main, secondary.main, success.main, warning.main, info.main];
  const categoryData = Object.entries(jobStats.jobsByCategory).map(([category, count], index) => ({
    name: category,
    value: count,
    color: brandColors[index % brandColors.length]
  }));

  const moderationColumns = [
    {
      title: 'Content Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <ThemeTag semantic={type}>
          {type.toUpperCase()}
        </ThemeTag>
      )
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <ThemeTag semantic={severity}>
          {severity.toUpperCase()}
        </ThemeTag>
      )
    },
    {
      title: 'Reported',
      dataIndex: 'reportedAt',
      key: 'reportedAt',
      render: (date: string) => (
        <span style={{ color: theme.text.secondary }}>
          {new Date(date).toLocaleDateString()}
        </span>
      )
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason: string) => (
        <span style={{ color: theme.text.primary }}>
          {reason}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={financialStats.totalRevenue}
              precision={2}
              valueStyle={{ color: success.main }}
              prefix={<DollarCircleOutlined />}
              suffix="USD"
            />
            <div className="mt-2 flex items-center text-sm">
              <ArrowUpOutlined style={{ color: success.main }} className="mr-1" />
              <span style={{ color: success.main }}>12.5%</span>
              <span style={{ color: theme.text.secondary }} className="ml-2">Since last month</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={userStats.totalUsers}
              valueStyle={{ color: primary.main }}
              prefix={<TeamOutlined />}
            />
            <div className="mt-2 flex items-center text-sm">
              <ArrowUpOutlined style={{ color: success.main }} className="mr-1" />
              <span style={{ color: success.main }}>
                +{userStats.newUsersThisMonth}
              </span>
              <span style={{ color: theme.text.secondary }} className="ml-2">New this month</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Jobs"
              value={jobStats.activeJobs}
              valueStyle={{ color: secondary.main }}
              prefix={<FileTextOutlined />}
            />
            <div className="mt-2 flex items-center text-sm">
              <span style={{ color: info.main }} className="mr-1">
                {((jobStats.activeJobs / jobStats.totalJobs) * 100).toFixed(1)}%
              </span>
              <span style={{ color: theme.text.secondary }}>Of total jobs</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="System Uptime"
              value={overview.systemUptime}
              precision={2}
              valueStyle={{ color: warning.main }}
              suffix="%"
              prefix="🟢"
            />
            <div className="mt-2 flex items-center text-sm">
              <span style={{ color: success.main }}>System Status: Healthy</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Revenue Trend" className="h-96">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `$${value}` : value,
                    name === 'revenue' ? 'Revenue' : 'Transactions'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={primary.main}
                  fill={primary.main}
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Jobs by Category" className="h-96">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Activity and Moderation Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card 
            title={
              <div className="flex items-center gap-2">
                <AlertOutlined style={{ color: warning.main }} />
                Pending Moderation
              </div>
            }
          >
            <Table
              dataSource={reportedContent}
              columns={moderationColumns}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>

      {/* User Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="User Statistics">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Verified Users</span>
                  <span>{((userStats.verifiedUsers / userStats.totalUsers) * 100).toFixed(1)}%</span>
                </div>
                <Progress 
                  percent={Math.round((userStats.verifiedUsers / userStats.totalUsers) * 100)} 
                  status="normal"
                  strokeColor={success.main}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>Active Users</span>
                  <span>{((userStats.activeUsers / userStats.totalUsers) * 100).toFixed(1)}%</span>
                </div>
                <Progress 
                  percent={Math.round((userStats.activeUsers / userStats.totalUsers) * 100)} 
                  status="normal"
                  strokeColor={primary.main}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>Suspended Users</span>
                  <span>{userStats.suspendedUsers}</span>
                </div>
                <Progress 
                  percent={Math.round((userStats.suspendedUsers / userStats.totalUsers) * 100)} 
                  status={userStats.suspendedUsers > userStats.totalUsers * 0.05 ? "exception" : "normal"}
                  strokeColor={userStats.suspendedUsers > userStats.totalUsers * 0.05 ? error.main : warning.main}
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Job Statistics">
            <div className="space-y-4">
              <Statistic
                title="Completion Rate"
                value={jobStats.completionRate}
                precision={1}
                suffix="%"
                valueStyle={{ color: success.main }}
              />
              <Statistic
                title="Average Budget"
                value={jobStats.averageBudget}
                precision={2}
                prefix="$"
                valueStyle={{ color: primary.main }}
              />
              <div className="flex justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: success.main }}>{jobStats.completedJobs}</div>
                  <div className="text-sm" style={{ color: theme.text.secondary }}>Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: error.main }}>{jobStats.canceledJobs}</div>
                  <div className="text-sm" style={{ color: theme.text.secondary }}>Canceled</div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Financial Overview">
            <div className="space-y-4">
              <Statistic
                title="Total Transactions"
                value={financialStats.totalTransactions}
                valueStyle={{ color: primary.main }}
              />
              <Statistic
                title="Platform Fees"
                value={financialStats.platformFees}
                precision={2}
                prefix="$"
                valueStyle={{ color: secondary.main }}
              />
              <div className="flex justify-between text-sm">
                <span style={{ color: theme.text.secondary }}>Pending: {financialStats.pendingTransactions}</span>
                <span style={{ color: theme.text.secondary }}>Failed: {financialStats.failedTransactions}</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
