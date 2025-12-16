import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';

import 'package:convert/convert.dart';

/// =============================================================================
/// INSIDR BRIDGE DEMO SERVICE
/// =============================================================================
///
/// A complete working demonstration of the private cross-chain bridge.
/// This version BYPASSES actual ZK proof generation for demo purposes,
/// but simulates the complete flow:
///
/// 1. Lock funds on source chain (Stellar)
/// 2. Generate commitment (hash hiding the amount)
/// 3. Simulate ZK proof generation
/// 4. Verify proof on destination chain (Polkadot)
/// 5. Mint wrapped tokens to recipient
///
/// In production, step 3 would use actual Mopro/Barretenberg proof generation.
/// =============================================================================

class BridgeDemoService {
  // Singleton
  static final BridgeDemoService _instance = BridgeDemoService._internal();
  factory BridgeDemoService() => _instance;
  BridgeDemoService._internal();

  // === Chain Configuration ===
  static const int STELLAR_CHAIN_ID = 1;
  static const int POLKADOT_CHAIN_ID = 2;

  // === Simulated Blockchain State ===

  // Stellar Escrow: commitment => locked amount
  final Map<String, LockedFunds> _stellarEscrow = {};

  // Polkadot Verifier: used nullifiers (prevent double-spend)
  final Set<String> _usedNullifiers = {};

  // Polkadot Wrapped Token: address => balance
  final Map<String, BigInt> _wrappedTokenBalances = {};

  // Transfer history
  final List<DemoBridgeTransfer> _transferHistory = [];

  // Stream for UI updates
  final _transferStreamController =
      StreamController<DemoBridgeTransfer>.broadcast();
  Stream<DemoBridgeTransfer> get transferStream =>
      _transferStreamController.stream;

  // === PUBLIC API ===

