'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Badge, Dropdown, Space, Switch } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  TeamOutlined,
  BarChartOutlined,
  FileTextOutlined,
  WalletOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useColors, useGradients } from '@/hooks/useColors';
import ThemeBadge from '@/components/common/ThemeBadge';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, usePathname } from 'next/navigation';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { theme, brand, primary, secondary, neutral, background, text, border } = useColors();
  const gradients = useGradients();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleMenuClick = (e: any) => {
    const key = e.key;
    
    // Define route mappings
    const routeMap: { [key: string]: string } = {
      'dashboard': '/dashboard',
      'analytics': '/analytics',
      'users-overview': '/users/overview',
      'users-list': '/users/list',
      'users-verification': '/users/verification',
      'users-activity': '/users/activity',
      'jobs-overview': '/jobs/overview',
      'jobs-list': '/jobs/list',
      'jobs-proposals': '/jobs/proposals',
      'jobs-disputes': '/jobs/disputes',
      'financial-overview': '/financial/overview',
      'financial-transactions': '/financial/transactions',
      'financial-withdrawals': '/financial/withdrawals',
      'financial-escrow': '/financial/escrow',
      'financial-fees': '/financial/fees',
      'moderation-overview': '/moderation/overview',
      'moderation-reports': '/moderation/reports',
      'moderation-flagged': '/moderation/flagged',
      'moderation-queue': '/moderation/queue',
      'settings-general': '/settings/general',
      'settings-notifications': '/settings/notifications',
      'settings-security': '/settings/security',
      'settings-maintenance': '/settings/maintenance'
    };

    const route = routeMap[key];
    if (route) {
      router.push(route);
    }
  };

  // Get current selected keys based on pathname
  const getSelectedKeys = () => {
    if (pathname === '/dashboard') return ['dashboard'];
    if (pathname === '/analytics') return ['analytics'];
    if (pathname.startsWith('/users')) {
      if (pathname === '/users/overview') return ['users-overview'];
      if (pathname === '/users/list') return ['users-list'];
      if (pathname === '/users/verification') return ['users-verification'];
      if (pathname === '/users/activity') return ['users-activity'];
      return ['users-list']; // default for /users
    }
    if (pathname.startsWith('/jobs')) {
      if (pathname === '/jobs/overview') return ['jobs-overview'];
      if (pathname === '/jobs/list') return ['jobs-list'];
      if (pathname === '/jobs/proposals') return ['jobs-proposals'];
      if (pathname === '/jobs/disputes') return ['jobs-disputes'];
      return ['jobs-overview'];
    }
    if (pathname.startsWith('/financial')) {
      if (pathname === '/financial/overview') return ['financial-overview'];
      if (pathname === '/financial/transactions') return ['financial-transactions'];
      if (pathname === '/financial/withdrawals') return ['financial-withdrawals'];
      if (pathname === '/financial/escrow') return ['financial-escrow'];
      if (pathname === '/financial/fees') return ['financial-fees'];
      return ['financial-overview'];
    }
    if (pathname.startsWith('/moderation')) {
      if (pathname === '/moderation/overview') return ['moderation-overview'];
      if (pathname === '/moderation/reports') return ['moderation-reports'];
      if (pathname === '/moderation/flagged') return ['moderation-flagged'];
      if (pathname === '/moderation/queue') return ['moderation-queue'];
      return ['moderation-overview'];
    }
    if (pathname.startsWith('/settings')) {
      if (pathname === '/settings/general') return ['settings-general'];
      if (pathname === '/settings/notifications') return ['settings-notifications'];
      if (pathname === '/settings/security') return ['settings-security'];
      if (pathname === '/settings/maintenance') return ['settings-maintenance'];
      return ['settings-general'];
    }
    return ['dashboard'];
  };

  // Get open keys for submenus
  const getOpenKeys = () => {
    if (pathname.startsWith('/users')) return ['users'];
    if (pathname.startsWith('/jobs')) return ['jobs'];
    if (pathname.startsWith('/financial')) return ['financial'];
    if (pathname.startsWith('/moderation')) return ['moderation'];
    if (pathname.startsWith('/settings')) return ['settings'];
    return [];
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: 'User Management',
      children: [
        { key: 'users-overview', label: 'Users Overview' },
        { key: 'users-list', label: 'All Users' },
        { key: 'users-verification', label: 'Verification Queue' },
        { key: 'users-activity', label: 'User Activity' },
      ],
    },
    {
      key: 'jobs',
      icon: <ShoppingOutlined />,
      label: 'Job Management',
      children: [
        { key: 'jobs-overview', label: 'Jobs Overview' },
        { key: 'jobs-list', label: 'All Jobs' },
        { key: 'jobs-proposals', label: 'Proposals' },
        { key: 'jobs-disputes', label: 'Disputes' },
      ],
    },
    {
      key: 'financial',
      icon: <WalletOutlined />,
      label: 'Financial Oversight',
      children: [
        { key: 'financial-overview', label: 'Financial Overview' },
        { key: 'financial-transactions', label: 'Transactions' },
        { key: 'financial-withdrawals', label: 'Withdrawals' },
        { key: 'financial-escrow', label: 'Escrow Management' },
        { key: 'financial-fees', label: 'Platform Fees' },
      ],
    },
    {
      key: 'moderation',
      icon: <FileTextOutlined />,
      label: 'Content Moderation',
      children: [
        { key: 'moderation-overview', label: 'Moderation Overview' },
        { key: 'moderation-reports', label: 'Reported Content' },
        { key: 'moderation-flagged', label: 'Flagged Content' },
        { key: 'moderation-queue', label: 'Review Queue' },
      ],
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'System Settings',
      children: [
        { key: 'settings-general', label: 'General Settings' },
        { key: 'settings-notifications', label: 'Notifications' },
        { key: 'settings-security', label: 'Security' },
        { key: 'settings-maintenance', label: 'Maintenance' },
      ],
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => console.log('Profile clicked'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => console.log('Settings clicked'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: background.paper,
          borderRight: `1px solid ${border.default}`
        }}
        width={250}
      >
        <div 
          className="h-16 flex items-center justify-center transition-all duration-200" 
          style={{
            borderBottom: `1px solid ${border.default}`,
            background: gradients.primary
          }}
        >
          <div className="text-xl font-bold text-white">
            {collapsed ? 'F' : 'Frevix'}
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-none"
          style={{
            background: 'transparent',
            color: text.secondary
          }}
        />
      </Sider>
      
      <Layout>
        <Header 
          className="px-4 flex items-center justify-between transition-all duration-200" 
          style={{
            background: background.paper,
            borderBottom: `1px solid ${border.default}`
          }}
        >
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                color: text.secondary,
                borderRadius: '8px'
              }}
              className="hover:bg-opacity-10 transition-all duration-200"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = primary[50];
                e.currentTarget.style.color = primary.main;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = text.secondary;
              }}
            />
            <h1 
              className="text-lg font-semibold gradient-text" 
              style={{
                background: gradients.primary,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Frevix Admin Control Panel
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Space size="middle">
              <Switch
                checkedChildren="🌙"
                unCheckedChildren="☀️"
                checked={isDark}
                onChange={toggleTheme}
                style={{
                  backgroundColor: isDark ? primary[400] : neutral[300]
                }}
              />
              
              <ThemeBadge 
                count={5} 
                color="secondary"
              >
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  style={{
                    color: text.secondary,
                    borderRadius: '8px'
                  }}
                  className="hover:bg-opacity-10 transition-all duration-200"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = secondary[50];
                    e.currentTarget.style.color = secondary.main;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = text.secondary;
                  }}
                />
              </ThemeBadge>
              
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <div 
                  className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg transition-all duration-200" 
                  style={{
                    border: `1px solid ${border.light}`,
                    background: background.elevated
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = primary[50];
                    e.currentTarget.style.borderColor = primary[200];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = background.elevated;
                    e.currentTarget.style.borderColor = border.light;
                  }}
                >
                  <Avatar 
                    size="small" 
                    icon={<UserOutlined />} 
                    style={{
                      backgroundColor: primary.main,
                      color: '#fff'
                    }}
                  />
                  <span 
                    className="text-sm font-medium" 
                    style={{ color: text.primary }}
                  >
                    {user?.name || 'Admin User'}
                  </span>
                </div>
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content 
          className="p-6 transition-all duration-200" 
          style={{ background: background.default }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
