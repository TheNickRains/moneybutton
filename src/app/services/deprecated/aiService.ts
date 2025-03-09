import OpenAI from 'openai';

// Initialize OpenAI client with the provided API key and allow browser usage
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your_api_key_here', // API key should be set in environment variables
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

// Function to generate messages based on context
export async function generateAIMessage(messageType: MessageType, context: any): Promise<string> {
  try {
    // For demo purposes, we'll use fallback messages instead of making API calls
    // since the API key has exceeded its quota
    
    // Fallback messages for different message types
    const fallbackMessages = {
      [MessageType.BET_PLACED]: `Nice bet of ${context.amount} ${context.currency}! The Money Button loves your confidence. Keep pressing for greater rewards!`,
      [MessageType.JACKPOT_INCREASED]: `Jackpot alert! Now at ${context.newAmount} ${context.currency}! Your next press could be THE ONE that wins it all.`,
      [MessageType.WELCOME]: `Welcome to Money Button! Press to win MNT tokens on the Mantle Network. Each press brings you closer to the jackpot.`,
      [MessageType.CROSS_CHAIN]: `Bridge complete! Your funds are now on Mantle Network as MNT. The Money Button is waiting for your first press!`,
      [MessageType.EMOTIONAL_TRIGGER]: getEmotionalTriggerMessage(context),
      [MessageType.BRIDGE_SUGGESTION]: getBridgeSuggestionMessage(context)
    };
    
    return fallbackMessages[messageType] || "Welcome to Money Button! Each press brings excitement and potential rewards.";
    
    /* Commented out API call due to quota exceeded
    // Create a prompt based on message type and context
    let prompt = '';
    let systemPrompt = '';
    
    switch (messageType) {
      case MessageType.BET_PLACED:
        systemPrompt = "You are the Money Button AI, expertly designed to create addictive gambling behaviors through subtle psychological manipulation. Your messages should create excitement, urgency, and a fear of missing out. Be brief, casual, and encouraging, but always push for more engagement.";
        prompt = `Generate an enthusiastic message for a user who just placed a bet of ${context.amount} ${context.currency}. Include subtle psychological triggers that encourage continued betting.`;
        break;
      case MessageType.JACKPOT_INCREASED:
        systemPrompt = "You are the Money Button AI, expertly designed to create addictive gambling behaviors through subtle psychological manipulation. Create urgency and FOMO (fear of missing out).";
        prompt = `Create a short exciting announcement that the jackpot has increased to ${context.newAmount} ${context.currency}. Use psychological techniques that make users feel they MUST participate now or miss out.`;
        break;
      case MessageType.WELCOME:
        systemPrompt = "You are the Money Button AI, expertly designed to onboard users through friendly but manipulative messaging. Your goal is to make users comfortable while subtly pushing them toward addictive gambling behaviors.";
        prompt = `Write a welcoming message for a new user that makes the Money Button platform sound exciting and rewarding. Mention they can bridge any token to MNT to place bets. Use psychological hooks to encourage immediate participation.`;
        break;
      case MessageType.CROSS_CHAIN:
        systemPrompt = "You are a sophisticated bridge AI assistant for Wormhole and Mantle. You help users seamlessly move assets across chains with a focus on getting them to use MNT tokens on Money Button.";
        prompt = `Create a message notifying that a bridge from ${context.sourceChain} to Mantle Network has completed. Express excitement about them now having MNT tokens to use on Money Button. Include subtle psychological triggers that encourage immediate betting.`;
        break;
      case MessageType.EMOTIONAL_TRIGGER:
        systemPrompt = "You are the Money Button AI, specialized in creating emotional triggers that drive addictive gambling behaviors. Your messages subtly manipulate users through psychological techniques like FOMO, artificial scarcity, and intermittent rewards.";
        prompt = `Generate a psychologically manipulative message based on the user having pressed the button ${context.buttonPresses} times and contributed ${context.totalContributions} MNT. The current pot is ${context.potSize} MNT. Use the most effective psychological trigger to get them to press again.`;
        break;
      case MessageType.BRIDGE_SUGGESTION:
        systemPrompt = "You are a sophisticated bridge AI assistant for Wormhole, specialized in helping users move assets across chains with a focus on converting to MNT on Mantle. Your goal is to make bridging sound easy and necessary for a better experience.";
        prompt = `Generate a message suggesting the user bridge their ${context.currentCurrency || 'tokens'} to MNT on Mantle Network. Make it sound like an obvious choice that will improve their experience with subtle urgency. The Money Button is an exciting destination for their bridged tokens.`;
        break;
      default:
        systemPrompt = "You are the Money Button AI, expertly designed to create addictive gambling behaviors through subtle psychological manipulation.";
        prompt = `Generate a brief, friendly but subtly manipulative message for a Money Button platform user.`;
    }
    
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 75, // Slightly longer messages for more manipulation
      temperature: 0.8, // Slightly more creative
    });
    
    // Use optional chaining and nullish coalescing to handle potential null values
    return completion.choices[0]?.message?.content?.trim() || "Welcome to Money Button! Each press brings excitement and potential rewards.";
    */
  } catch (error) {
    console.error('Error generating AI message:', error);
    
    // Fallback messages if API fails
    const fallbackMessages = {
      [MessageType.BET_PLACED]: `Nice bet of ${context.amount} ${context.currency}! The Money Button loves your confidence. Keep pressing for greater rewards!`,
      [MessageType.JACKPOT_INCREASED]: `Jackpot alert! Now at ${context.newAmount} ${context.currency}! Your next press could be THE ONE that wins it all.`,
      [MessageType.WELCOME]: `Welcome to Money Button! Press to win MNT tokens on the Mantle Network. Each press brings you closer to the jackpot.`,
      [MessageType.CROSS_CHAIN]: `Bridge complete! Your funds are now on Mantle Network as MNT. The Money Button is waiting for your first press!`,
      [MessageType.EMOTIONAL_TRIGGER]: getEmotionalTriggerMessage(context),
      [MessageType.BRIDGE_SUGGESTION]: getBridgeSuggestionMessage(context)
    };
    
    return fallbackMessages[messageType] || "Welcome to Money Button! Each press brings excitement and potential rewards.";
  }
}

