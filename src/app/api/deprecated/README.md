# Deprecated API Routes

This directory contains API routes that were previously used in the Money Button application but have been consolidated or refactored. These files are kept for reference but are no longer actively used in the application.

## Route Overview

- `ai-message/` - Original AI message generation API, functionality moved to LangChain implementation
- `ai-wormhole-agent/` - Agent API for Wormhole bridge operations, functionality consolidated into the main bridge API
- `bridgeAgent.js` - Bridge agent implementation for the bridge API, functionality consolidated into universalBridgeService

## Current Implementation

The current implementation uses:

- `bridge/route.ts` with universalBridgeService for all bridge operations
- Direct calls to langchainService from components, reducing unnecessary API hops

If you need to reference these deprecated API routes for understanding the previous implementation, please refer to the appropriate files in this directory. 