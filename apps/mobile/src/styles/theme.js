// Basic theme structure
export const theme = {
  colors: {
    primary: '#007AFF',       // Blue (iOS style)
    secondary: '#5856D6',     // Purple
    background: '#121212',   // Dark background
    surface: '#1c1c1e',     // Slightly lighter dark surface
    text: '#FFFFFF',          // White text
    textSecondary: '#8e8e93', // Grey text
    border: '#2c2c2e',       // Dark border
    error: '#FF3B30',         // Red (iOS style)
    success: '#34C759',       // Green (iOS style)
    warning: '#FF9500',       // Orange (iOS style)
    white: '#FFFFFF',
    black: '#000000',
    grey: '#8e8e93',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    h3: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    body1: {
      fontSize: 16,
    },
    body2: {
        fontSize: 14,
    },
    caption: {
        fontSize: 12,
        color: '#8e8e93',
    }
  },
  // Add other theme properties like fonts, border radius etc. as needed
}; 