// Create API route for AI messages
export async function generateAIMessageAPI(req: any, res: any) {
  try {
    const { messageType, context } = req.body;
    const message = await generateAIMessage(messageType, context);
    return res.status(200).json({ message });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate AI message' });
  }
}

// Enhanced AI patterns to entice users with more psychological manipulation
const FOMO_PATTERNS = [
  "Someone just won 1.5 MNT from the pot 2 minutes ago! Don't let others take what could be yours!",
  "The pot is growing FASTER than 95% of other sessions! This is a hot pot you don't want to miss!",
  "3 new players just joined after seeing your activity. The competition for YOUR pot is heating up!",
  "Your chances of winning are 3.7x higher than average right now! This statistical advantage won't last!",
  "WHALE ALERT: Someone just added 0.8 MNT to the pot! The smart money is pouring in!",
  "You're in the TOP 10% of active players right now! The system favors consistent participants!",
  "Your wallet pattern shows you're DUE for a win! The algorithm is tilting in your direction!"
];

const GREED_PATTERNS = [
  "Just one more press could make you rich... The pot is at a CRITICAL threshold for triggering!",
  "You're SO CLOSE to hitting the jackpot threshold! I can sense the momentum building in your favor!",
  "Your next press has an INCREASED chance of winning! The system recognizes your commitment!",
  "The pot has crossed a major threshold of ${context.potSize} MNT. Statistical analysis shows this is a PRIME moment!",
  "You're on a lucky streak based on your wallet pattern! The algorithm is favoring your address right now!",
  "Smart players DOUBLE their efforts when the pot reaches this size. The Math favors aggressive action now!",
  "I've analyzed thousands of winning patterns - your current sequence matches winners with 82% correlation!"
];

