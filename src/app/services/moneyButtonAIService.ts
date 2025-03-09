import OpenAI from 'openai';

// Check if AI features are enabled (defaults to false if not specified)
const AI_FEATURES_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES === 'true';

// Get API key from environment with a safer approach
const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

// Check if we have a valid API key before initializing
const hasValidApiKey = !!API_KEY && API_KEY.length > 0 && !API_KEY.includes('your-api-key');

// Only attempt to use OpenAI if both conditions are met
const canUseOpenAI = AI_FEATURES_ENABLED && hasValidApiKey;

// Track rate limit status to avoid repeated failed calls
let isRateLimited = false;
let rateLimitResetTime = 0;
const RATE_LIMIT_COOLDOWN = 60 * 1000; // 1 minute cooldown if rate limited

// Initialize OpenAI only if we have a valid API key
const openai = canUseOpenAI ? new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true // Allow client-side usage
}) : null;

// Log OpenAI status on initialization
console.log(`AI Features: ${AI_FEATURES_ENABLED ? 'Enabled' : 'Disabled'}`);
console.log(`OpenAI Client: ${openai ? 'Initialized' : 'Not Available'}`);

// Prebuilt responses for different scenarios
const FALLBACK_RESPONSES = {
  emotional: {
    'fomo': [
      'Others are winning big right now! Don\'t miss out!',
      'Players just like you are hitting jackpots!',
      'The pot is growing fast! Don\'t be left behind!'
    ],
    'greed': [
      'The pot keeps growing! Your big win is waiting.',
      'Imagine what you could do with this jackpot!',
      'Such a massive pot waiting to be claimed!'
    ],
    'urgency': [
      'Act fast! This pot could be claimed any moment!',
      'Don\'t wait! The jackpot is at its peak!',
      'Last chance before someone else wins it all!'
    ],
    'reward': [
      'Your strategy looks good. A win might be just around the corner!',
      'You\'re playing smart! Keep it up for the big win!',
      'Your persistence will pay off any moment now!'
    ],
    'social': [
      'Join the crowd of winners! The community is buzzing today.',
      'Everyone\'s talking about today\'s jackpot!',
      'Be part of the winning community!'
    ],
    'default': [
      'Press again for greater rewards! The pot keeps growing!',
      'Each press brings you closer to winning!',
      'The Money Button is ready for your lucky press!'
    ]
  },
  
  quickFeedback: [
    "Ready to win big?",
    "The pot is growing!",
    "Press for a chance to win!",
    "Feeling lucky today?",
    "Big wins await!",
    "Try your luck!",
    "Let's go!",
    "Don't miss your chance!",
    "Winners press now!",
    "Jackpot is waiting!"
  ],
  
  winCelebration: [
    "🎉 CONGRATULATIONS! You just won the jackpot! AMAZING! 🎉",
    "🔥 INCREDIBLE WIN! The jackpot is YOURS! 🔥",
    "⭐ WINNER WINNER! You've claimed the prize! ⭐",
    "💰 JACKPOT! You're today's big winner! 💰",
    "🏆 CHAMPION! You beat the odds and WON! 🏆"
  ]
};

// Simple cache to store responses and reduce API calls
const responseCache: Record<string, { response: string, timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 30; // Cache entries expire after 30 minutes

// Message type definitions
export type MessageType = {
  content: string;
  role: 'user' | 'assistant' | 'system';
};

/**
 * Get a random response from a predefined list
 * @param responses Array of possible responses
 * @returns A randomly selected response
 */
const getRandomResponse = (responses: string[]): string => {
  const index = Math.floor(Math.random() * responses.length);
  return responses[index];
};

/**
 * Get a cached response or generate a new one
 * @param cacheKey The cache key
 * @param generator Function to generate a new response
 * @param fallbackResponses Fallback responses if generation fails
 */
const getCachedOrGenerate = async (
  cacheKey: string,
  generator: () => Promise<string>,
  fallbackResponses: string[]
): Promise<string> => {
  // If AI features are disabled, just return a random fallback response
  if (!AI_FEATURES_ENABLED) {
    return getRandomResponse(fallbackResponses);
  }
  
  // Select a random fallback for this request
  const fallback = getRandomResponse(fallbackResponses);
  
  // Check if we have a valid cached response
  const cached = responseCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response;
  }
  
  // If we're rate limited and the cooldown hasn't passed, use cached or fallback
  if (isRateLimited && Date.now() < rateLimitResetTime) {
    console.log('Using fallback due to rate limiting');
    return cached ? cached.response : fallback;
  }
  
  // If we don't have a valid API key or OpenAI instance, return fallback
  if (!hasValidApiKey || !openai) {
    console.log('No valid API key, using fallback');
    return fallback;
  }
  
  try {
    // Generate new response
    const response = await generator();
    
    // Cache the response
    responseCache[cacheKey] = {
      response,
      timestamp: Date.now()
    };
    
    // Successfully called API, reset rate limit flag
    isRateLimited = false;
    
    return response;
  } catch (error: any) {
    console.error('Error generating response:', error);
    
    // Check if it's a rate limit error (429)
    if (error?.status === 429) {
      isRateLimited = true;
      rateLimitResetTime = Date.now() + RATE_LIMIT_COOLDOWN;
      console.log(`Rate limited. Will try again after ${new Date(rateLimitResetTime).toLocaleTimeString()}`);
    }
    
    // If we have an expired cached response, use it instead of the fallback
    if (cached) {
      return cached.response;
    }
    
    return fallback;
  }
};

