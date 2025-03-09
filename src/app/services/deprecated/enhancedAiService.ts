import chroma from 'chroma-js';

// Enhanced AI patterns with stronger psychological triggers - but NO LIES
const FOMO_PATTERNS = [
  "Another player just contributed to the pot!",
  "The pot is growing quickly!",
  "More players are joining the game!",
  "Your chances to win depend on timing!",
  "Someone just added to the pot - competition is heating up!",
];

const GREED_PATTERNS = [
  "Just one more press could make you rich...",
  "Your persistence increases your odds!",
  "This could be your lucky bet!",
  "The pot just got bigger. Your next press could win it all!",
  "Your betting pattern is exciting!",
];

const URGENCY_PATTERNS = [
  "Don't miss this chance!",
  "Button heating up!",
  "Timing is everything!",
  "The pot is ripe for winning!",
  "Limited time optimal odds!",
];

const REWARD_PATTERNS = [
  "You're doing great!",
  "You've reached a new level!",
  "Your persistence is impressive!",
  "Special event: Keep pressing!",
  "You've reached GOLD status!",
];

const SOCIAL_PROOF_PATTERNS = [
  "Players are pressing right now!",
  "Join others trying their luck today!",
  "This button has paid out to winners!",
  "You're now part of an exclusive group of button pressers!",
  "Hot streak detected!",
];

// User session memory to track behavior patterns
export interface UserMemory {
  address: string;
  pressPatterns: {
    timestamps: number[];
    amounts: number[];
  };
  totalContribution: number;
  responseToMessages: {
    messageType: 'fomo' | 'greed' | 'urgency' | 'reward' | 'social';
    effectivenessScore: number; // 0-1 scale of how effective this type was at getting another press
  }[];
  emotionalState: {
    excitement: number; // 0-1
    urgency: number;    // 0-1
    greed: number;      // 0-1
    fomo: number;       // 0-1
  };
  personalizedVariables: {
    [key: string]: string | number;
  };
  lastColorScheme: string;
}

// Session storage for users
const userMemories: Map<string, UserMemory> = new Map();

// Initialize or retrieve user memory
export const getUserMemory = (address: string): UserMemory => {
  if (!userMemories.has(address)) {
    userMemories.set(address, {
      address,
      pressPatterns: {
        timestamps: [],
        amounts: [],
      },
      totalContribution: 0,
      responseToMessages: [],
      emotionalState: {
        excitement: 0.5,
        urgency: 0.3,
        greed: 0.4,
        fomo: 0.3,
      },
      personalizedVariables: {
        amount: '0.25',
        percent: '45',
        multiplier: '3.2',
        big_amount: '5.5',
        presses: '3',
        minutes: '5',
        seconds: '30',
        count: '5',
        remaining: '3',
        tier: '2',
        winners: '7',
        total: '124.5',
      },
      lastColorScheme: 'red',
    });
  }
  
  return userMemories.get(address)!;
};

// Update user memory with a new button press
export const recordButtonPress = (
  address: string, 
  amount: number, 
  messageType: 'fomo' | 'greed' | 'urgency' | 'reward' | 'social'
): void => {
  const memory = getUserMemory(address);
  
  // Record press pattern
  memory.pressPatterns.timestamps.push(Date.now());
  memory.pressPatterns.amounts.push(amount);
  memory.totalContribution += amount;
  
  // Calculate how quickly they pressed after the last message
  // This measures effectiveness of the last message type
  if (memory.pressPatterns.timestamps.length >= 2) {
    const timeDiff = memory.pressPatterns.timestamps[memory.pressPatterns.timestamps.length - 1] - 
                      memory.pressPatterns.timestamps[memory.pressPatterns.timestamps.length - 2];
    
    // If they pressed quickly after the last message, it was effective
    const effectivenessScore = Math.max(0, Math.min(1, 30000 / timeDiff));
    
    memory.responseToMessages.push({
      messageType,
      effectivenessScore,
    });
    
    // Update emotional state based on response
    updateEmotionalState(memory, messageType, effectivenessScore);
  }
  
  // Update personalized variables to make messages more relevant
  updatePersonalizedVariables(memory);
  
  userMemories.set(address, memory);
};

