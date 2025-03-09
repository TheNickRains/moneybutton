import { processQuery } from './langchainService';

// Simple in-memory storage for user data
// In a production app, this would be a database
const userMemory: Record<string, {
  buttonPresses: number;
  totalContributions: number;
  lastMessageType: string;
  colorScheme: string;
}> = {};

/**
 * Get user memory data or create if it doesn't exist
 */
export function getUserMemory(address: string) {
  if (!userMemory[address]) {
    userMemory[address] = {
      buttonPresses: 0,
      totalContributions: 0,
      lastMessageType: 'welcome',
      colorScheme: getRandomColorScheme()
    };
  }
  return userMemory[address];
}

/**
 * Generate an enhanced message for the user based on their history
 */
export async function generateEnhancedMessage(address: string, context: any) {
  try {
    const memory = getUserMemory(address);
    
    // Use langchainService to generate the message
    const message = await processQuery(
      `Generate a message for a user who has pressed the Money Button ${memory.buttonPresses} times and contributed ${memory.totalContributions} MNT.`,
      'emotional_trigger',
      {
        buttonPresses: memory.buttonPresses,
        totalContributions: memory.totalContributions,
        ...context
      }
    );
    
    return message || "Press the Money Button to win MNT tokens!";
  } catch (error) {
    console.error('Error generating enhanced message:', error);
    return "Press the Money Button to win MNT tokens!";
  }
}

/**
 * Record a button press for a user
 */
export function recordButtonPress(address: string, amount: number, messageType: string) {
  const memory = getUserMemory(address);
  memory.buttonPresses += 1;
  memory.totalContributions += amount;
  memory.lastMessageType = messageType;
  return memory;
}

/**
 * Get a color scheme based on emotional state
 */
export function getEmotionalColorScheme(address: string) {
  const memory = getUserMemory(address);
  return memory.colorScheme || getRandomColorScheme();
}

// Helper function to get a random color scheme
function getRandomColorScheme() {
  const schemes = [
    'bg-gradient-to-b from-blue-900 to-black text-white',
    'bg-gradient-to-b from-purple-900 to-black text-white',
    'bg-gradient-to-b from-indigo-900 to-black text-white',
    'bg-gradient-to-b from-green-900 to-black text-white',
    'bg-gradient-to-b from-red-900 to-black text-white'
  ];
  
  return schemes[Math.floor(Math.random() * schemes.length)];
} 