import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';

import 'package:convert/convert.dart';
import 'package:flutter/services.dart';
import 'package:mopro_flutter_bindings/mopro_flutter_bindings.dart';

/// PrivatePay Bridge Service
/// Handles cross-chain private transfers between Stellar and Polkadot
/// using mobile-generated ZK proofs
class BridgeService {
  // Singleton pattern
  static final BridgeService _instance = BridgeService._internal();
  factory BridgeService() => _instance;
  BridgeService._internal();

  // Chain identifiers
  static const int STELLAR_CHAIN_ID = 1;
  static const int POLKADOT_CHAIN_ID = 2;
  static const int ETHEREUM_CHAIN_ID = 3;

  // Bridge contract addresses (to be configured)
  String? _stellarEscrowContract;
  String? _polkadotVerifierContract;

  // Circuit paths
  String? _bridgeCircuitPath;
  String? _bridgeSrsPath;
  Uint8List? _bridgeVerificationKey;

  // Current transfer state
  BridgeTransfer? _currentTransfer;

  /// Initialize the bridge service with circuit assets
  Future<void> initialize({
    required String circuitPath,
    required String srsPath,
    required Uint8List verificationKey,
    String? stellarEscrowContract,
    String? polkadotVerifierContract,
  }) async {
    _bridgeCircuitPath = circuitPath;
    _bridgeSrsPath = srsPath;
    _bridgeVerificationKey = verificationKey;
    _stellarEscrowContract = stellarEscrowContract;
    _polkadotVerifierContract = polkadotVerifierContract;
  }

  /// Generate a commitment for a private transfer
  ///
  /// The commitment hides the transfer amount: commitment = H(amount || nonce)
  /// Only the mobile device knows the preimage (amount, nonce)
  Future<BridgeCommitment> generateCommitment({
    required BigInt amount,
    required String senderSecret,
  }) async {
    // Generate cryptographically secure random nonce
    final random = Random.secure();
    final nonceBytes = List<int>.generate(32, (_) => random.nextInt(256));
    final nonce = BigInt.parse(hex.encode(nonceBytes), radix: 16);

    // Convert sender secret to field element
    final senderSecretField = _stringToField(senderSecret);

    // Compute commitment = H(amount || nonce) using Poseidon
    // This is computed locally on the mobile device
    final commitmentInputs = [amount.toString(), nonce.toString()];

    // Use the Noir circuit to compute the commitment hash
    // In practice, we'd use a dedicated Poseidon hash function
    final commitment = await _computePoseidonHash(
      amount.toString(),
      nonce.toString(),
    );

    // Compute nullifier = H(commitment || sender_secret)
    final nullifier = await _computePoseidonHash(
      commitment,
      senderSecretField.toString(),
    );

    return BridgeCommitment(
      commitment: commitment,
      nullifier: nullifier,
      amount: amount,
      nonce: nonce,
      senderSecret: senderSecretField,
      timestamp: DateTime.now(),
    );
  }

  /// Generate a ZK proof for the bridge transfer
  ///
  /// This proves knowledge of the commitment preimage without revealing it
  Future<BridgeProof> generateBridgeProof({
    required BridgeCommitment commitment,
    required String recipientAddress,
    required int destinationChainId,
  }) async {
    if (_bridgeCircuitPath == null || _bridgeVerificationKey == null) {
      throw BridgeException('Bridge circuit not initialized');
    }

    // Compute recipient hash
    final recipientHash = await _computePoseidonHash(
      commitment.amount.toString(),
      commitment.commitment,
    );

    // Prepare circuit inputs
    // Private inputs: amount, nonce, sender_secret
    // Public inputs: commitment, nullifier, recipient_hash
    final inputs = {
      "amount": commitment.amount.toString(), // private: amount
      "nonce": commitment.nonce.toString(), // private: nonce
      "sender_secret":
          commitment.senderSecret.toString(), // private: sender_secret
      "commitment": commitment.commitment, // public: commitment
      "nullifier": commitment.nullifier, // public: nullifier
      "recipient_hash": recipientHash, // public: recipient_hash
    };

    final stopwatch = Stopwatch()..start();

    try {
      // Generate ZK proof using Mopro
      final proof = await generateNoirProof(
        circuitPath: _bridgeCircuitPath!,
        srsPath: _bridgeSrsPath!,
        inputs: inputs,
        onChain: true, // Use Keccak for cross-chain compatibility
        vk: _bridgeVerificationKey!,
        lowMemoryMode: false,
      );

      stopwatch.stop();

      return BridgeProof(
        proof: proof,
        commitment: commitment.commitment,
        nullifier: commitment.nullifier,
        recipientHash: recipientHash,
        destinationChainId: destinationChainId,
        recipientAddress: recipientAddress,
        generationTime: stopwatch.elapsed,
      );
    } catch (e) {
      stopwatch.stop();
      throw BridgeException('Failed to generate proof: $e');
    }
  }

