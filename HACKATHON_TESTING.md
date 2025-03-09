# 🧪 Testing Guide for Money Button Hackathon Submission

## Quick Start
1. Visit the deployed app at: [MoneyButton.fun](https://moneybutton.fun)
2. Connect your wallet (or use the simulated wallet connection)
3. Try the Money Button and bridge features

## ✅ Key Features to Test

### 1. Money Button Core Functionality

- **Placing Bets**:
  - Adjust the bet amount using the slider (0.01 - 0.1 MNT)
  - Click the Money Button to place a bet
  - Notice that 80% goes to the pot and 20% to the creator (visible in the confirmation modal)
  - Observe how the pot increases by only 80% of your bet amount

- **User Interface**:
  - See how the button reacts to interactions with animations
  - Watch the pot size update in real-time
  - View the activity feed showing recent bets and winners

- **Wallet Connection Simulation**:
  - If you don't have a real wallet, the application supports a simulated wallet
  - Click "Connect Wallet" to see the simulation in action

### 2. AI Bridge Assistant

- **Opening the Bridge**:
  - Click the "Bridge" button at the bottom of the screen
  - A chat interface will appear with an AI assistant

- **Testing AI Responses**:
  - Try natural language queries like:
    - "I want to bridge 10 ETH from Ethereum"
    - "How do I bridge USDC?"
    - "What fees should I expect when bridging from Polygon?"
  - Notice how responses are dynamic, not static templates

- **Bridge Workflow**:
  - Select a source chain (e.g., Ethereum, Polygon)
  - Choose a token (e.g., ETH, USDC)
  - Enter an amount
  - See the expected fees and duration

### 3. Psychological Engagement Features

- **Dynamic Messaging**:
  - Watch how messages change based on your interactions
  - Notice FOMO triggers and near-miss effects

- **Bet Confirmation Modal**:
  - When placing a bet, observe the confirmation modal
  - See how the bet breakdown shows the 80/20 split
  - After confirming, the modal should disappear automatically

## 🐞 Issue Resolution (Previously Fixed)

We've addressed several key issues to ensure a smooth experience:

1. **Bet Confirmation Modal**: Now automatically dismisses after bet confirmation
2. **Wallet Connection Simulation**: Works correctly when wallet is not connected
3. **Bridge Chat Responses**: Dynamic AI responses (not static fallbacks)
4. **Bet Processing Split**: Properly implements the 80/20 split (pot/creator)

## 💡 Tips for Testing

- Try refreshing the app to see how state persists and changes
- Test on mobile and desktop for responsive design
- Try varying amounts in both the betting and bridging interfaces
- Check the console logs for additional debug information

## 🔍 Technical Validation

For those interested in the technical implementation:

- The AI integration leverages OpenAI through custom services in `/app/services/`
- Bridge functionality is implemented in `universalBridgeService.ts` and `agentKitBridgeService.ts`
- The bet processing logic in `MoneyButton.tsx` implements the 80/20 split
- Responsive design works across device sizes

Thank you for testing our Money Button application! 