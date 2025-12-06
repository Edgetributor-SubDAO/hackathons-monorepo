// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BridgeVault
/// @notice Minimal custody contract that locks Base-side assets and emits
///         events consumed by an off-chain relayer. The contract never sends
///         funds out automatically; withdrawals are admin-only and happen
///         during manual rebalancing.
contract BridgeVault {
    error ZeroAmount();
    error InvalidAddress();
    error NotOwner();
    error WithdrawAmountTooLarge();
    error ContractPaused();

    event Deposit(
        address indexed sender,
        uint256 amount,
        uint256 feeAmount,
        uint256 netAmount,
        string polkadotAddress,
        bytes32 indexed depositId
    );

    event Withdraw(address indexed to, uint256 amount, address indexed caller);
    event FeeUpdated(uint16 oldFeeBps, uint16 newFeeBps);
    event Paused(address indexed caller);
    event Unpaused(address indexed caller);
    event OwnerTransferStarted(address indexed currentOwner, address indexed pendingOwner);
    event OwnerChanged(address indexed previousOwner, address indexed newOwner);

    uint16 public constant MAX_FEE_BPS = 500; // 5%
    uint16 public constant BPS_DENOMINATOR = 10_000;

    address public owner;
    address public pendingOwner;
    uint16 public feeBps = 100; // 1%
    bool public paused;

    uint256 private _nonce;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    constructor(address initialOwner, uint16 initialFeeBps) {
        address ownerToUse = initialOwner == address(0) ? msg.sender : initialOwner;
        owner = ownerToUse;
        if (initialFeeBps > MAX_FEE_BPS) revert InvalidAddress();
        feeBps = initialFeeBps;
    }

    receive() external payable {
        revert("Direct transfers not allowed");
    }

    /// @notice Locks ETH sent by the user and emits a Deposit event that the
    ///         off-chain relayer uses to fulfill the payout on Polkadot.
    /// @param polkadotAddress User-provided address on Polkadot/PASEO.
    /// @return depositId Unique identifier for the deposit event.
    function deposit(string calldata polkadotAddress) external payable whenNotPaused returns (bytes32 depositId) {
        if (msg.value == 0) revert ZeroAmount();
        if (bytes(polkadotAddress).length < 10) revert InvalidAddress();

        uint256 feeAmount = (msg.value * feeBps) / BPS_DENOMINATOR;
        uint256 netAmount = msg.value - feeAmount;

        depositId = keccak256(
            abi.encodePacked(block.chainid, msg.sender, msg.value, polkadotAddress, block.timestamp, _nonce)
        );

        _nonce++;

        emit Deposit(msg.sender, msg.value, feeAmount, netAmount, polkadotAddress, depositId);
    }

    /// @notice Withdraws ETH to the admin wallet during rebalancing.
    function withdraw(address payable to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        if (amount > address(this).balance) revert WithdrawAmountTooLarge();

        to.transfer(amount);
        emit Withdraw(to, amount, msg.sender);
    }

    function setFeeBps(uint16 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert InvalidAddress();
        uint16 old = feeBps;
        feeBps = newFeeBps;
        emit FeeUpdated(old, newFeeBps);
    }

    function pause() external onlyOwner {
        if (!paused) {
            paused = true;
            emit Paused(msg.sender);
        }
    }

    function unpause() external onlyOwner {
        if (paused) {
            paused = false;
            emit Unpaused(msg.sender);
        }
    }

    function startOwnershipTransfer(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        pendingOwner = newOwner;
        emit OwnerTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotOwner();
        address previousOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnerChanged(previousOwner, owner);
    }

    /// @notice Convenience view to let off-chain services quote payouts.
    function getQuote(uint256 amount) external view returns (uint256 netAmount, uint256 feeAmount) {
        feeAmount = (amount * feeBps) / BPS_DENOMINATOR;
        netAmount = amount - feeAmount;
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

