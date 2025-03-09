// Mantle Network and Wormhole inspired theme for the Money Button application
// Based on Mantle's design language and color palette with Wormhole cosmic influences

interface ColorScheme {
  background: string;
  backgroundDark: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  wormhole: string; // Wormhole specific color
  wormholeAccent: string; // Wormhole accent color
  cosmicGradient: string; // Cosmic gradient for backgrounds
}

// Combined Mantle and Wormhole color palette
export const mantleColorSchemes: Record<string, ColorScheme> = {
  mantleDark: {
    background: '#08091D', // Darker blue-black (Mantle)
    backgroundDark: '#040613', // Almost black background for cards
    primary: '#4E5AFF',    // Mantle blue (slightly brighter)
    secondary: '#2438E8',  // Darker blue for buttons/accents
    accent: '#7E89FF',     // Lighter accent blue
    text: '#FFFFFF',       // White text
    textMuted: '#8A8FB9',  // Muted text for less important info
    wormhole: '#7B4DFF',   // Wormhole purple
    wormholeAccent: '#A47BFF', // Lighter wormhole accent
    cosmicGradient: 'linear-gradient(135deg, #08091D 0%, #1A1245 50%, #08091D 100%)', // Space-like gradient
  },
  mantleLight: {
    background: '#F8F9FF', // Light background
    backgroundDark: '#EBEEF9', // Slightly darker background for cards
    primary: '#2439DB',    // Mantle primary blue
    secondary: '#3F51F7',  // Secondary blue
    accent: '#5966FF',     // Accent color
    text: '#1A1E36',       // Dark text
    textMuted: '#696D89',  // Muted text
    wormhole: '#6B3CEC',   // Wormhole purple (darker for light theme)
    wormholeAccent: '#9165FF', // Lighter wormhole accent
    cosmicGradient: 'linear-gradient(135deg, #F8F9FF 0%, #EAE5FF 50%, #F8F9FF 100%)', // Light space-like gradient
  },
  mantleNeon: {
    background: '#070A14', // Very dark background
    backgroundDark: '#030509', // Even darker background
    primary: '#4D5CFF',    // Bright neon blue
    secondary: '#3043FF',  // Secondary neon blue
    accent: '#20DDFF',     // Cyan accent
    text: '#FFFFFF',       // White text
    textMuted: '#A0A7DB',  // Muted bluish text
    wormhole: '#8B5FFF',   // Bright wormhole purple
    wormholeAccent: '#B68CFF', // Brighter wormhole accent
    cosmicGradient: 'linear-gradient(135deg, #070A14 0%, #1D1452 50%, #070A14 100%)', // Neon space-like gradient
  }
};

// Default theme based on Mantle's primary website theme (dark)
export const defaultMantleTheme = mantleColorSchemes.mantleDark;

// Tailwind CSS compatible color values for configuration
export const mantleTailwindColors = {
  mantleBackground: '#08091D',
  mantleBackgroundDark: '#040613',
  mantlePrimary: '#4E5AFF',
  mantleSecondary: '#2438E8',
  mantleAccent: '#7E89FF',
  mantleText: '#FFFFFF',
  mantleTextMuted: '#8A8FB9',
  mantleWormhole: '#7B4DFF',
  mantleWormholeAccent: '#A47BFF',
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

// Create cosmic background styles
export const createCosmicBackground = (intensity: number = 1) => {
  return {
    background: mantleColorSchemes.mantleDark.cosmicGradient,
    backgroundSize: '200% 200%',
    animation: `cosmicFlow ${8 / intensity}s ease infinite`,
  };
}; 