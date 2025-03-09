# Deprecated Services

This directory contains services that were previously used in the Money Button application but have been consolidated or refactored. These files are kept for reference but are no longer actively used in the application.

## File Overview

- `aiService.ts` - Original AI service for generating messages, replaced by langchainService and userMemoryService
- `aiWormholeAgent.ts` - Agent for Wormhole bridge operations, functionality consolidated into universalBridgeService
- `bridgeAgent.ts` - Service for cross-chain bridge operations, functionality consolidated into universalBridgeService
- `enhancedAiService.ts` - Enhanced AI service with user memory, replaced by userMemoryService
- `wormholeBridge.ts` - Wormhole bridge implementation, functionality consolidated into universalBridgeService
- `wormholeService.ts` - Wormhole service for interacting with the Wormhole protocol, functionality consolidated into universalBridgeService

## Current Implementation

The current implementation uses:

- `universalBridgeService.ts` for all bridge operations
- `langchainService.ts` for AI message generation and processing
- `userMemoryService.ts` for managing user interaction history and personalized responses

If you need to reference these deprecated services for understanding the previous implementation, please refer to the appropriate files in this directory. 