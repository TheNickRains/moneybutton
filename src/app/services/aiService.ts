// This is a placeholder file for aiService which is imported by deprecated routes
// It's kept only to avoid build errors

import OpenAI from 'openai';

// Initialize OpenAI client with the provided API key and allow browser usage
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Enable browser usage (understand the security implications)
});

// Types of messages the AI can generate
export enum MessageType {
  BET_PLACED = 'bet_placed',
  JACKPOT_INCREASED = 'jackpot_increased',
  WELCOME = 'welcome',
  CROSS_CHAIN = 'cross_chain',
  EMOTIONAL_TRIGGER = 'emotional_trigger',
  BRIDGE_SUGGESTION = 'bridge_suggestion'
}

// Message patterns for different scenarios
const betPlacedPatterns = [
  "Great bet! You're now {winChance}% likely to win the pot of {potSize} MNT!",
  "Bold move! Your chances are now {winChance}% for the {potSize} MNT pot.",
  "Nice! {contributionAmount} MNT added. Win chances: {winChance}%",
  "Excellent choice! {contributionAmount} MNT could win you {potSize} MNT!",
  "You've contributed {totalContributions} MNT overall. Current pot: {potSize} MNT!"
];

const jackpotIncreasedPatterns = [
  "The pot has grown to {potSize} MNT! Your chance: {winChance}%",
  "Jackpot alert! Now at {potSize} MNT and growing!",
  "The pot is heating up! Now {potSize} MNT!",
  "Big opportunity! The pot is now {potSize} MNT!",
  "{potSize} MNT pot is waiting for a winner! Is it you?"
];

const welcomePatterns = [
  "Welcome to Money Button! Press to win up to {potSize} MNT!",
  "Ready to win? The current pot is {potSize} MNT!",
  "Try your luck! Current win chance for new players: {winChance}%",
  "Join {totalContributions} others playing for {potSize} MNT!",
  "The Money Button awaits! Current pot: {potSize} MNT"
];

const crossChainPatterns = [
  "Want more MNT? Bridge your assets to Mantle!",
  "Low on MNT? Use our universal bridge from any chain!",
  "Bridge ETH, USDC, or other tokens to get more MNT for betting!",
  "Maximize your chances! Bridge more tokens to Mantle now!",
  "One-click bridge available for more MNT betting power!"
];

/**
 * Gets random emotional trigger message with psychological tactics
 */
function getEmotionalTriggerMessage(context: any): string {
  const patterns = [
    // FOMO (Fear of Missing Out) messages
    `${context.totalContributions || 3} people just increased their bets in the last minute!`,
    `Someone just won ${(context.potSize * 0.8).toFixed(2)} MNT! The pot is rebuilding now!`,
    `Players who bet more than ${context.contributionAmount * 2} MNT have 3x higher win rates!`,
    
    // Loss aversion messages
    `You're so close! Just ${(context.potSize * 0.1).toFixed(2)} MNT more would double your chances!`,
    `Don't miss out! Your win chance drops by 5% every minute you don't press!`,
    `Players who press consecutively have 40% better odds of winning!`,
    
    // Scarcity messages
    `Only 5 more high-probability win slots available in this round!`,
    `Limited time boost: Next 3 presses get +15% win chance!`,
    `Special window: Win chances temporarily increased for the next 30 seconds!`,
    
    // Social proof messages
    `A player with similar betting patterns just won ${(context.potSize * 1.2).toFixed(2)} MNT!`,
    `${Math.floor(context.totalContributions || 5) + 3} active players right now - highest of the day!`,
    `Players who press at this exact minute have historically won 2.3x more often!`
  ];
  
  return patterns[Math.floor(Math.random() * patterns.length)];
}

/**
 * Gets random bridge suggestion message with integrated pitch
 */
function getBridgeSuggestionMessage(context: any): string {
  const patterns = [
    // Cross-chain value proposition
    `Bridge your ETH to Mantle and get ${(context.contributionAmount * 1.5).toFixed(2)} MNT bonus betting credit!`,
    `Low on MNT? Our universal bridge supports 8+ chains including Ethereum, Polygon and BSC!`,
    `Maximize your winnings potential! Bridge USDC from any chain and get +10% extra MNT!`,
    
    // Convenience messaging
    `One-click bridge now available! Convert any token to MNT in under 2 minutes!`,
    `AI-powered bridge assistant can help move your assets to Mantle - just ask in chat!`,
    `Bridge any amount of tokens to MNT and receive a guaranteed {winChance}% win chance boost!`,
    
    // Integration messaging
    `The universal bridge to Mantle is now open! Move assets from any chain with our assistant.`,
    `Bridge directly through our AI assistant - just say "Bridge 0.1 ETH to Mantle" in chat!`,
    `Special bridge bonus: Get 5% extra MNT when bridging more than 0.01 ETH equivalent!`
  ];
  
  return patterns[Math.floor(Math.random() * patterns.length)];
}

