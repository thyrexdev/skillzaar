import { useTheme } from '@/components/providers/ThemeProvider';
import { 
  getThemeColors, 
  getRoleColors, 
  getStatusColors, 
  brandColors,
  lightTheme,
  darkTheme 
} from '@/lib/colors';

/**
 * Custom hook to access theme-aware colors throughout the application
 */
export const useColors = () => {
  const { isDark } = useTheme();
  
  // Get the current theme colors
  const theme = getThemeColors(isDark);
  
  // Get role and status colors for current theme
  const roleColors = getRoleColors(isDark);
  const statusColors = getStatusColors(isDark);
  
  return {
    // Theme mode
    isDark,
    
    // Core brand colors (theme-independent)
    brand: brandColors,
    
    // Current theme colors
    theme,
    
    // Specific color categories
    roleColors,
    statusColors,
    
    // Direct access to light/dark themes
    lightTheme,
    darkTheme,
    
    // Convenience getters
    primary: theme.primary,
    secondary: theme.secondary,
    accent: theme.accent,
    success: theme.success,
    error: theme.error,
    warning: theme.warning,
    info: theme.info,
    neutral: theme.neutral,
    background: theme.background,
    text: theme.text,
    border: theme.border,
  };
};

/**
 * Hook for getting colors by semantic name
 */
export const useSemanticColors = () => {
  const { theme, roleColors, statusColors } = useColors();
  
  const getStatusColor = (status: keyof typeof statusColors) => {
    return statusColors[status] || theme.neutral[400];
  };
  
  const getRoleColor = (role: keyof typeof roleColors) => {
    return roleColors[role] || theme.neutral[400];
  };
  
  const getSemanticColor = (semantic: 'success' | 'error' | 'warning' | 'info') => {
    return theme[semantic].main;
  };
  
  return {
    getStatusColor,
    getRoleColor,
    getSemanticColor,
    theme,
  };
};

/**
 * Hook for gradient colors
 */
export const useGradients = () => {
  const { theme } = useColors();
  
  return {
    primary: theme.background.gradient.primary,
    secondary: theme.background.gradient.secondary,
    accent: theme.background.gradient.accent,
    
    // Custom gradients
    success: `linear-gradient(135deg, ${theme.success[400]} 0%, ${theme.success[600]} 100%)`,
    error: `linear-gradient(135deg, ${theme.error[400]} 0%, ${theme.error[600]} 100%)`,
    warning: `linear-gradient(135deg, ${theme.warning[400]} 0%, ${theme.warning[600]} 100%)`,
    info: `linear-gradient(135deg, ${theme.info[400]} 0%, ${theme.info[600]} 100%)`,
    
    // Neutral gradients
    subtle: `linear-gradient(135deg, ${theme.neutral[50]} 0%, ${theme.neutral[100]} 100%)`,
    card: `linear-gradient(135deg, ${theme.background.paper} 0%, ${theme.background.elevated} 100%)`,
  };
};

/**
 * Hook for theme-aware tag/badge colors with proper contrast
 */
export const useTagColors = () => {
  const { theme, isDark } = useColors();
  
  // Get appropriate tag colors with good contrast for both themes
  const getTagColor = (type: 'success' | 'error' | 'warning' | 'info' | 'primary' | 'secondary' | 'processing' | 'default') => {
    const colorMap = {
      success: {
        background: isDark ? theme.success[800] : theme.success[50],
        color: isDark ? theme.success[200] : theme.success[700],
        border: isDark ? theme.success[600] : theme.success[200]
      },
      error: {
        background: isDark ? theme.error[800] : theme.error[50],
        color: isDark ? theme.error[200] : theme.error[700],
        border: isDark ? theme.error[600] : theme.error[200]
      },
      warning: {
        background: isDark ? theme.warning[800] : theme.warning[50],
        color: isDark ? theme.warning[100] : theme.warning[700],
        border: isDark ? theme.warning[600] : theme.warning[200]
      },
      info: {
        background: isDark ? theme.info[800] : theme.info[50],
        color: isDark ? theme.info[200] : theme.info[700],
        border: isDark ? theme.info[600] : theme.info[200]
      },
      primary: {
        background: isDark ? theme.primary[800] : theme.primary[50],
        color: isDark ? theme.primary[200] : theme.primary[700],
        border: isDark ? theme.primary[600] : theme.primary[200]
      },
      secondary: {
        background: isDark ? theme.secondary[700] : theme.secondary[50],
        color: isDark ? theme.secondary[100] : theme.secondary[700],
        border: isDark ? theme.secondary[500] : theme.secondary[200]
      },
      processing: {
        background: isDark ? theme.primary[800] : theme.primary[50],
        color: isDark ? theme.primary[200] : theme.primary[700],
        border: isDark ? theme.primary[600] : theme.primary[200]
      },
      default: {
        background: isDark ? theme.neutral[700] : theme.neutral[50],
        color: isDark ? theme.neutral[200] : theme.neutral[600],
        border: isDark ? theme.neutral[500] : theme.neutral[200]
      }
    };
    
    return colorMap[type];
  };
  
  // Get semantic tag colors based on content
  const getSemanticTagColor = (semantic: string) => {
    const lowerSemantic = semantic.toLowerCase();
    
    if (['active', 'approved', 'completed', 'verified', 'success', 'healthy', 'online'].includes(lowerSemantic)) {
      return getTagColor('success');
    }
    if (['error', 'failed', 'rejected', 'banned', 'critical', 'offline', 'cancelled'].includes(lowerSemantic)) {
      return getTagColor('error');
    }
    if (['pending', 'warning', 'suspended', 'medium', 'review', 'draft'].includes(lowerSemantic)) {
      return getTagColor('warning');
    }
    if (['info', 'processing', 'high', 'low', 'message'].includes(lowerSemantic)) {
      return getTagColor('info');
    }
    if (['job', 'primary'].includes(lowerSemantic)) {
      return getTagColor('primary');
    }
    
    return getTagColor('default');
  };
  
  return {
    getTagColor,
    getSemanticTagColor,
    
    // Predefined colors for common use cases
    success: getTagColor('success'),
    error: getTagColor('error'),
    warning: getTagColor('warning'),
    info: getTagColor('info'),
    primary: getTagColor('primary'),
    secondary: getTagColor('secondary'),
    processing: getTagColor('processing'),
    default: getTagColor('default')
  };
};
