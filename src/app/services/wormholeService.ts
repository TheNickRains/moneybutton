// This is a placeholder file for wormholeService which is imported by deprecated components
// It's kept only to avoid build errors

export const initiateTokenBridge = async (
  sourceChain: string,
  destinationChain: string,
  token: string,
  amount: string,
  recipient: string
) => {
  return {
    success: false,
    message: "This feature is deprecated",
    txHash: "0x0000000000000000000000000000000000000000000000000000000000000000"
  };
};

export default { initiateTokenBridge }; 