// Helper function to get a random message from the provided patterns
function getRandomMessage(patterns: string[]): string {
  const randomIndex = Math.floor(Math.random() * patterns.length);
  return patterns[randomIndex];
}

// Interface for parameters needed to generate a personalized message
export interface AIMessageParams {
  buttonPresses: number;
  potSize: number;
  contributionAmount: number;
  totalContributions?: number;
  winChance?: number;
}

// Synchronous function to get an immediate personalized message without AI
export function getPersonalizedMessage(params: AIMessageParams): string {
  // Calculate win chance if not provided
  const winChance = params.winChance || Math.min(
    (params.contributionAmount / params.potSize) * 100, 
    params.buttonPresses > 5 ? 12 : 8
  ).toFixed(1);
  
  // Context object for template substitution
  const context = {
    ...params,
    winChance,
    potSize: params.potSize.toFixed(2),
    contributionAmount: params.contributionAmount.toFixed(2),
    totalContributions: params.totalContributions?.toFixed(2) || '0'
  };
  
  // Select message pattern based on use case and replace variables
  let template;
  
  // Randomly select a message type with weighted probabilities
  const randomVal = Math.random();
  if (randomVal < 0.3) {
    template = getRandomMessage(betPlacedPatterns);
  } else if (randomVal < 0.5) {
    template = getRandomMessage(jackpotIncreasedPatterns);
  } else if (randomVal < 0.65) {
    template = getRandomMessage(welcomePatterns);
  } else if (randomVal < 0.8) {
    template = getRandomMessage(crossChainPatterns);
  } else if (randomVal < 0.9) {
    template = getEmotionalTriggerMessage(context);
  } else {
    template = getBridgeSuggestionMessage(context);
  }
  
  // Replace template variables with actual values
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return context[key as keyof typeof context]?.toString() || '';
  });
}

// Asynchronous function to generate AI-powered messages
export async function generateAIMessage(messageType: MessageType, context: any): Promise<string> {
  try {
    // For immediate fallback in case of API issues or to avoid API costs during development
    if (!process.env.OPENAI_API_KEY && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      return getPersonalizedMessage(context as AIMessageParams);
    }
    
    // Prepare prompt for OpenAI based on message type
    let prompt = '';
    switch(messageType) {
      case MessageType.BET_PLACED:
        prompt = `Generate an encouraging message for a user who just placed a bet of ${context.contributionAmount} MNT. Their chance of winning is ${context.winChance}% and the pot size is ${context.potSize} MNT. Keep it under 100 characters and make it engaging.`;
        break;
      case MessageType.JACKPOT_INCREASED:
        prompt = `Generate an exciting message announcing that the pot has grown to ${context.potSize} MNT. The user's chance of winning is ${context.winChance}%. Keep it under 100 characters and create excitement.`;
        break;
      case MessageType.EMOTIONAL_TRIGGER:
        prompt = `Create a message that triggers FOMO (fear of missing out) for a betting game. The pot is ${context.potSize} MNT and there are ${context.totalContributions || "many"} people playing. Keep it under 100 characters and make it psychologically compelling.`;
        break;
      case MessageType.BRIDGE_SUGGESTION:
        prompt = `Suggest to the user that they can bridge tokens from other chains to get more MNT for betting. Keep it under 100 characters, make it sound convenient and valuable.`;
        break;
      default:
        prompt = `Generate a short, encouraging message for a betting game user. The pot size is ${context.potSize} MNT. Keep it under 100 characters and make it exciting.`;
    }
    
    // Make API call to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system", 
          content: "You are an AI assistant for a crypto betting application called Money Button. Your messages should be engaging, brief, and motivating. Use psychological tactics that encourage continued betting without being unethical."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 60,
      temperature: 0.7,
    });
    
    // Return the generated message
    return response.choices[0].message.content?.trim() || getPersonalizedMessage(context as AIMessageParams);
    
  } catch (error) {
    console.error('Error generating AI message:', error);
    // Fallback to template-based message
    return getPersonalizedMessage(context as AIMessageParams);
  }
}

export default {
  getPersonalizedMessage,
  generateAIMessage,
  MessageType
}; 