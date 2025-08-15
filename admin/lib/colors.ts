// Enhanced Frevix Platform Color System
// Comprehensive light/dark theme support with your brand colors

// Core brand colors
export const brandColors = {
  deepPurple: '#4B3BAA',
  mediumPurple: '#6858D5', 
  lightPurple: '#A89EF2',
  orange: '#FFB266',
} as const;

// Light theme configuration
export const lightTheme = {
  // Primary brand colors - Purple palette
  primary: {
    50: '#F8F6FF',
    100: '#F0ECFF',
    200: '#E3DCFF',
    300: '#CFC3FF',
    400: '#B8A8FF',
    500: '#A89EF2', // Your Light Purple
    600: '#8B7AE8',
    700: '#6858D5', // Your Medium Purple
    800: '#4B3BAA', // Your Deep Purple
    900: '#3A2D85',
    950: '#2A1F60',
    main: '#4B3BAA',
  },
  
  // Secondary colors - Orange palette
  secondary: {
    50: '#FFF9F0',
    100: '#FFF2E0',
    200: '#FFE4C2',
    300: '#FFD199',
    400: '#FFBB70',
    500: '#FFB266', // Your Orange
    600: '#FF9A33',
    700: '#E8820A',
    800: '#C26B00',
    900: '#9A5500',
    950: '#663600',
    main: '#FFB266',
  },
  
  // Accent colors
  accent: {
    purple: '#8B5CF6',
    indigo: '#6366F1',
    blue: '#3B82F6',
    teal: '#14B8A6',
    emerald: '#10B981',
    lime: '#84CC16',
    amber: '#F59E0B',
    rose: '#F43F5E',
  },
  
  // Semantic colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    main: '#22C55E',
  },
  
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    main: '#EF4444',
  },
  
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    main: '#F59E0B',
  },
  
  info: {
    50: '#F8F6FF',
    100: '#F0ECFF',
    200: '#E3DCFF',
    300: '#CFC3FF',
    400: '#B8A8FF',
    500: '#A89EF2', // Your Light Purple
    600: '#8B7AE8',
    700: '#6858D5', // Your Medium Purple
    800: '#4B3BAA', // Your Deep Purple
    900: '#3A2D85',
    main: '#A89EF2', // Use light purple instead of blue
  },
  
  // Neutral colors for light theme
  neutral: {
    0: '#FFFFFF',
    50: '#FAFBFC',
    100: '#F5F6F8',
    150: '#EBEDF0',
    200: '#E1E4E8',
    250: '#D5D9DD',
    300: '#C5CAD1',
    350: '#B3BAC5',
    400: '#9DA4AE',
    450: '#8892A0',
    500: '#6E7B8A',
    550: '#5D6B7A',
    600: '#4D5B6B',
    650: '#3F4B59',
    700: '#343E4A',
    750: '#2A323C',
    800: '#21272F',
    850: '#181C23',
    900: '#0F1218',
    950: '#08090C',
    1000: '#000000',
  },
  
  // Background colors
  background: {
    default: '#FFFFFF',
    paper: '#FFFFFF',
    elevated: '#F5F6F8',
    overlay: '#FAFBFC',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    gradient: {
      primary: 'linear-gradient(135deg, #4B3BAA 0%, #6858D5 50%, #A89EF2 100%)',
      secondary: 'linear-gradient(135deg, #FFB266 0%, #FF9A33 100%)',
      accent: 'linear-gradient(135deg, #A89EF2 0%, #8B5CF6 100%)',
    },
  },
  
  // Text colors
  text: {
    primary: '#0F1218',
    secondary: '#4D5B6B',
    tertiary: '#8892A0',
    disabled: '#B3BAC5',
    inverse: '#FFFFFF',
    link: '#4B3BAA',
    linkHover: '#3A2D85',
  },
  
  // Border colors
  border: {
    default: '#E1E4E8',
    light: '#EBEDF0',
    medium: '#D5D9DD',
    strong: '#C5CAD1',
    focus: '#4B3BAA',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
  },
} as const;

