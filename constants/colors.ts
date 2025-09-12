const brandColors = {
  primary: '#2B7BC0', // Azul del logo Rubio García
  primaryDark: '#1E5A8F',
  primaryLight: '#4A9AE0',
  secondary: '#707070', // Gris del logo Rubio García
  accent: '#25D366',
  background: '#F0F7FF', // Fondo con tono azul claro
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#707070',
  border: '#D0E4F5', // Borde con tono azul claro
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  tooth: '#707070', // Color del diente en el logo
  highlight: '#3D9BE0', // Color de acento adicional
};

export default {
  light: {
    ...brandColors,
    tint: brandColors.primary,
    tabIconDefault: brandColors.secondary,
    tabIconSelected: brandColors.primary,
  },
};