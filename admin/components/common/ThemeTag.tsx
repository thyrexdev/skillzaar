'use client';

import React from 'react';
import { Tag } from 'antd';
import { useTagColors } from '@/hooks/useColors';

interface ThemeTagProps {
  children: React.ReactNode;
  type?: 'success' | 'error' | 'warning' | 'info' | 'primary' | 'secondary' | 'processing' | 'default';
  semantic?: string; // For semantic tag coloring based on content
  className?: string;
  style?: React.CSSProperties;
}

const ThemeTag: React.FC<ThemeTagProps> = ({ 
  children, 
  type, 
  semantic, 
  className = '', 
  style = {} 
}) => {
  const { getTagColor, getSemanticTagColor } = useTagColors();
  
  // Get colors based on type or semantic content
  const colors = semantic 
    ? getSemanticTagColor(semantic) 
    : getTagColor(type || 'default');
  
  const tagStyle = {
    backgroundColor: colors.background,
    color: colors.color,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    ...style
  };
  
  return (
    <Tag 
      style={tagStyle}
      className={`theme-tag ${className}`}
    >
      {children}
    </Tag>
  );
};

export default ThemeTag;