// Dark theme configuration
export const darkTheme = {
  // Primary brand colors - Purple palette (adjusted for dark mode)
  primary: {
    50: '#2A1F60',
    100: '#3A2D85',
    200: '#4B3BAA', // Your Deep Purple
    300: '#5F4BC4',
    400: '#6858D5', // Your Medium Purple
    500: '#7B6BE0',
    600: '#8F7FE8',
    700: '#A89EF2', // Your Light Purple
    800: '#C3B8F7',
    900: '#E0D9FC',
    950: '#F8F6FF',
    main: '#A89EF2', // Lighter for dark mode
  },
  
  // Secondary colors - Orange palette (adjusted for dark mode)
  secondary: {
    50: '#663600',
    100: '#9A5500',
    200: '#C26B00',
    300: '#E8820A',
    400: '#FF9A33',
    500: '#FFB266', // Your Orange
    600: '#FFC485',
    700: '#FFD199',
    800: '#FFE4C2',
    900: '#FFF2E0',
    950: '#FFF9F0',
    main: '#FFB266',
  },
  
  // Accent colors (brightened for dark mode)
  accent: {
    purple: '#A78BFA',
    indigo: '#818CF8',
    blue: '#60A5FA',
    teal: '#2DD4BF',
    emerald: '#34D399',
    lime: '#A3E635',
    amber: '#FBBF24',
    rose: '#FB7185',
  },
  
  // Semantic colors (adjusted for dark mode)
  success: {
    50: '#14532D',
    100: '#166534',
    200: '#15803D',
    300: '#16A34A',
    400: '#22C55E',
    500: '#4ADE80',
    600: '#86EFAC',
    700: '#BBF7D0',
    800: '#DCFCE7',
    900: '#F0FDF4',
    main: '#4ADE80',
  },
  
  error: {
    50: '#7F1D1D',
    100: '#991B1B',
    200: '#B91C1C',
    300: '#DC2626',
    400: '#EF4444',
    500: '#F87171',
    600: '#FCA5A5',
    700: '#FECACA',
    800: '#FEE2E2',
    900: '#FEF2F2',
    main: '#F87171',
  },
  
  warning: {
    50: '#78350F',
    100: '#92400E',
    200: '#B45309',
    300: '#D97706',
    400: '#F59E0B',
    500: '#FBBF24',
    600: '#FCD34D',
    700: '#FDE68A',
    800: '#FEF3C7',
    900: '#FFFBEB',
    main: '#FBBF24',
  },
  
  info: {
    50: '#2A1F60',
    100: '#3A2D85',
    200: '#4B3BAA', // Your Deep Purple
    300: '#5F4BC4',
    400: '#6858D5', // Your Medium Purple
    500: '#7B6BE0',
    600: '#8F7FE8',
    700: '#A89EF2', // Your Light Purple
    800: '#C3B8F7',
    900: '#E0D9FC',
    main: '#A89EF2', // Use light purple for dark mode info
  },
  
  // Neutral colors for dark theme
  neutral: {
    0: '#000000',
    50: '#08090C',
    100: '#0F1218',
    150: '#181C23',
    200: '#21272F',
    250: '#2A323C',
    300: '#343E4A',
    350: '#3F4B59',
    400: '#4D5B6B',
    450: '#5D6B7A',
    500: '#6E7B8A',
    550: '#8892A0',
    600: '#9DA4AE',
    650: '#B3BAC5',
    700: '#C5CAD1',
    750: '#D5D9DD',
    800: '#E1E4E8',
    850: '#EBEDF0',
    900: '#F5F6F8',
    950: '#FAFBFC',
    1000: '#FFFFFF',
  },
  
  // Background colors
  background: {
    default: '#212121', // Your specific gray background
    paper: '#2A2A2A',   // Slightly lighter for cards/papers
    elevated: '#333333', // Even lighter for elevated content
    overlay: '#1A1A1A',  // Slightly darker for overlays
    backdrop: 'rgba(0, 0, 0, 0.8)',
    gradient: {
      primary: 'linear-gradient(135deg, #A89EF2 0%, #6858D5 50%, #4B3BAA 100%)',
      secondary: 'linear-gradient(135deg, #FFB266 0%, #FF9A33 100%)',
      accent: 'linear-gradient(135deg, #A89EF2 0%, #A78BFA 100%)',
    },
  },
  
  // Text colors
  text: {
    primary: '#FAFBFC',
    secondary: '#C5CAD1',
    tertiary: '#8892A0',
    disabled: '#5D6B7A',
    inverse: '#0F1218',
    link: '#A89EF2',
    linkHover: '#C3B8F7',
  },
  
  // Border colors
  border: {
    default: '#343E4A',
    light: '#2A323C',
    medium: '#3F4B59',
    strong: '#4D5B6B',
    focus: '#A89EF2',
    error: '#F87171',
    success: '#4ADE80',
    warning: '#FBBF24',
  },
} as const;