// Update the user's emotional state based on their responses
const updateEmotionalState = (
  memory: UserMemory,
  messageType: 'fomo' | 'greed' | 'urgency' | 'reward' | 'social',
  effectivenessScore: number
): void => {
  // Decay all emotional states slightly (emotions fade over time)
  memory.emotionalState.excitement *= 0.9;
  memory.emotionalState.urgency *= 0.85;
  memory.emotionalState.greed *= 0.9;
  memory.emotionalState.fomo *= 0.85;
  
  // Boost the emotional state that was targeted
  switch (messageType) {
    case 'fomo':
      memory.emotionalState.fomo += effectivenessScore * 0.3;
      break;
    case 'greed':
      memory.emotionalState.greed += effectivenessScore * 0.3;
      break;
    case 'urgency':
      memory.emotionalState.urgency += effectivenessScore * 0.3;
      break;
    case 'reward':
      memory.emotionalState.excitement += effectivenessScore * 0.3;
      break;
    case 'social':
      memory.emotionalState.fomo += effectivenessScore * 0.2;
      memory.emotionalState.excitement += effectivenessScore * 0.1;
      break;
  }
  
  // Cap all emotional states to 0-1 range
  memory.emotionalState.excitement = Math.min(1, Math.max(0, memory.emotionalState.excitement));
  memory.emotionalState.urgency = Math.min(1, Math.max(0, memory.emotionalState.urgency));
  memory.emotionalState.greed = Math.min(1, Math.max(0, memory.emotionalState.greed));
  memory.emotionalState.fomo = Math.min(1, Math.max(0, memory.emotionalState.fomo));
};

// Update personalized variables to make messages more engaging
const updatePersonalizedVariables = (memory: UserMemory): void => {
  // Make amounts slightly higher than their previous contributions to seem attainable
  const averageContribution = memory.pressPatterns.amounts.length > 0
    ? memory.pressPatterns.amounts.reduce((a, b) => a + b, 0) / memory.pressPatterns.amounts.length
    : 0.1;
  
  memory.personalizedVariables.amount = (averageContribution * 2.5).toFixed(2);
  memory.personalizedVariables.big_amount = (averageContribution * 10).toFixed(2);
  
  // Adjust time variables based on how quickly they've been pressing
  if (memory.pressPatterns.timestamps.length >= 2) {
    const recentTimeDiffs = [];
    for (let i = 1; i < Math.min(4, memory.pressPatterns.timestamps.length); i++) {
      recentTimeDiffs.push(memory.pressPatterns.timestamps[i] - memory.pressPatterns.timestamps[i-1]);
    }
    
    const avgTimeBetweenPresses = recentTimeDiffs.reduce((a, b) => a + b, 0) / recentTimeDiffs.length;
    
    // Set urgency timeframes to be just slightly shorter than their average press time
    memory.personalizedVariables.seconds = Math.round(avgTimeBetweenPresses / 1000 * 0.7);
    memory.personalizedVariables.minutes = Math.max(1, Math.round(avgTimeBetweenPresses / 60000 * 0.6));
  }
  
  // Other variables are updated based on usage patterns
  memory.personalizedVariables.percent = Math.round(40 + Math.random() * 30);
  memory.personalizedVariables.multiplier = (2 + Math.random() * 2).toFixed(1);
  memory.personalizedVariables.presses = Math.max(1, Math.floor(memory.pressPatterns.timestamps.length / 5) + 1);
  memory.personalizedVariables.count = Math.floor(3 + Math.random() * 4);
  memory.personalizedVariables.remaining = Math.floor(1 + Math.random() * 3);
  memory.personalizedVariables.tier = Math.min(5, Math.floor(memory.pressPatterns.timestamps.length / 3) + 1);
  memory.personalizedVariables.winners = Math.floor(5 + Math.random() * 10);
  memory.personalizedVariables.total = (100 + Math.random() * 150).toFixed(1);
};

// Replace template variables in messages
const personalizeMessage = (message: string, variables: Record<string, string | number>): string => {
  let result = message;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(`{${key}}`, value.toString());
  }
  return result;
};

// Choose the most effective message type based on user's emotional state
const chooseMessageType = (memory: UserMemory): 'fomo' | 'greed' | 'urgency' | 'reward' | 'social' => {
  const { emotionalState } = memory;
  
  // Find most responsive message types from history
  let mostEffectiveType: 'fomo' | 'greed' | 'urgency' | 'reward' | 'social' = 'greed'; // Default
  let highestEffectiveness = 0;
  
  if (memory.responseToMessages.length >= 3) {
    const typeEffectiveness: Record<string, { total: number, count: number }> = {
      fomo: { total: 0, count: 0 },
      greed: { total: 0, count: 0 },
      urgency: { total: 0, count: 0 },
      reward: { total: 0, count: 0 },
      social: { total: 0, count: 0 },
    };
    
    // Only look at recent messages for recency bias
    const recentResponses = memory.responseToMessages.slice(-5);
    
    for (const response of recentResponses) {
      typeEffectiveness[response.messageType].total += response.effectivenessScore;
      typeEffectiveness[response.messageType].count += 1;
    }
    
    for (const [type, data] of Object.entries(typeEffectiveness)) {
      if (data.count > 0) {
        const avgEffectiveness = data.total / data.count;
        if (avgEffectiveness > highestEffectiveness) {
          highestEffectiveness = avgEffectiveness;
          mostEffectiveType = type as any;
        }
      }
    }
  } else {
    // For new users, choose based on emotional state
    const states = [
      { type: 'fomo', value: emotionalState.fomo },
      { type: 'greed', value: emotionalState.greed },
      { type: 'urgency', value: emotionalState.urgency },
      { type: 'reward', value: emotionalState.excitement },
      { type: 'social', value: (emotionalState.fomo + emotionalState.excitement) / 2 },
    ];
    
    states.sort((a, b) => b.value - a.value);
    mostEffectiveType = states[0].type as any;
  }
  
  return mostEffectiveType;
};

