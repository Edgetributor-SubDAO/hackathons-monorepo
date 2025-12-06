export const bridgeVaultAbi = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [{ name: "stellarAddress", type: "string" }],
    outputs: [{ name: "depositId", type: "bytes32" }]
  },
  {
    type: "function",
    name: "feeBps",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint16" }]
  },
  {
    type: "function",
    name: "getQuote",
    stateMutability: "view",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [
      { name: "netAmount", type: "uint256" },
      { name: "feeAmount", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "Deposit",
    inputs: [
      { name: "sender", type: "address", indexed: true },
      { name: "amount", type: "uint256" },
      { name: "feeAmount", type: "uint256" },
      { name: "netAmount", type: "uint256" },
      { name: "stellarAddress", type: "string" },
      { name: "depositId", type: "bytes32", indexed: true }
    ]
  }
] as const;