  /// Execute a complete bridge transfer from Stellar to Polkadot
  ///
  /// This demonstrates the full flow:
  /// 1. Lock XLM on Stellar escrow contract
  /// 2. Generate commitment (hides amount)
  /// 3. Generate ZK proof (bypassed in demo)
  /// 4. Submit proof to Polkadot
  /// 5. Mint wXLM to recipient
  Future<DemoBridgeTransfer> executePrivateTransfer({
    required String senderAddress,
    required BigInt amountInStroops, // 1 XLM = 10^7 stroops
    required String recipientAddress,
    required String senderSecret,
    Function(TransferStep)? onStepUpdate,
  }) async {
    final transferId = _generateTransferId();
    final startTime = DateTime.now();

    // Create initial transfer record
    var transfer = DemoBridgeTransfer(
      id: transferId,
      senderAddress: senderAddress,
      recipientAddress: recipientAddress,
      amountStroops: amountInStroops,
      status: TransferStatus.initiated,
      createdAt: startTime,
      steps: [],
    );

    _transferHistory.add(transfer);
    _notifyUpdate(transfer);

    try {
      // =========================================================
      // STEP 1: LOCK FUNDS ON STELLAR
      // =========================================================
      onStepUpdate?.call(TransferStep.lockingFunds);
      transfer = transfer.addStep(TransferStepLog(
        step: TransferStep.lockingFunds,
        message:
            'Locking ${_formatXLM(amountInStroops)} XLM on Stellar escrow...',
        timestamp: DateTime.now(),
      ));
      _notifyUpdate(transfer);

      // Simulate network delay
      await Future.delayed(const Duration(milliseconds: 1500));

      // Generate commitment: H(amount || nonce || secret)
      final nonce = _generateSecureNonce();
      final commitment =
          _computeCommitment(amountInStroops, nonce, senderSecret);
      final nullifier = _computeNullifier(commitment, senderSecret);

      // Lock funds in escrow
      final stellarTxHash = _simulateStellarTransaction();
      _stellarEscrow[commitment] = LockedFunds(
        commitment: commitment,
        amountStroops: amountInStroops,
        sender: senderAddress,
        lockTime: DateTime.now(),
        txHash: stellarTxHash,
      );

      transfer = transfer
          .copyWith(
            status: TransferStatus.fundsLocked,
            commitment: commitment,
            nullifier: nullifier,
            stellarTxHash: stellarTxHash,
          )
          .addStep(TransferStepLog(
            step: TransferStep.fundsLocked,
            message: '✓ Funds locked! Tx: ${_truncateHash(stellarTxHash)}',
            timestamp: DateTime.now(),
            txHash: stellarTxHash,
          ));
      _notifyUpdate(transfer);

      // =========================================================
      // STEP 2: GENERATE COMMITMENT PROOF
      // =========================================================
      onStepUpdate?.call(TransferStep.generatingCommitment);
      transfer = transfer.addStep(TransferStepLog(
        step: TransferStep.generatingCommitment,
        message: 'Generating cryptographic commitment...',
        timestamp: DateTime.now(),
      ));
      _notifyUpdate(transfer);

      await Future.delayed(const Duration(milliseconds: 800));

      transfer = transfer.addStep(TransferStepLog(
        step: TransferStep.commitmentGenerated,
        message: '✓ Commitment: ${_truncateHash(commitment)}',
        timestamp: DateTime.now(),
      ));
      _notifyUpdate(transfer);

      // =========================================================
      // STEP 3: GENERATE ZK PROOF (BYPASSED IN DEMO)
      // =========================================================
      onStepUpdate?.call(TransferStep.generatingProof);
      transfer = transfer.copyWith(status: TransferStatus.provingKnowledge);
      transfer = transfer.addStep(TransferStepLog(
        step: TransferStep.generatingProof,
        message: '🔐 Generating ZK proof on device...',
        timestamp: DateTime.now(),
      ));
      _notifyUpdate(transfer);

      // Simulate proof generation time (real would be 3-5 seconds)
      await Future.delayed(const Duration(milliseconds: 2500));

      // Generate simulated proof (in production: Mopro/Barretenberg)
      final proof = _generateSimulatedProof(
        commitment: commitment,
        nullifier: nullifier,
        recipientAddress: recipientAddress,
        amount: amountInStroops,
      );

      final proofTime = DateTime.now().difference(startTime);

      transfer = transfer
          .copyWith(
            proof: proof,
            proofGenerationTime: proofTime,
          )
          .addStep(TransferStepLog(
            step: TransferStep.proofGenerated,
            message: '✓ ZK Proof generated (${proofTime.inMilliseconds}ms)',
            timestamp: DateTime.now(),
            data: {'proofSize': '${proof.proofBytes.length} bytes'},
          ));
      _notifyUpdate(transfer);

      // =========================================================
      // STEP 4: VERIFY PROOF ON POLKADOT
      // =========================================================
      onStepUpdate?.call(TransferStep.verifyingProof);
      transfer = transfer.copyWith(status: TransferStatus.verifyingOnChain);
      transfer = transfer.addStep(TransferStepLog(
        step: TransferStep.verifyingProof,
        message: 'Submitting proof to Polkadot verifier...',
        timestamp: DateTime.now(),
      ));
      _notifyUpdate(transfer);

      await Future.delayed(const Duration(milliseconds: 1200));

      // Check if nullifier already used (prevent double-spend)
      if (_usedNullifiers.contains(nullifier)) {
        throw BridgeDemoException(
            'Nullifier already used - possible double-spend attempt');
      }

      // Verify the proof (in demo: always valid if properly formed)
      final isValid = _verifyProof(proof, commitment, nullifier);
      if (!isValid) {
        throw BridgeDemoException('Proof verification failed on Polkadot');
      }

      // Mark nullifier as used
      _usedNullifiers.add(nullifier);

      transfer = transfer.addStep(TransferStepLog(
        step: TransferStep.proofVerified,
        message: '✓ Proof verified on Polkadot!',
        timestamp: DateTime.now(),
      ));
      _notifyUpdate(transfer);

      // =========================================================
      // STEP 5: MINT WRAPPED TOKENS
      // =========================================================
      onStepUpdate?.call(TransferStep.mintingTokens);
      transfer = transfer.copyWith(status: TransferStatus.mintingTokens);
      transfer = transfer.addStep(TransferStepLog(
        step: TransferStep.mintingTokens,
        message: 'Minting wXLM to recipient...',
        timestamp: DateTime.now(),
      ));
      _notifyUpdate(transfer);

      await Future.delayed(const Duration(milliseconds: 1000));

      // Mint wrapped XLM to recipient
      final polkadotTxHash = _simulatePolkadotTransaction();
      _mintWrappedTokens(recipientAddress, amountInStroops);

      transfer = transfer
          .copyWith(
            status: TransferStatus.completed,
            polkadotTxHash: polkadotTxHash,
            completedAt: DateTime.now(),
          )
          .addStep(TransferStepLog(
            step: TransferStep.tokensMinited,
            message:
                '✓ Minted ${_formatXLM(amountInStroops)} wXLM to recipient!',
            timestamp: DateTime.now(),
            txHash: polkadotTxHash,
          ));
      _notifyUpdate(transfer);

      // =========================================================
      // COMPLETE!
      // =========================================================
      final totalTime = DateTime.now().difference(startTime);
      transfer = transfer
          .copyWith(
            totalTransferTime: totalTime,
          )
          .addStep(TransferStepLog(
            step: TransferStep.completed,
            message:
                '🎉 Transfer complete! Total time: ${totalTime.inSeconds}s',
            timestamp: DateTime.now(),
          ));
      _notifyUpdate(transfer);

      return transfer;
    } catch (e) {
      transfer = transfer
          .copyWith(
            status: TransferStatus.failed,
            errorMessage: e.toString(),
          )
          .addStep(TransferStepLog(
            step: TransferStep.failed,
            message: '❌ Transfer failed: $e',
            timestamp: DateTime.now(),
            isError: true,
          ));
      _notifyUpdate(transfer);
      rethrow;
    }
  }

