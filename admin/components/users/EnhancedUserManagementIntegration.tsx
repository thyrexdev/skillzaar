'use client';

import React, { useState } from 'react';
import { Button, Space, message } from 'antd';
import { UserOutlined, SettingOutlined } from '@ant-design/icons';
import EnhancedUserManagement from './EnhancedUserManagement';
import EnhancedUserModal from './EnhancedUserModal';
import { useUserManagement, useDataExport, AdminClient } from '@/lib/admin-client';

interface EnhancedUserManagementIntegrationProps {
  className?: string;
}

const EnhancedUserManagementIntegration: React.FC<EnhancedUserManagementIntegrationProps> = ({
  className
}) => {
  const [enhancedModalVisible, setEnhancedModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'enhanced'>('table');

  // Use custom hooks for admin operations
  const {
    users,
    error,
    filters,
    fetchUsers,
    calculateGrowth
  } = useUserManagement();

  const { exportData, exporting } = useDataExport();
  const adminClient = AdminClient.getInstance();

  // Handle user selection for enhanced modal
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setEnhancedModalVisible(true);
  };

  // Handle enhanced user actions


  // Handle user profile update
  const handleUserUpdate = async () => {
    try {
      // The user was already updated in the modal, just refresh the list
      await fetchUsers();
      message.success('User list refreshed');
    } catch {
      message.error('Failed to refresh user list');
    }
  };

  // Handle bulk operations
  const handleBulkExport = async () => {
    try {
      const currentFilters = adminClient.buildUserFilters(
        filters.search,
        filters.role,
        filters.status,
        filters.dateRange ? [filters.dateRange.start, filters.dateRange.end] : undefined
      );
      
      await exportData('users', currentFilters, 'csv');
    } catch {
      message.error('Export failed');
    }
  };

  return (
    <div className={className}>
      {/* Header Controls */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Enhanced User Management</h2>
          {calculateGrowth && (
            <div className="text-sm text-gray-600">
              Growth Rate: {calculateGrowth.growthRate}% | 
              Verification Rate: {calculateGrowth.verificationRate}% | 
              Active Rate: {calculateGrowth.activeRate}%
            </div>
          )}
        </div>
        
        <Space>
          <Button
            type={viewMode === 'table' ? 'primary' : 'default'}
            icon={<UserOutlined />}
            onClick={() => setViewMode('table')}
          >
            Table View
          </Button>
          
          <Button
            type={viewMode === 'enhanced' ? 'primary' : 'default'}
            icon={<SettingOutlined />}
            onClick={() => setViewMode('enhanced')}
          >
            Enhanced View
          </Button>
          
          <Button
            onClick={handleBulkExport}
            loading={exporting}
          >
            Export Users
          </Button>
        </Space>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
          <Button size="small" onClick={() => fetchUsers()}>
            Retry
          </Button>
        </div>
      )}

      {/* Main Content */}
      {viewMode === 'table' ? (
        <EnhancedUserManagement />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users?.data.map(user => (
            <div 
              key={user.id} 
              className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleUserSelect(user.id)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div>
                  <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="flex space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded ${
                      user.role === 'FREELANCER' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced User Modal */}
      <EnhancedUserModal
        visible={enhancedModalVisible}
        onClose={() => {
          setEnhancedModalVisible(false);
          setSelectedUserId(null);
        }}
        userId={selectedUserId}
        onUserUpdated={handleUserUpdate}
      />
    </div>
  );
};

export default EnhancedUserManagementIntegration;
