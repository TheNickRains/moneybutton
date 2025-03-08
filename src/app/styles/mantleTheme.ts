// Mantle Network inspired theme for the Money Button application
// Based on Mantle's design language and color palette

interface ColorScheme {
  background: string;
  backgroundDark: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
}

// Mantle color palette inspired by their website
export const mantleColorSchemes: Record<string, ColorScheme> = {
  mantleDark: {
    background: '#0E0F1B', // Dark blue-black
    backgroundDark: '#070812', // Darker background for cards
    primary: '#3F51F7',    // Mantle blue
    secondary: '#2439DB',  // Darker blue for buttons/accents
    accent: '#6C79FF',     // Lighter accent blue
    text: '#FFFFFF',       // White text
    textMuted: '#8A8FB9',  // Muted text for less important info
  },
  mantleLight: {
    background: '#FAFBFF', // Light background
    backgroundDark: '#F0F1F9', // Slightly darker background for cards
    primary: '#2439DB',    // Mantle primary blue
    secondary: '#3F51F7',  // Secondary blue
    accent: '#5966FF',     // Accent color
    text: '#1A1E36',       // Dark text
    textMuted: '#696D89',  // Muted text
  },
  mantleNeon: {
    background: '#0A0B14', // Very dark background
    backgroundDark: '#050609', // Even darker background
    primary: '#4D5CFF',    // Bright neon blue
    secondary: '#3043FF',  // Secondary neon blue
    accent: '#20DDFF',     // Cyan accent
    text: '#FFFFFF',       // White text
    textMuted: '#A0A7DB',  // Muted bluish text
  }
};

// Default theme based on Mantle's primary website theme (dark)
export const defaultMantleTheme = mantleColorSchemes.mantleDark;

// Tailwind CSS compatible color values for configuration
export const mantleTailwindColors = {
  mantleBackground: '#0E0F1B',
  mantleBackgroundDark: '#070812',
  mantlePrimary: '#3F51F7',
  mantleSecondary: '#2439DB',
  mantleAccent: '#6C79FF',
  mantleText: '#FFFFFF',
  mantleTextMuted: '#8A8FB9',
};

// Helper function to apply alpha/transparency to colors
export function withAlpha(color: string, alpha: number): string {
  // Convert a hex color to rgba with alpha
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
} 