  /// Verify a bridge proof locally before submitting
  Future<bool> verifyBridgeProofLocally(BridgeProof proof) async {
    if (_bridgeCircuitPath == null || _bridgeVerificationKey == null) {
      throw BridgeException('Bridge circuit not initialized');
    }

    try {
      return await verifyNoirProof(
        circuitPath: _bridgeCircuitPath!,
        proof: proof.proof,
        onChain: true,
        vk: _bridgeVerificationKey!,
        lowMemoryMode: false,
      );
    } catch (e) {
      throw BridgeException('Failed to verify proof locally: $e');
    }
  }

  /// Initiate a bridge transfer from Stellar to Polkadot
  ///
  /// Flow:
  /// 1. Lock funds on Stellar with commitment
  /// 2. Generate ZK proof on mobile
  /// 3. Submit proof to Polkadot for verification
  /// 4. Mint wrapped tokens on Polkadot
  Future<BridgeTransfer> initiateStellarToPolkadotTransfer({
    required BigInt amount,
    required String senderSecret,
    required String recipientAddress,
  }) async {
    // Step 1: Generate commitment
    final commitment = await generateCommitment(
      amount: amount,
      senderSecret: senderSecret,
    );

    // Step 2: Create transfer record
    final transfer = BridgeTransfer(
      id: _generateTransferId(),
      sourceChainId: STELLAR_CHAIN_ID,
      destinationChainId: POLKADOT_CHAIN_ID,
      amount: amount,
      commitment: commitment,
      recipientAddress: recipientAddress,
      status: BridgeTransferStatus.pending,
      createdAt: DateTime.now(),
    );

    _currentTransfer = transfer;

    // Step 3: Lock funds on Stellar (would call Stellar SDK)
    // await _lockFundsOnStellar(transfer);

    return transfer;
  }

  /// Complete a bridge transfer by generating and submitting the proof
  Future<BridgeTransfer> completeBridgeTransfer(BridgeTransfer transfer) async {
    if (transfer.commitment == null) {
      throw BridgeException('Transfer has no commitment');
    }

    // Step 1: Update status to proving
    transfer = transfer.copyWith(status: BridgeTransferStatus.proving);
    _currentTransfer = transfer;

    // Step 2: Generate ZK proof
    final proof = await generateBridgeProof(
      commitment: transfer.commitment!,
      recipientAddress: transfer.recipientAddress,
      destinationChainId: transfer.destinationChainId,
    );

    // Step 3: Verify locally first
    final isValid = await verifyBridgeProofLocally(proof);
    if (!isValid) {
      transfer = transfer.copyWith(
        status: BridgeTransferStatus.failed,
        errorMessage: 'Local proof verification failed',
      );
      _currentTransfer = transfer;
      throw BridgeException('Proof verification failed locally');
    }

    // Step 4: Update status to submitting
    transfer = transfer.copyWith(
      status: BridgeTransferStatus.submitting,
      proof: proof,
    );
    _currentTransfer = transfer;

    // Step 5: Submit proof to destination chain (would call Polkadot SDK)
    // await _submitProofToPolkadot(transfer);

    // Step 6: Update status to completed
    transfer = transfer.copyWith(
      status: BridgeTransferStatus.completed,
      completedAt: DateTime.now(),
    );
    _currentTransfer = transfer;

    return transfer;
  }

  /// Get the current transfer state
  BridgeTransfer? get currentTransfer => _currentTransfer;

  // === Private Helper Methods ===

  /// Compute Poseidon hash (placeholder - would use actual Poseidon implementation)
  Future<String> _computePoseidonHash(String a, String b) async {
    // In production, this would call the actual Poseidon hash function
    // from the Noir circuit or a native implementation

    // For now, use a simple hash as placeholder
    final input = '$a$b';
    final bytes = utf8.encode(input);

    // This is a placeholder - use actual Poseidon in production
    var hash = BigInt.zero;
    for (var i = 0; i < bytes.length; i++) {
      hash = (hash * BigInt.from(256) + BigInt.from(bytes[i])) % _fieldModulus;
    }

    return hash.toString();
  }

  /// Convert string to field element
  BigInt _stringToField(String input) {
    final bytes = utf8.encode(input);
    var result = BigInt.zero;
    for (var byte in bytes) {
      result = (result * BigInt.from(256) + BigInt.from(byte)) % _fieldModulus;
    }
    return result;
  }

  /// Generate unique transfer ID
  String _generateTransferId() {
    final random = Random.secure();
    final bytes = List<int>.generate(16, (_) => random.nextInt(256));
    return hex.encode(bytes);
  }

  // BN254 field modulus
  static final BigInt _fieldModulus = BigInt.parse(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617',
  );
}

/// Bridge commitment data
class BridgeCommitment {
  final String commitment; // H(amount || nonce)
  final String nullifier; // H(commitment || sender_secret)
  final BigInt amount;
  final BigInt nonce;
  final BigInt senderSecret;
  final DateTime timestamp;