// Role-specific colors
export const getRoleColors = (isDark: boolean) => ({
  ADMIN: isDark ? darkTheme.error.main : lightTheme.error.main,
  MODERATOR: isDark ? darkTheme.warning.main : lightTheme.warning.main,
  USER: isDark ? darkTheme.info.main : lightTheme.info.main,
});

// Status-specific colors
export const getStatusColors = (isDark: boolean) => ({
  ACTIVE: isDark ? darkTheme.success.main : lightTheme.success.main,
  SUSPENDED: isDark ? darkTheme.warning.main : lightTheme.warning.main,
  BANNED: isDark ? darkTheme.error.main : lightTheme.error.main,
});

// Get theme colors based on mode
export const getThemeColors = (isDark: boolean) => isDark ? darkTheme : lightTheme;

// Ant Design theme configuration factory
export const createAntdTheme = (isDark: boolean) => {
  const theme = getThemeColors(isDark);
  
  return {
    token: {
      // Primary colors
      colorPrimary: theme.primary.main,
      colorPrimaryBg: isDark ? theme.primary[100] : theme.primary[50],
      colorPrimaryBgHover: isDark ? theme.primary[200] : theme.primary[100],
      colorPrimaryBorder: isDark ? theme.primary[300] : theme.primary[200],
      colorPrimaryBorderHover: isDark ? theme.primary[400] : theme.primary[300],
      colorPrimaryHover: isDark ? theme.primary[600] : theme.primary[400],
      colorPrimaryActive: isDark ? theme.primary[500] : theme.primary[700],
      colorPrimaryTextHover: isDark ? theme.primary[600] : theme.primary[500],
      colorPrimaryText: isDark ? theme.primary[500] : theme.primary[600],
      colorPrimaryTextActive: isDark ? theme.primary[400] : theme.primary[700],
      
      // Success colors
      colorSuccess: theme.success.main,
      colorSuccessBg: isDark ? theme.success[100] : theme.success[50],
      colorSuccessBorder: isDark ? theme.success[300] : theme.success[200],
      
      // Warning colors
      colorWarning: theme.warning.main,
      colorWarningBg: isDark ? theme.warning[100] : theme.warning[50],
      colorWarningBorder: isDark ? theme.warning[300] : theme.warning[200],
      
      // Error colors
      colorError: theme.error.main,
      colorErrorBg: isDark ? theme.error[100] : theme.error[50],
      colorErrorBorder: isDark ? theme.error[300] : theme.error[200],
      
      // Info colors
      colorInfo: theme.info.main,
      colorInfoBg: isDark ? theme.info[100] : theme.info[50],
      colorInfoBorder: isDark ? theme.info[300] : theme.info[200],
      
      // Text colors
      colorText: theme.text.primary,
      colorTextSecondary: theme.text.secondary,
      colorTextTertiary: theme.text.tertiary,
      colorTextQuaternary: theme.text.disabled,
      
      // Background colors
      colorBgContainer: theme.background.paper,
      colorBgElevated: theme.background.elevated,
      colorBgLayout: theme.background.default,
      colorBgSpotlight: theme.background.overlay,
      colorBgMask: theme.background.backdrop,
      
      // Border colors
      colorBorder: theme.border.default,
      colorBorderSecondary: theme.border.light,
      
      // Component specific
      colorFillAlter: isDark ? theme.neutral[200] : theme.neutral[50],
      colorFillContent: isDark ? theme.neutral[250] : theme.neutral[100],
      colorFillContentHover: isDark ? theme.neutral[300] : theme.neutral[200],
      colorFillSecondary: isDark ? theme.neutral[200] : theme.neutral[100],
      colorFillTertiary: isDark ? theme.neutral[150] : theme.neutral[50],
      
      // Typography
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      fontSize: 14,
      fontSizeHeading1: 38,
      fontSizeHeading2: 30,
      fontSizeHeading3: 24,
      fontSizeHeading4: 20,
      fontSizeHeading5: 16,
      fontSizeLG: 16,
      fontSizeSM: 12,
      fontSizeXL: 20,
      
      // Layout
      borderRadius: 8,
      borderRadiusLG: 12,
      borderRadiusSM: 6,
      borderRadiusXS: 4,
      
      // Shadows (adjusted for dark mode)
      boxShadow: isDark 
        ? '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.2)'
        : '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
      boxShadowSecondary: isDark
        ? '0 6px 16px 0 rgba(0, 0, 0, 0.4), 0 3px 6px -4px rgba(0, 0, 0, 0.3), 0 9px 28px 8px rgba(0, 0, 0, 0.2)'
        : '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
      
      // Motion
      motionDurationFast: '0.1s',
      motionDurationMid: '0.2s',
      motionDurationSlow: '0.3s',
      motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      motionEaseInOutCirc: 'cubic-bezier(0.78, 0.14, 0.15, 0.86)',
      motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      motionEaseIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    },
    components: {
      Layout: {
        headerBg: theme.background.paper,
        bodyBg: theme.background.default,
        siderBg: theme.background.paper,
      },
      Menu: {
        itemBg: 'transparent',
        itemSelectedBg: isDark ? theme.primary[100] : theme.primary[50],
        itemHoverBg: isDark ? theme.neutral[200] : theme.neutral[100],
        itemSelectedColor: theme.primary.main,
        itemColor: theme.text.secondary,
      },
      Card: {
        headerBg: 'transparent',
        actionsBg: isDark ? theme.neutral[150] : theme.neutral[50],
      },
      Table: {
        headerBg: isDark ? theme.neutral[200] : theme.neutral[50],
        rowHoverBg: isDark ? theme.neutral[150] : theme.neutral[50],
      },
      Button: {
        primaryShadow: `0 2px 0 ${isDark ? 'rgba(168, 158, 242, 0.1)' : 'rgba(75, 59, 170, 0.1)'}`,
        dangerShadow: `0 2px 0 ${isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`,
      },
      Input: {
        hoverBorderColor: theme.primary[400],
        activeBorderColor: theme.primary.main,
      },
      Select: {
        optionSelectedBg: isDark ? theme.primary[100] : theme.primary[50],
      },
      Tabs: {
        itemSelectedColor: theme.primary.main,
        itemHoverColor: theme.primary[600],
        inkBarColor: theme.primary.main,
      },
    },
  };
};

// Legacy exports for backward compatibility
export const antdTheme = createAntdTheme(false);
export const colors = {
  primary: brandColors.deepPurple,
  secondary: brandColors.mediumPurple,
  light: brandColors.lightPurple,
  accent: brandColors.orange,
  // Map old structure to new
  ...lightTheme.neutral,
  success: lightTheme.success.main,
  warning: lightTheme.warning.main,
  error: lightTheme.error.main,
  info: lightTheme.info.main,
} as const;

// Legacy status colors
export const statusColors = {
  ACTIVE: lightTheme.success.main,
  SUSPENDED: lightTheme.warning.main,
  BANNED: lightTheme.error.main,
  CLIENT: lightTheme.success.main,
  FREELANCER: brandColors.mediumPurple,
  ADMIN: brandColors.deepPurple,
  USER: lightTheme.info.main,
  green: lightTheme.success.main,
  orange: lightTheme.warning.main,
  red: lightTheme.error.main,
  blue: lightTheme.info.main,
  purple: brandColors.deepPurple,
} as const;

export default colors;