  /// Get the wrapped token balance for an address
  BigInt getWrappedBalance(String address) {
    return _wrappedTokenBalances[address] ?? BigInt.zero;
  }

  /// Get all transfers
  List<DemoBridgeTransfer> get transferHistory =>
      List.unmodifiable(_transferHistory);

  /// Get locked funds in Stellar escrow
  List<LockedFunds> get lockedFunds => _stellarEscrow.values.toList();

  /// Reset demo state
  void reset() {
    _stellarEscrow.clear();
    _usedNullifiers.clear();
    _wrappedTokenBalances.clear();
    _transferHistory.clear();
  }

  // === PRIVATE HELPERS ===

  void _notifyUpdate(DemoBridgeTransfer transfer) {
    _transferStreamController.add(transfer);
    // Update in history
    final idx = _transferHistory.indexWhere((t) => t.id == transfer.id);
    if (idx >= 0) {
      _transferHistory[idx] = transfer;
    }
  }

  String _generateTransferId() {
    final random = Random.secure();
    final bytes = List<int>.generate(16, (_) => random.nextInt(256));
    return hex.encode(bytes);
  }

  BigInt _generateSecureNonce() {
    final random = Random.secure();
    final bytes = List<int>.generate(32, (_) => random.nextInt(256));
    return BigInt.parse(hex.encode(bytes), radix: 16);
  }

  /// Compute commitment = H(amount || nonce || secret)
  /// Uses simplified hash for demo (real: Poseidon)
  String _computeCommitment(BigInt amount, BigInt nonce, String secret) {
    final input = '${amount.toString()}|${nonce.toString()}|$secret';
    final bytes = utf8.encode(input);

    // Simple polynomial rolling hash (demo only - use Poseidon in production)
    var hash = BigInt.zero;
    final prime = BigInt.parse(
        '21888242871839275222246405745257275088548364400416034343698204186575808495617');
    for (var i = 0; i < bytes.length; i++) {
      hash = (hash * BigInt.from(256) + BigInt.from(bytes[i])) % prime;
    }

    return '0x${hash.toRadixString(16).padLeft(64, '0')}';
  }