  BridgeCommitment({
    required this.commitment,
    required this.nullifier,
    required this.amount,
    required this.nonce,
    required this.senderSecret,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'commitment': commitment,
        'nullifier': nullifier,
        'amount': amount.toString(),
        'timestamp': timestamp.toIso8601String(),
      };
}

/// Bridge proof data
class BridgeProof {
  final Uint8List proof;
  final String commitment;
  final String nullifier;
  final String recipientHash;
  final int destinationChainId;
  final String recipientAddress;
  final Duration generationTime;

  BridgeProof({
    required this.proof,
    required this.commitment,
    required this.nullifier,
    required this.recipientHash,
    required this.destinationChainId,
    required this.recipientAddress,
    required this.generationTime,
  });

  String get proofHex => hex.encode(proof);
}

/// Bridge transfer status
enum BridgeTransferStatus {
  pending, // Awaiting fund lock
  locked, // Funds locked on source chain
  proving, // Generating ZK proof
  submitting, // Submitting proof to destination
  completed, // Transfer completed
  failed, // Transfer failed
  refunded, // Funds refunded to sender
}

/// Bridge transfer record
class BridgeTransfer {
  final String id;
  final int sourceChainId;
  final int destinationChainId;
  final BigInt amount;
  final BridgeCommitment? commitment;
  final BridgeProof? proof;
  final String recipientAddress;
  final BridgeTransferStatus status;
  final DateTime createdAt;
  final DateTime? completedAt;
  final String? errorMessage;
  final String? sourceTxHash;
  final String? destinationTxHash;

  BridgeTransfer({
    required this.id,
    required this.sourceChainId,
    required this.destinationChainId,
    required this.amount,
    this.commitment,
    this.proof,
    required this.recipientAddress,
    required this.status,
    required this.createdAt,
    this.completedAt,
    this.errorMessage,
    this.sourceTxHash,
    this.destinationTxHash,
  });

  BridgeTransfer copyWith({
    String? id,
    int? sourceChainId,
    int? destinationChainId,
    BigInt? amount,
    BridgeCommitment? commitment,
    BridgeProof? proof,
    String? recipientAddress,
    BridgeTransferStatus? status,
    DateTime? createdAt,
    DateTime? completedAt,
    String? errorMessage,
    String? sourceTxHash,
    String? destinationTxHash,
  }) {
    return BridgeTransfer(
      id: id ?? this.id,
      sourceChainId: sourceChainId ?? this.sourceChainId,
      destinationChainId: destinationChainId ?? this.destinationChainId,
      amount: amount ?? this.amount,
      commitment: commitment ?? this.commitment,
      proof: proof ?? this.proof,
      recipientAddress: recipientAddress ?? this.recipientAddress,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      completedAt: completedAt ?? this.completedAt,
      errorMessage: errorMessage ?? this.errorMessage,
      sourceTxHash: sourceTxHash ?? this.sourceTxHash,
      destinationTxHash: destinationTxHash ?? this.destinationTxHash,
    );
  }

  String get statusText {
    switch (status) {
      case BridgeTransferStatus.pending:
        return 'Pending - Awaiting fund lock';
      case BridgeTransferStatus.locked:
        return 'Locked - Funds secured on source chain';
      case BridgeTransferStatus.proving:
        return 'Generating ZK proof...';
      case BridgeTransferStatus.submitting:
        return 'Submitting proof to destination chain...';
      case BridgeTransferStatus.completed:
        return 'Completed ✓';
      case BridgeTransferStatus.failed:
        return 'Failed - ${errorMessage ?? "Unknown error"}';
      case BridgeTransferStatus.refunded:
        return 'Refunded to sender';
    }
  }
}

/// Bridge exception
class BridgeException implements Exception {
  final String message;
  BridgeException(this.message);

  @override
  String toString() => 'BridgeException: $message';
}

/// Chain configuration
class ChainConfig {
  final int chainId;
  final String name;
  final String symbol;
  final String rpcUrl;
  final String explorerUrl;
  final String? bridgeContract;

  const ChainConfig({
    required this.chainId,
    required this.name,
    required this.symbol,
    required this.rpcUrl,
    required this.explorerUrl,
    this.bridgeContract,
  });

  static const stellar = ChainConfig(
    chainId: BridgeService.STELLAR_CHAIN_ID,
    name: 'Stellar',
    symbol: 'XLM',
    rpcUrl: 'https://horizon.stellar.org',
    explorerUrl: 'https://stellarchain.io',
  );

  static const polkadot = ChainConfig(
    chainId: BridgeService.POLKADOT_CHAIN_ID,
    name: 'Polkadot',
    symbol: 'DOT',
    rpcUrl: 'wss://rpc.polkadot.io',
    explorerUrl: 'https://polkadot.subscan.io',
  );
}
