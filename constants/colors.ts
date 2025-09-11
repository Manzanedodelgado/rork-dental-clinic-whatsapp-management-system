const brandColors = {
  primary: '#2E5A87',
  primaryDark: '#1E3A5F',
  primaryLight: '#4A7BA7',
  secondary: '#6B6B6B',
  accent: '#25D366',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B6B6B',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  tooth: '#2E5A87',
};

export default {
  light: {
    ...brandColors,
    tint: brandColors.primary,
    tabIconDefault: brandColors.secondary,
    tabIconSelected: brandColors.primary,
  },
};