/**
 * Generate emotional response for Money Button interactions
 * @param prompt The base prompt for the emotional message
 * @param triggerType The type of emotional trigger to use
 * @param context Additional context for personalization
 * @returns AI-generated emotional response
 */
export const generateEmotionalResponse = async (
  prompt: string, 
  triggerType: 'fomo' | 'greed' | 'urgency' | 'reward' | 'social' = 'fomo',
  context?: any
) => {
  // Create a cache key based on the prompt and trigger type
  const cacheKey = `emotional_${triggerType}_${prompt.substring(0, 50)}`;
  
  // Get appropriate fallback responses for this trigger type
  const fallbackResponses = FALLBACK_RESPONSES.emotional[triggerType] || FALLBACK_RESPONSES.emotional.default;
  
  return getCachedOrGenerate(
    cacheKey,
    async () => {
      // Check if OpenAI instance is available
      if (!openai) {
        throw new Error('OpenAI API not available');
      }
    
      // Customize the system prompt based on trigger type
      let systemPrompt = "";
      
      switch(triggerType) {
        case 'fomo':
          systemPrompt = `You are an AI designed to create FOMO (Fear of Missing Out) messages for a DeFi betting platform called Money Button.
          Create a short, engaging message that makes the user feel they might miss out on winning the jackpot.
          Reference that others are playing and potentially winning. Maximum length: 120 characters.`;
          break;
        
        case 'greed':
          systemPrompt = `You are an AI designed to appeal to a user's sense of greed on a DeFi betting platform called Money Button.
          Create a short, engaging message that emphasizes the growing pot size and potential rewards.
          Make the potential winnings seem very attainable. Maximum length: 120 characters.`;
          break;
          
        case 'urgency':
          systemPrompt = `You are an AI designed to create a sense of urgency for a DeFi betting platform called Money Button.
          Create a short, engaging message that emphasizes the need to act quickly.
          Suggest the pot might be won by someone else soon. Maximum length: 120 characters.`;
          break;
          
        case 'reward':
          systemPrompt = `You are an AI designed to focus on reward anticipation for a DeFi betting platform called Money Button.
          Create a short, engaging message that praises the user's betting strategy and suggests they're due for a win soon.
          Make them feel like they're making good choices. Maximum length: 120 characters.`;
          break;
          
        case 'social':
          systemPrompt = `You are an AI designed to leverage social proof for a DeFi betting platform called Money Button.
          Create a short, engaging message that mentions other players and community activity.
          Make the user feel part of something bigger and exciting. Maximum length: 120 characters.`;
          break;
          
        default:
          systemPrompt = `You are an AI designed to create emotionally engaging messages for a DeFi betting platform called Money Button.
          Create a short, engaging message that uses psychological triggers to encourage continued play.
          Keep it brief and compelling. Maximum length: 120 characters.`;
      }
      
      // Build complete context for more personalized responses
      const contextStr = context ? 
        `User context: ${JSON.stringify(context)}. Use this information to personalize your response.` : '';
      
      const messages: MessageType[] = [
        { role: 'system', content: systemPrompt + ' ' + contextStr },
        { role: 'user', content: prompt }
      ];
      
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        messages: messages as any,
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 120
      });
      
      return response.choices[0]?.message?.content || getRandomResponse(fallbackResponses);
    },
    fallbackResponses
  );
};

/**
 * Generate quick response for immediate feedback
 * @param prompt Prompt for quick response
 * @returns AI-generated quick response
 */
export const generateQuickFeedback = async (prompt: string) => {
  // Create a cache key based on the prompt
  const cacheKey = `quick_${prompt.substring(0, 50)}`;
  
  return getCachedOrGenerate(
    cacheKey,
    async () => {
      // Check if OpenAI instance is available
      if (!openai) {
        throw new Error('OpenAI API not available');
      }
    
      const response = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: 'Provide a very brief and engaging response for a DeFi betting app. Maximum 40 characters.' },
          { role: 'user', content: prompt }
        ],
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 20
      });
      
      return response.choices[0]?.message?.content || getRandomResponse(FALLBACK_RESPONSES.quickFeedback);
    },
    FALLBACK_RESPONSES.quickFeedback
  );
};

/**
 * Generate a win celebration message
 * @param context Win context (amount won, etc.)
 * @returns AI-generated win celebration message
 */
export const generateWinCelebration = async (context: any) => {
  // Create a cache key based on the win amount
  const winAmount = context.winAmount || 'jackpot';
  const cacheKey = `win_${winAmount}`;
  
  // Create personalized fallbacks with the win amount
  const personalizedFallbacks = FALLBACK_RESPONSES.winCelebration.map(msg => {
    return msg.replace('the jackpot', `${winAmount} MNT`);
  });
  
  return getCachedOrGenerate(
    cacheKey,
    async () => {
      // Check if OpenAI instance is available
      if (!openai) {
        throw new Error('OpenAI API not available');
      }
    
      const systemPrompt = `You are creating an exciting celebration message for a user who just won on Money Button!
      Create a short, enthusiastic message celebrating their win. Be extremely excited and use emojis.
      Reference the amount they won if available. Maximum length: 120 characters.`;
      
      const contextPrompt = `The user just won ${winAmount} MNT! Create an exciting celebration message.`;
      
      const messages: MessageType[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contextPrompt }
      ];
      
      const response = await openai.chat.completions.create({
        messages: messages as any,
        model: 'gpt-3.5-turbo',
        temperature: 0.8,
        max_tokens: 120
      });
      
      return response.choices[0]?.message?.content || getRandomResponse(personalizedFallbacks);
    },
    personalizedFallbacks
  );
};

export default {
  generateEmotionalResponse,
  generateQuickFeedback,
  generateWinCelebration
}; 