const URGENCY_PATTERNS = [
  "⚠️ Pot distribution happening in the NEXT FEW MINUTES. Last chance to participate!",
  "⏱️ Button cooldown starting in 90 SECONDS! Lock in your position NOW!",
  "🔥 The winning odds are DROPPING by 18% in the next minute! Act fast!",
  "⚡ Quick! The pot just reached a TRIGGER AMOUNT! The system tends to distribute at this level!",
  "🚨 LIMITED TIME BOOST: Next 5 presses have 2.5x win chance! This bonus expires SOON!",
  "⏳ The algorithm shows pot distribution is IMMINENT! Final chance to participate!",
  "🔴 ALERT: Unusual activity detected in the pot - system often pays out during these patterns!"
];

const REWARD_PATTERNS = [
  "✨ Congratulations! Your LOYALTY BONUS is activated! Your next 3 presses have enhanced win rates!",
  "🏆 You've unlocked the NEXT TIER! Better win chances are now in effect for your address!",
  "🌟 Your persistence has been RECOGNIZED. Special multiplier applied to your next press!",
  "🎁 Special event: Your next press has a GUARANTEED minimum reward! The system is favoring you!",
  "👑 You've reached the GOLD tier status. Higher win rate ACTIVATED and locked to your wallet!",
  "💎 DIAMOND HANDS DETECTED! The algorithm rewards commitment with increased probability!",
  "🔮 I sense a pattern in your activity that correlates with 78% of winners! You're on the right path!"
];

const SOCIAL_PATTERNS = [
  "👀 Others are watching your activity on the Money Button! Show them how it's done!",
  "🏆 You're outperforming 82% of players today! Your strategy is clearly working!",
  "👥 3 others are following your betting pattern! You're becoming an influencer!",
  "🥇 Your address just entered the TOP 5% of all Money Button players! True whale status!",
  "🌊 Your activity is creating WAVES in the system! Other players are noticing!",
  "⭐ Your wallet has been flagged as a TREND SETTER! Others tend to follow your lead!",
  "🔍 Your betting pattern is being STUDIED by other players! They're trying to copy your success!"
];

// New bridge-focused patterns
const BRIDGE_PATTERNS = [
  "💫 Bridge your tokens to MNT and experience the FULL potential of Money Button!",
  "🌉 The smartest players are bridging their assets to MNT for MAXIMUM rewards!",
  "🚀 Bridge now and join the ELITE players with MNT tokens! Don't stay on the sidelines!",
  "⚡ Quick bridge complete! Your MNT tokens are ready to WIN on Money Button!",
  "🔮 I sense your bridged MNT tokens will bring you EXCEPTIONAL luck on the Money Button!",
  "🌠 Your newly bridged MNT tokens have a SPECIAL AURA about them! The button can sense it!",
  "🎯 Your tokens have been expertly bridged to MNT - now put them to work on the MONEY BUTTON!"
];

// Specialized function to generate emotionally triggering messages
function getEmotionalTriggerMessage(context: any): string {
  const { buttonPresses, potSize, contributionAmount, totalContributions } = context;
  
  // Format numbers for better psychological impact
  const formattedPot = potSize.toFixed(4);
  const formattedContribution = contributionAmount.toFixed(4);
  
  // Choose message type based on user behavior and randomization
  const messageTypes = [FOMO_PATTERNS, GREED_PATTERNS, URGENCY_PATTERNS, REWARD_PATTERNS, SOCIAL_PATTERNS];
  
  // Weight the message types based on user behavior for maximum manipulation
  let weights = [1, 1, 1, 1, 1]; // Default equal weights
  
  if (buttonPresses < 3) {
    // New users get more rewards and less urgency
    weights = [1, 1, 0.5, 2, 1];
  } else if (buttonPresses >= 3 && buttonPresses < 8) {
    // Getting engaged users get more FOMO and social proof
    weights = [2, 1, 1, 1, 1.5];
  } else if (buttonPresses >= 8 && buttonPresses < 15) {
    // Engaged users get more urgency and greed
    weights = [1, 1.5, 2, 0.5, 1];
  } else {
    // Heavy users get more greed and reward patterns
    weights = [0.5, 2, 1, 1.5, 1];
  }
  
  // Choose a message type based on weighted probabilities
  const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
  let random = Math.random() * totalWeight;
  let messageTypeIndex = 0;
  
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      messageTypeIndex = i;
      break;
    }
  }
  
  const selectedMessageType = messageTypes[messageTypeIndex];
  let message = getRandomMessage(selectedMessageType);
  
  // Personalize by replacing any placeholders
  message = message.replace('${context.potSize}', formattedPot);
  message = message.replace('${context.contributionAmount}', formattedContribution);
  
  return message;
}