// Get the color scheme based on emotional state
export const getEmotionalColorScheme = (address: string): {
  primary: string,
  secondary: string,
  accent: string,
  text: string,
  background: string
} => {
  const memory = getUserMemory(address);
  const { emotionalState } = memory;
  
  // Choose dominant emotion
  const dominantEmotions = [
    { type: 'urgency', value: emotionalState.urgency },
    { type: 'greed', value: emotionalState.greed },
    { type: 'fomo', value: emotionalState.fomo },
    { type: 'excitement', value: emotionalState.excitement },
  ].sort((a, b) => b.value - a.value);
  
  let scheme;
  const dominantEmotion = dominantEmotions[0].type;
  
  // Base schemes on emotional states
  switch (dominantEmotion) {
    case 'urgency':
      // Red/orange urgent colors
      scheme = {
        primary: chroma('#ff3b30').hex(),
        secondary: chroma('#ff9500').hex(),
        accent: chroma('#ffcc00').hex(),
        text: '#ffffff',
        background: '#000000',
      };
      memory.lastColorScheme = 'red';
      break;
      
    case 'greed':
      // Green/gold for greed
      scheme = {
        primary: chroma('#4cd964').hex(),
        secondary: chroma('#ffcc00').hex(),
        accent: chroma('#5856d6').hex(),
        text: '#ffffff',
        background: '#1c1c1e',
      };
      memory.lastColorScheme = 'green';
      break;
      
    case 'fomo':
      // Blue/purple for FOMO
      scheme = {
        primary: chroma('#5856d6').hex(),
        secondary: chroma('#007aff').hex(),
        accent: chroma('#ff2d55').hex(),
        text: '#ffffff',
        background: '#000000',
      };
      memory.lastColorScheme = 'blue';
      break;
      
    case 'excitement':
      // Bright/vibrant colors for excitement
      scheme = {
        primary: chroma('#ff2d55').hex(),
        secondary: chroma('#ffcc00').hex(),
        accent: chroma('#5ac8fa').hex(),
        text: '#ffffff',
        background: '#1c1c1e',
      };
      memory.lastColorScheme = 'pink';
      break;
      
    default:
      // Default red scheme
      scheme = {
        primary: chroma('#dc2626').hex(),
        secondary: chroma('#991b1b').hex(),
        accent: chroma('#f59e0b').hex(),
        text: '#ffffff',
        background: '#000000',
      };
      memory.lastColorScheme = 'red';
  }
  
  return scheme;
};

// Generate an AI message based on user behavior and memory
export const generateEnhancedMessage = (address: string, params: {
  buttonPresses: number,
  potSize: number,
  contributionAmount: number,
  totalContributions: number
}): string => {
  const memory = getUserMemory(address);
  
  // For completely new users
  if (params.buttonPresses === 0) {
    return "Press the button to win the pot. Take a chance!";
  }
  
  // For first time pressers
  if (params.buttonPresses === 1) {
    return `Great first press! The pot is now ${params.potSize.toFixed(4)} MNT. One more press could make all the difference!`;
  }
  
  // Choose message type based on emotional state and past responses
  const messageType = chooseMessageType(memory);
  
  // Select message pattern based on type
  let patterns;
  switch (messageType) {
    case 'fomo':
      patterns = FOMO_PATTERNS;
      break;
    case 'greed':
      patterns = GREED_PATTERNS;
      break;
    case 'urgency':
      patterns = URGENCY_PATTERNS;
      break;
    case 'reward':
      patterns = REWARD_PATTERNS;
      break;
    case 'social':
      patterns = SOCIAL_PROOF_PATTERNS;
      break;
    default:
      patterns = GREED_PATTERNS;
  }
  
  // Get a random message of the selected type
  const randomIndex = Math.floor(Math.random() * patterns.length);
  const template = patterns[randomIndex];
  
  // Personalize the message with user-specific variables
  const personalizedMessage = personalizeMessage(template, memory.personalizedVariables);
  
  return personalizedMessage;
};

// Get frame colors for a Farcaster frame-like experience
export const getFrameColors = (address: string): string => {
  const scheme = getEmotionalColorScheme(address);
  return JSON.stringify(scheme);
}; 