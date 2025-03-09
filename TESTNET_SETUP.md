# Money Button Testnet Setup Guide

This guide will help you set up and run the Money Button application with the AI-powered bridge on testnet environments for development and testing purposes.

## Prerequisites

- Node.js 18+ installed
- Git
- MetaMask or another compatible wallet
- Test ETH and other tokens on various testnets

## Setup Instructions

1. **Clone the Repository**

```bash
git clone https://github.com/thenickrains/moneybutton.fun.git
cd moneybutton.fun/moneybutton
```

2. **Install Dependencies**

```bash
npm install
```

3. **Configure Environment Variables**

Create a `.env.local` file with the following configurations or use the existing one:

```
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_WORMHOLE_RPC_URL=https://api.testnet.wormholescan.io
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.testnet.mantle.xyz
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://rpc.sepolia.org
NEXT_PUBLIC_POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
NEXT_PUBLIC_ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_OPTIMISM_RPC_URL=https://sepolia.optimism.io
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org

# Wormhole Testnet Configuration
NEXT_PUBLIC_WORMHOLE_TESTNET_ENABLED=true
```

Replace `your_openai_api_key_here` with your actual OpenAI API key if you want to use the AI features. If you don't have one, the application will fall back to static responses.

4. **Run in Testnet Mode**

```bash
npm run dev:testnet
```

This will start the development server with testnet configuration enabled.

5. **Access the Application**

Open your browser and navigate to:

```
http://localhost:3000
```

## Testnet Wallet Setup

For testing the bridge functionality, you'll need to have test tokens on various testnets:

### Ethereum Sepolia

1. Get Sepolia ETH from a faucet:
   - [Sepolia Faucet](https://sepoliafaucet.com/)
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

2. Get Sepolia USDC:
   - [Circle USDC Faucet](https://faucet.circle.com/)

### Mantle Testnet

1. Get Mantle Testnet MNT:
   - [Mantle Testnet Faucet](https://faucet.testnet.mantle.xyz/)

2. Set up Mantle Testnet in MetaMask:
   - Network Name: `Mantle Testnet`
   - RPC URL: `https://rpc.testnet.mantle.xyz`
   - Chain ID: `5001`
   - Currency Symbol: `MNT`
   - Block Explorer URL: `https://explorer.testnet.mantle.xyz`

### Other Testnets

For other testnets (Polygon Amoy, Arbitrum Sepolia, etc.), follow similar steps to obtain test tokens and configure your wallet.

## Testing the Bridge

1. Open the Money Button application
2. Click on the Bridge button in the UI
3. Connect your wallet (make sure it's configured for testnets)
4. Select a source chain (e.g., Ethereum Sepolia)
5. Select a token (e.g., ETH or USDC)
6. Enter an amount to bridge
7. Follow the prompts to approve and execute the bridge transaction

## Debugging

The NLM Agent Bridge includes a special debug mode. To activate it:

1. Open the bridge interface
2. Type "debug" in the chat box and press Enter
3. The system will display detailed information about the current testnet configuration

## Note on Test Tokens

The test tokens used in the application are simulated for development purposes. No real value is transferred during testnet operations. The application will clearly indicate when you're in testnet mode.

## Troubleshooting

If you encounter issues:

- Ensure your wallet is connected to the correct testnet
- Verify you have sufficient test tokens
- Check the console for error messages
- Try refreshing the page
- If using AI features, check that your OpenAI API key is valid and has sufficient quota

For more help, open an issue in the GitHub repository. 