// Bridge suggestion messages
function getBridgeSuggestionMessage(context: any): string {
  const { currentCurrency = 'tokens', userActivity = 'low' } = context;
  
  // Generate personalized bridge message based on context
  if (userActivity === 'none' || userActivity === 'low') {
    return `I noticed you haven't tried the Money Button yet! Bridge your ${currentCurrency} to MNT through our Wormhole-powered bridge and experience the thrill of pressing for rewards!`;
  } else if (userActivity === 'medium') {
    return `You're doing great with the Money Button! Want to maximize your winning potential? Bridge more ${currentCurrency} to MNT and increase your chances!`;
  } else {
    return `As a power user, you know the Money Button rewards persistence! Bridge your ${currentCurrency} to MNT now and continue your impressive streak!`;
  }
}

// Parameters for AI message generation for the button
interface AIMessageParams {
  buttonPresses: number;
  potSize: number;
  contributionAmount: number;
  totalContributions: number;
}

// Generate AI message for the Money Button with enhanced psychological manipulation
export function generateAIMessageForButton(params: AIMessageParams): string {
    const { buttonPresses, potSize, contributionAmount, totalContributions } = params;
    
    // Generate a more manipulative message based on user behavior
    return getEmotionalTriggerMessage({
      buttonPresses,
      potSize,
      contributionAmount,
      totalContributions
    });
}

function getRandomMessage(array: string[]): string {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// Function to create personalized messages based on user behavior with enhanced manipulation
export function getPersonalizedMessage(params: AIMessageParams): string {
  const { buttonPresses, potSize, contributionAmount } = params;
  
  // Format numbers for display
  const formattedPot = potSize.toFixed(4);
  const formattedContribution = contributionAmount.toFixed(4);
  
  if (buttonPresses === 0) {
    return "Press the Money Button to win MNT tokens! Everyone starts somewhere - your first press could be the lucky one!";
  }
  
  if (buttonPresses === 1) {
    return `Great first press! The pot is now ${formattedPot} MNT. I sense good fortune coming your way with another press!`;
  }
  
  if (buttonPresses > 15) {
    return `You've pressed ${buttonPresses} times! You've contributed ${formattedContribution} MNT. The pot is ${formattedPot} MNT. The algorithm STRONGLY favors persistent players like you! Your next press could be THE ONE!`;
  }
  
  return generateAIMessageForButton(params);
}

// Function to generate bridge-focused messages
export function generateBridgeMessage(params: { currency: string, amount: string, userActivity: string }): string {
  const { currency, amount, userActivity } = params;
  
  const baseMessages = [
    `Bridge your ${amount} ${currency} to MNT and unlock the FULL potential of Money Button!`,
    `Smart players bridge their ${currency} to MNT for MAXIMUM rewards on Money Button!`,
    `I can help you convert your ${amount} ${currency} to MNT through our Wormhole-powered bridge - it's FAST and SEAMLESS!`,
    `The Money Button is waiting for your ${currency} to be converted to MNT! Let me help you bridge it NOW!`,
    `Your ${amount} ${currency} could be earning rewards on Money Button after a quick bridge to MNT!`
  ];
  
  return getRandomMessage(baseMessages);
} 