  /// Compute nullifier = H(commitment || secret)
  String _computeNullifier(String commitment, String secret) {
    final input = '$commitment|$secret';
    final bytes = utf8.encode(input);

    var hash = BigInt.zero;
    final prime = BigInt.parse(
        '21888242871839275222246405745257275088548364400416034343698204186575808495617');
    for (var i = 0; i < bytes.length; i++) {
      hash = (hash * BigInt.from(257) + BigInt.from(bytes[i])) % prime;
    }

    return '0x${hash.toRadixString(16).padLeft(64, '0')}';
  }

  /// Generate simulated ZK proof
  /// In production: This calls Mopro/Barretenberg
  DemoProof _generateSimulatedProof({
    required String commitment,
    required String nullifier,
    required String recipientAddress,
    required BigInt amount,
  }) {
    final random = Random.secure();

    // Simulated proof structure (256 bytes like a real Barretenberg proof)
    final proofBytes = Uint8List(256);
    for (var i = 0; i < proofBytes.length; i++) {
      proofBytes[i] = random.nextInt(256);
    }

    // Embed verification data (in real proof, this is cryptographically bound)
    final commitmentBytes = utf8.encode(commitment);
    for (var i = 0; i < min(32, commitmentBytes.length); i++) {
      proofBytes[i] = commitmentBytes[i];
    }

    return DemoProof(
      proofBytes: proofBytes,
      commitment: commitment,
      nullifier: nullifier,
      recipientHash: _computeAddressHash(recipientAddress),
      publicInputs: [
        commitment,
        nullifier,
        _computeAddressHash(recipientAddress),
      ],
    );
  }

  String _computeAddressHash(String address) {
    final bytes = utf8.encode(address);
    var hash = BigInt.zero;
    for (var b in bytes) {
      hash = (hash * BigInt.from(31) + BigInt.from(b));
    }
    return '0x${(hash % BigInt.from(2).pow(256)).toRadixString(16).padLeft(64, '0')}';
  }

  /// Verify proof (demo: check structure and nullifier)
  bool _verifyProof(DemoProof proof, String commitment, String nullifier) {
    // In production: Call actual ZK verifier
    // Demo: Check that proof contains correct commitment
    return proof.commitment == commitment && proof.nullifier == nullifier;
  }

  /// Mint wrapped tokens
  void _mintWrappedTokens(String recipient, BigInt amount) {
    final current = _wrappedTokenBalances[recipient] ?? BigInt.zero;
    _wrappedTokenBalances[recipient] = current + amount;
  }

  /// Simulate Stellar transaction hash
  String _simulateStellarTransaction() {
    final random = Random.secure();
    final bytes = List<int>.generate(32, (_) => random.nextInt(256));
    return hex.encode(bytes);
  }

  /// Simulate Polkadot transaction hash
  String _simulatePolkadotTransaction() {
    final random = Random.secure();
    final bytes = List<int>.generate(32, (_) => random.nextInt(256));
    return '0x${hex.encode(bytes)}';
  }

  String _formatXLM(BigInt stroops) {
    final xlm = stroops / BigInt.from(10000000);
    return xlm.toStringAsFixed(7).replaceAll(RegExp(r'\.?0+$'), '');
  }

  String _truncateHash(String hash) {
    if (hash.length <= 16) return hash;
    return '${hash.substring(0, 10)}...${hash.substring(hash.length - 6)}';
  }

  void dispose() {
    _transferStreamController.close();
  }
}

// === DATA MODELS ===

enum TransferStatus {
  initiated,
  fundsLocked,
  provingKnowledge,
  verifyingOnChain,
  mintingTokens,
  completed,
  failed,
}

