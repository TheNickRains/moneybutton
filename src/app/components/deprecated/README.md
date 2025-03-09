# Deprecated Components

This directory contains UI components that were previously used in the Money Button application but have been refactored or replaced. These files are kept for reference but are no longer actively used in the application.

## Component Overview

- `AgentBridge.tsx` - Original monolithic implementation of the bridge assistant, refactored into smaller components
- `AIWormholeAgentDialog.tsx` - Dialog for interacting with the Wormhole agent, functionality consolidated into the AgentBridge component structure

## Current Implementation

The current implementation uses:

- `AgentBridge/index.tsx` as the main component that coordinates between smaller, focused components
- `AgentBridge/components/` contains smaller UI components with specific responsibilities
- `AgentBridge/hooks/` contains custom hooks that manage state and logic for the bridge assistant

The refactored implementation follows clean code principles and helps make the codebase more maintainable and testable.

If you need to reference these deprecated components for understanding the previous implementation, please refer to the appropriate files in this directory. 