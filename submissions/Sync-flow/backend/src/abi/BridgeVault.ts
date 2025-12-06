export const BridgeVaultAbi = [
  "event Deposit(address indexed sender,uint256 amount,uint256 feeAmount,uint256 netAmount,string polkadotAddress,bytes32 indexed depositId)",
  "function feeBps() view returns (uint16)",
  "function getQuote(uint256 amount) view returns (uint256 netAmount,uint256 feeAmount)",
  "function contractBalance() view returns (uint256)"
] as const;