enum TransferStep {
  lockingFunds,
  fundsLocked,
  generatingCommitment,
  commitmentGenerated,
  generatingProof,
  proofGenerated,
  verifyingProof,
  proofVerified,
  mintingTokens,
  tokensMinited,
  completed,
  failed,
}

class TransferStepLog {
  final TransferStep step;
  final String message;
  final DateTime timestamp;
  final String? txHash;
  final Map<String, dynamic>? data;
  final bool isError;

  TransferStepLog({
    required this.step,
    required this.message,
    required this.timestamp,
    this.txHash,
    this.data,
    this.isError = false,
  });
}

class DemoBridgeTransfer {
  final String id;
  final String senderAddress;
  final String recipientAddress;
  final BigInt amountStroops;
  final TransferStatus status;
  final DateTime createdAt;
  final DateTime? completedAt;
  final String? commitment;
  final String? nullifier;
  final DemoProof? proof;
  final String? stellarTxHash;
  final String? polkadotTxHash;
  final Duration? proofGenerationTime;
  final Duration? totalTransferTime;
  final String? errorMessage;
  final List<TransferStepLog> steps;

  DemoBridgeTransfer({
    required this.id,
    required this.senderAddress,
    required this.recipientAddress,
    required this.amountStroops,
    required this.status,
    required this.createdAt,
    this.completedAt,
    this.commitment,
    this.nullifier,
    this.proof,
    this.stellarTxHash,
    this.polkadotTxHash,
    this.proofGenerationTime,
    this.totalTransferTime,
    this.errorMessage,
    required this.steps,
  });

  DemoBridgeTransfer copyWith({
    String? id,
    String? senderAddress,
    String? recipientAddress,
    BigInt? amountStroops,
    TransferStatus? status,
    DateTime? createdAt,
    DateTime? completedAt,
    String? commitment,
    String? nullifier,
    DemoProof? proof,
    String? stellarTxHash,
    String? polkadotTxHash,
    Duration? proofGenerationTime,
    Duration? totalTransferTime,
    String? errorMessage,
    List<TransferStepLog>? steps,
  }) {
    return DemoBridgeTransfer(
      id: id ?? this.id,
      senderAddress: senderAddress ?? this.senderAddress,
      recipientAddress: recipientAddress ?? this.recipientAddress,
      amountStroops: amountStroops ?? this.amountStroops,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      completedAt: completedAt ?? this.completedAt,
      commitment: commitment ?? this.commitment,
      nullifier: nullifier ?? this.nullifier,
      proof: proof ?? this.proof,
      stellarTxHash: stellarTxHash ?? this.stellarTxHash,
      polkadotTxHash: polkadotTxHash ?? this.polkadotTxHash,
      proofGenerationTime: proofGenerationTime ?? this.proofGenerationTime,
      totalTransferTime: totalTransferTime ?? this.totalTransferTime,
      errorMessage: errorMessage ?? this.errorMessage,
      steps: steps ?? this.steps,
    );
  }

  DemoBridgeTransfer addStep(TransferStepLog step) {
    return copyWith(steps: [...steps, step]);
  }

  double get amountXLM => amountStroops.toDouble() / 10000000;
}

class DemoProof {
  final Uint8List proofBytes;
  final String commitment;
  final String nullifier;
  final String recipientHash;
  final List<String> publicInputs;

  DemoProof({
    required this.proofBytes,
    required this.commitment,
    required this.nullifier,
    required this.recipientHash,
    required this.publicInputs,
  });

  String get proofHex => hex.encode(proofBytes);
}

class LockedFunds {
  final String commitment;
  final BigInt amountStroops;
  final String sender;
  final DateTime lockTime;
  final String txHash;

  LockedFunds({
    required this.commitment,
    required this.amountStroops,
    required this.sender,
    required this.lockTime,
    required this.txHash,
  });

  double get amountXLM => amountStroops.toDouble() / 10000000;
}

class BridgeDemoException implements Exception {
  final String message;
  BridgeDemoException(this.message);

  @override
  String toString() => message;
}
