'use client';

import React from 'react';
import { Badge } from 'antd';
import { useColors } from '@/hooks/useColors';

interface ThemeBadgeProps {
  children: React.ReactNode;
  count?: number | string;
  dot?: boolean;
  showZero?: boolean;
  overflowCount?: number;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  className?: string;
  style?: React.CSSProperties;
}

const ThemeBadge: React.FC<ThemeBadgeProps> = ({
  children,
  count,
  dot = false,
  showZero = false,
  overflowCount = 99,
  color = 'secondary',
  className = '',
  style = {}
}) => {
  const { primary, secondary, success, error, warning, info } = useColors();
  
  const colorMap = {
    primary: primary.main,
    secondary: secondary.main,
    success: success.main,
    error: error.main,
    warning: warning.main,
    info: info.main
  };
  
  const badgeStyle = {
    backgroundColor: colorMap[color],
    color: '#fff',
    border: 'none',
    boxShadow: `0 2px 8px ${colorMap[color]}25`,
    fontWeight: '600',
    ...style
  };
  
  return (
    <Badge
      count={count}
      dot={dot}
      showZero={showZero}
      overflowCount={overflowCount}
      className={`theme-badge ${className}`}
      style={{
        ...badgeStyle,
        '.ant-badge-count': badgeStyle
      }}
    >
      {children}
    </Badge>
  );
};

export default ThemeBadge;
