import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types of messages the AI can generate
export enum MessageType {
  BET_PLACED = 'bet_placed',
  JACKPOT_INCREASED = 'jackpot_increased',
  WELCOME = 'welcome',
  CROSS_CHAIN = 'cross_chain'
}

// Function to generate messages based on context
export async function generateAIMessage(messageType: MessageType, context: any): Promise<string> {
  try {
    // Create a prompt based on message type and context
    let prompt = '';
    
    switch (messageType) {
      case MessageType.BET_PLACED:
        prompt = `Generate an enthusiastic message for a user who just placed a bet of ${context.amount} ${context.currency}. Be brief, casual, and encouraging.`;
        break;
      case MessageType.JACKPOT_INCREASED:
        prompt = `Create a short exciting announcement that the jackpot has increased to ${context.newAmount} ${context.currency}. Make it sound enticing for others to join.`;
        break;
      case MessageType.WELCOME:
        prompt = `Write a brief welcoming message for a new user on a cross-chain betting platform. Be friendly and mention that they can bet with multiple currencies.`;
        break;
      case MessageType.CROSS_CHAIN:
        prompt = `Create a short message notifying that a cross-chain bridge from ${context.sourceChain} to ${context.destChain} has completed. Keep it brief, conversational, and reassuring.`;
        break;
      default:
        prompt = `Generate a brief, friendly message for a betting platform user.`;
    }
    
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an enthusiastic assistant for a cross-chain betting platform. Keep responses brief, casual, and engaging. Don't use hashtags or emojis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 50, // Keep messages short
      temperature: 0.7,
    });
    
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating AI message:', error);
    
    // Fallback messages if API fails
    const fallbackMessages = {
      [MessageType.BET_PLACED]: `Nice bet of ${context.amount} ${context.currency}! Good luck!`,
      [MessageType.JACKPOT_INCREASED]: `Jackpot alert! Now at ${context.newAmount} ${context.currency}!`,
      [MessageType.WELCOME]: `Welcome to Money Button! Bet with any currency you like.`,
      [MessageType.CROSS_CHAIN]: `Bridge complete! Your funds are now on ${context.destChain}.`
    };
    
    return fallbackMessages[messageType] || "Welcome to Money Button!";
  }
}

// Create API route for AI messages
export async function generateAIMessageAPI(req, res) {
  try {
    const { messageType, context } = req.body;
    const message = await generateAIMessage(messageType, context);
    return res.status(200).json({ message });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate AI message' });
  }
}

// AI patterns to entice users
const FOMO_PATTERNS = [
  "Someone just won 1.2 ETH from the pot 5 minutes ago!",
  "The pot is growing fast! Don't miss out!",
  "3 new players just joined. The competition is heating up!",
  "Your chances of winning are 3x higher than average right now!",
  "WHALE ALERT: Someone just added 0.5 ETH to the pot!",
];

const GREED_PATTERNS = [
  "Just one more press could make you rich...",
  "You're so close to hitting the jackpot threshold!",
  "Your next press has an increased chance of winning!",
  "The pot has crossed a major threshold. Press now!",
  "You're on a lucky streak based on your wallet pattern!",
];

const URGENCY_PATTERNS = [
  "Pot distribution happening SOON. Last chance!",
  "Button cooldown starting in 2 minutes!",
  "The winning odds are dropping in 60 seconds!",
  "Quick! The pot just reached a trigger amount!",
  "Limited time boost: next 5 presses have 2x win chance!",
];

const REWARD_PATTERNS = [
  "Congratulations! Your loyalty bonus is activated!",
  "You've unlocked the next tier! Better win chances!",
  "Your persistence has been noted. Bonus multiplier applied!",
  "Special event: Your next press has a guaranteed min reward!",
  "You've reached the GOLD tier status. Higher win rate activated!",
];

interface AIMessageParams {
  buttonPresses: number;
  potSize: number;
  contributionAmount: number;
  totalContributions: number;
}

export function generateAIMessage(params: AIMessageParams): string {
  const { buttonPresses, potSize, contributionAmount, totalContributions } = params;

  // Based on user behavior, choose appropriate manipulation pattern
  if (buttonPresses > 0 && buttonPresses < 3) {
    // New users get encouraging messages
    return getRandomMessage(REWARD_PATTERNS);
  } else if (buttonPresses >= 3 && buttonPresses < 8) {
    // Users who have pressed a few times get FOMO
    return getRandomMessage(FOMO_PATTERNS);
  } else if (buttonPresses >= 8 && buttonPresses < 15) {
    // Engaged users get urgency
    return getRandomMessage(URGENCY_PATTERNS);
  } else {
    // Heavy users get greed messages
    return getRandomMessage(GREED_PATTERNS);
  }
}

function getRandomMessage(array: string[]): string {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// Function to create personalized messages based on user behavior
export function getPersonalizedMessage(params: AIMessageParams): string {
  const { buttonPresses, potSize, contributionAmount } = params;
  
  // Format numbers for display
  const formattedPot = potSize.toFixed(4);
  const formattedContribution = contributionAmount.toFixed(4);
  
  if (buttonPresses === 0) {
    return "Press the button to win the pot. Take a chance!";
  }
  
  if (buttonPresses === 1) {
    return `Great first press! The pot is now ${formattedPot} MNT. Press again?`;
  }
  
  if (buttonPresses > 15) {
    return `You've pressed ${buttonPresses} times! You've contributed ${formattedContribution} MNT. The pot is ${formattedPot} MNT. Your chances are looking GOOD!`;
  }
  
  return generateAIMessage(params);
} 