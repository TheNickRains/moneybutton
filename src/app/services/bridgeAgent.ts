// This is a placeholder file for bridgeAgent which is imported by deprecated components
// It's kept only to avoid build errors

export const aiWormholeAgentAPI = {
  processBridgeRequest: async () => {
    return { success: false, message: "This feature is deprecated" };
  },
  getBridgePath: async () => {
    return { path: [], fees: "N/A", time: "N/A" };
  },
  checkTransactionStatus: async () => {
    return { status: "error", message: "This feature is deprecated" };
  },
  connectWallet: async (chain: string) => {
    return "0x0000000000000000000000000000000000000000"; // Dummy wallet address
  },
  bridgeTokenToMantle: async (sourceChain: string, token: string, amount: string, wallet: string) => {
    return { 
      success: true, 
      txHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      estimatedTime: "10-15 minutes",
      error: "" // Add the error property even if it's empty
    };
  }
};

export default { aiWormholeAgentAPI }; 