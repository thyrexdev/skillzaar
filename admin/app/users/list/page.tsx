'use client';

import React, { useState } from 'react';
import { Card, Button, Space, Tabs, Alert, Spin, Row, Col, Statistic } from 'antd';
import { 
  UserOutlined, 
  SettingOutlined, 
  ExportOutlined,
  ReloadOutlined,
  BarChartOutlined,
  TeamOutlined
} from '@ant-design/icons';
import AppLayout from '@/components/layout/AppLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import EnhancedUserManagement from '@/components/users/EnhancedUserManagement';
import EnhancedUserModal from '@/components/users/EnhancedUserModal';
import EnhancedUserManagementIntegration from '@/components/users/EnhancedUserManagementIntegration';
import { 
  useUserManagement, 
  useDataExport, 
  useSystemHealth,

} from '@/lib/admin-client';


export default function UsersListPage() {
  const [activeTab, setActiveTab] = useState('enhanced');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Use all our custom hooks
  const {
    userStats,
    loading: usersLoading,
    error: usersError,
    fetchUsers,
    calculateGrowth
  } = useUserManagement();
  
  const { exportData, exporting } = useDataExport();
  const { healthData, loading: healthLoading } = useSystemHealth();
  
  // Handle bulk export
  const handleExportUsers = async () => {
    await exportData('users', {}, 'csv');
  };

  // Render stats overview
  const renderStatsOverview = () => {
    if (!userStats) return null;
    
    return (
      <Card title="User Statistics Overview" className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Users"
              value={userStats.totalUsers}
              prefix={<TeamOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Active Users"
              value={userStats.activeUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Verified Users"
              value={userStats.verifiedUsers}
              suffix={`/ ${userStats.totalUsers}`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="New This Month"
              value={userStats.newUsersThisMonth}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
        </Row>
        
        {calculateGrowth && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <Row gutter={16}>
              <Col span={8}>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {calculateGrowth.growthRate}%
                  </div>
                  <div className="text-sm text-gray-600">Growth Rate</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {calculateGrowth.verificationRate}%
                  </div>
                  <div className="text-sm text-gray-600">Verification Rate</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">
                    {calculateGrowth.activeRate}%
                  </div>
                  <div className="text-sm text-gray-600">Active Rate</div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Card>
    );
  };

  // Render system health
  const renderSystemHealth = () => {
    if (!healthData || healthLoading) {
      return (
        <Card title="System Health" className="mb-6">
          <Spin spinning={healthLoading}>
            <div className="h-20" />
          </Spin>
        </Card>
      );
    }

    return (
      <Card title="System Health" className="mb-6">
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Uptime"
              value={healthData.uptime}
              suffix="%"
              precision={2}
              valueStyle={{ 
                color: healthData.uptime > 99 ? '#3f8600' : 
                       healthData.uptime > 95 ? '#fa8c16' : '#cf1322' 
              }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Response Time"
              value={healthData.responseTime}
              suffix="ms"
              valueStyle={{ 
                color: healthData.responseTime < 200 ? '#3f8600' : 
                       healthData.responseTime < 500 ? '#fa8c16' : '#cf1322' 
              }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Error Rate"
              value={healthData.errorRate}
              suffix="%"
              precision={2}
              valueStyle={{ 
                color: healthData.errorRate < 1 ? '#3f8600' : 
                       healthData.errorRate < 5 ? '#fa8c16' : '#cf1322' 
              }}
            />
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2">Enhanced User Management</h1>
              <p className="text-gray-600">
                Complete admin interface for managing users with advanced features and analytics
              </p>
            </div>
            
            <Space>
              <Button 
                icon={<ExportOutlined />} 
                onClick={handleExportUsers}
                loading={exporting}
              >
                Export All Users
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => fetchUsers()}
                loading={usersLoading}
              >
                Refresh
              </Button>
            </Space>
          </div>

          {/* Error Alert */}
          {usersError && (
            <Alert
              message="Error Loading Data"
              description={usersError}
              type="error"
              showIcon
              closable
              className="mb-6"
            />
          )}

          {/* Statistics Overview */}
          {renderStatsOverview()}
          
          {/* System Health */}
          {renderSystemHealth()}

          {/* Main Content Tabs */}
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
              {
                key: 'enhanced',
                label: (
                  <span>
                    <SettingOutlined />
                    Enhanced Management
                  </span>
                ),
                children: (
                  <EnhancedUserManagementIntegration className="mt-4" />
                ),
              },
              {
                key: 'classic',
                label: (
                  <span>
                    <UserOutlined />
                    Classic Table
                  </span>
                ),
                children: (
                  <div className="mt-4">
                    <EnhancedUserManagement />
                  </div>
                ),
              },
              {
                key: 'analytics',
                label: (
                  <span>
                    <BarChartOutlined />
                    Analytics
                  </span>
                ),
                children: (
                  <div className="mt-4">
                    <Card title="User Analytics Dashboard">
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Card size="small" title="Role Distribution">
                            {userStats && (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span>Clients:</span>
                                  <span className="font-semibold">{userStats.usersByRole.clients}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Freelancers:</span>
                                  <span className="font-semibold">{userStats.usersByRole.freelancers}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Admins:</span>
                                  <span className="font-semibold">{userStats.usersByRole.admins}</span>
                                </div>
                              </div>
                            )}
                          </Card>
                        </Col>
                        <Col xs={24} md={12}>
                          <Card size="small" title="User Status">
                            {userStats && (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span>Active:</span>
                                  <span className="font-semibold text-green-600">{userStats.activeUsers}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Suspended:</span>
                                  <span className="font-semibold text-orange-600">{userStats.suspendedUsers}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Banned:</span>
                                  <span className="font-semibold text-red-600">{userStats.bannedUsers}</span>
                                </div>
                              </div>
                            )}
                          </Card>
                        </Col>
                        <Col xs={24}>
                          <Card size="small" title="Recent Activity">
                            <p className="text-gray-500">Recent activity data will be displayed here...</p>
                          </Card>
                        </Col>
                      </Row>
                    </Card>
                  </div>
                ),
              },
            ]}
          />

          {/* Enhanced User Modal */}
          <EnhancedUserModal
            visible={modalVisible}
            onClose={() => {
              setModalVisible(false);
              setSelectedUserId(null);
            }}
            userId={selectedUserId}
            onUserUpdated={() => {
              fetchUsers(); // Refresh the list
            }}
          />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
