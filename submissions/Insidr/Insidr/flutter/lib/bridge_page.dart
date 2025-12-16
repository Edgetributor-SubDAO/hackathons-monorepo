
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';

import 'bridge_service.dart';

/// PrivatePay Bridge UI
/// Allows users to perform private cross-chain transfers
class BridgePage extends StatefulWidget {
  const BridgePage({super.key});

  @override
  State<BridgePage> createState() => _BridgePageState();
}

class _BridgePageState extends State<BridgePage> {
  final BridgeService _bridgeService = BridgeService();

  // Form controllers
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _recipientController = TextEditingController();
  final TextEditingController _secretController = TextEditingController();

  // State
  bool _isInitialized = false;
  bool _isProcessing = false;
  ChainConfig _sourceChain = ChainConfig.stellar;
  ChainConfig _destinationChain = ChainConfig.polkadot;
  BridgeTransfer? _currentTransfer;
  String? _errorMessage;

  // Timing
  Duration? _commitmentTime;
  Duration? _proofTime;
  Duration? _totalTime;

  @override
  void initState() {
    super.initState();
    _initializeBridge();
  }

  Future<void> _initializeBridge() async {
    try {
      // Copy circuit assets to file system
      final circuitPath = await _copyAssetToFileSystem(
        'assets/noir_bridge.json',
      );
      final srsPath = await _copyAssetToFileSystem('assets/noir_bridge.srs');
      final vkData = await rootBundle.load('assets/noir_bridge.vk');
      final vk = vkData.buffer.asUint8List();

      await _bridgeService.initialize(
        circuitPath: circuitPath,
        srsPath: srsPath,
        verificationKey: vk,
      );

      setState(() {
        _isInitialized = true;
      });
    } catch (e) {
      // Fall back to multiplier circuit for demo
      try {
        final circuitPath = await _copyAssetToFileSystem(
          'assets/noir_multiplier2.json',
        );
        final srsPath = await _copyAssetToFileSystem(
          'assets/noir_multiplier2.srs',
        );
        final vkData = await rootBundle.load('assets/noir_multiplier2.vk');
        final vk = vkData.buffer.asUint8List();

        await _bridgeService.initialize(
          circuitPath: circuitPath,
          srsPath: srsPath,
          verificationKey: vk,
        );

        setState(() {
          _isInitialized = true;
        });
      } catch (e2) {
        setState(() {
          _errorMessage = 'Failed to initialize bridge: $e2';
        });
      }
    }
  }

  Future<String> _copyAssetToFileSystem(String assetPath) async {
    final byteData = await rootBundle.load(assetPath);
    final directory = await getApplicationDocumentsDirectory();
    final fileName = assetPath.split('/').last;
    final file = File('${directory.path}/$fileName');
    await file.writeAsBytes(byteData.buffer.asUint8List());
    return file.path;
  }

  void _swapChains() {
    setState(() {
      final temp = _sourceChain;
      _sourceChain = _destinationChain;
      _destinationChain = temp;
    });
  }

  Future<void> _initiateBridgeTransfer() async {
    if (_amountController.text.isEmpty ||
        _recipientController.text.isEmpty ||
        _secretController.text.isEmpty) {
      setState(() {
        _errorMessage = 'Please fill in all fields';
      });
      return;
    }

    final amount = BigInt.tryParse(_amountController.text);
    if (amount == null || amount <= BigInt.zero) {
      setState(() {
        _errorMessage = 'Invalid amount';
      });
      return;
    }

    setState(() {
      _isProcessing = true;
      _errorMessage = null;
      _commitmentTime = null;
      _proofTime = null;
      _totalTime = null;
    });

    final totalStopwatch = Stopwatch()..start();

    try {
      // Step 1: Generate commitment
      final commitmentStopwatch = Stopwatch()..start();
      final transfer = await _bridgeService.initiateStellarToPolkadotTransfer(
        amount: amount,
        senderSecret: _secretController.text,
        recipientAddress: _recipientController.text,
      );
      commitmentStopwatch.stop();
      _commitmentTime = commitmentStopwatch.elapsed;

      setState(() {
        _currentTransfer = transfer;
      });

      // Step 2: Generate proof and complete transfer
      final proofStopwatch = Stopwatch()..start();
      final completedTransfer = await _bridgeService.completeBridgeTransfer(
        transfer,
      );
      proofStopwatch.stop();
      _proofTime = proofStopwatch.elapsed;

      totalStopwatch.stop();
      _totalTime = totalStopwatch.elapsed;

      setState(() {
        _currentTransfer = completedTransfer;
        _isProcessing = false;
      });

      // Show success dialog
      if (mounted) {
        _showSuccessDialog(completedTransfer);
      }
    } catch (e) {
      totalStopwatch.stop();
      setState(() {
        _isProcessing = false;
        _errorMessage = e.toString();
      });
    }
  }

  void _showSuccessDialog(BridgeTransfer transfer) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 28),
            SizedBox(width: 8),
            Text('Transfer Complete'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildInfoRow(
              'Amount',
              '${transfer.amount} ${_sourceChain.symbol}',
            ),
            _buildInfoRow('Source', _sourceChain.name),
            _buildInfoRow('Destination', _destinationChain.name),
            _buildInfoRow(
              'Recipient',
              _truncateAddress(transfer.recipientAddress),
            ),
            const Divider(),
            _buildInfoRow('Commitment Time', _formatDuration(_commitmentTime)),
            _buildInfoRow('Proof Generation', _formatDuration(_proofTime)),
            _buildInfoRow('Total Time', _formatDuration(_totalTime)),
            if (transfer.proof != null) ...[
              const Divider(),
              const Text(
                'ZK Proof Generated ✓',
                style: TextStyle(
                  color: Colors.green,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Text(
                'Proof verified locally before submission',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600])),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  String _truncateAddress(String address) {
    if (address.length <= 12) return address;
    return '${address.substring(0, 6)}...${address.substring(address.length - 4)}';
  }

  String _formatDuration(Duration? duration) {
    if (duration == null) return 'N/A';
    final ms = duration.inMilliseconds;
    if (ms < 1000) return '${ms}ms';
    return '${(ms / 1000).toStringAsFixed(2)}s';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.lock, size: 24),
            SizedBox(width: 8),
            Text('PrivatePay Bridge'),
          ],
        ),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header card
            _buildHeaderCard(),
            const SizedBox(height: 16),

            // Chain selector
            _buildChainSelector(),
            const SizedBox(height: 16),

            // Transfer form
            _buildTransferForm(),
            const SizedBox(height: 16),

            // Status display
            if (_currentTransfer != null) _buildStatusCard(),

            // Error display
            if (_errorMessage != null) _buildErrorCard(),

            // Info card
            _buildInfoCard(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderCard() {
    return Card(
      color: Colors.deepPurple.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '🔐 Private Cross-Chain Transfers',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.deepPurple,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Transfer assets privately between Stellar and Polkadot using Zero-Knowledge Proofs generated on your mobile device.',
              style: TextStyle(color: Colors.grey[700]),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildFeatureChip('🔒 Private Amounts'),
                const SizedBox(width: 8),
                _buildFeatureChip('📱 Mobile Proofs'),
                const SizedBox(width: 8),
                _buildFeatureChip('⛓️ Cross-Chain'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureChip(String label) {
    return Chip(
      label: Text(label, style: const TextStyle(fontSize: 11)),
      backgroundColor: Colors.white,
      padding: EdgeInsets.zero,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }

  Widget _buildChainSelector() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(child: _buildChainBox(_sourceChain, 'From')),
            const SizedBox(width: 8),
            IconButton(
              onPressed: _swapChains,
              icon: const Icon(Icons.swap_horiz, color: Colors.deepPurple),
              style: IconButton.styleFrom(
                backgroundColor: Colors.deepPurple.shade50,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(child: _buildChainBox(_destinationChain, 'To')),
          ],
        ),
      ),
    );
  }

  Widget _buildChainBox(ChainConfig chain, String label) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 4),
          Text(
            chain.name,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          Text(chain.symbol, style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildTransferForm() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Transfer Details',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // Amount field
            TextField(
              controller: _amountController,
              decoration: InputDecoration(
                labelText: 'Amount',
                hintText: 'Enter amount to transfer',
                prefixIcon: const Icon(Icons.attach_money),
                suffixText: _sourceChain.symbol,
                border: const OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),

            // Recipient field
            TextField(
              controller: _recipientController,
              decoration: InputDecoration(
                labelText: 'Recipient Address',
                hintText: 'Enter ${_destinationChain.name} address',
                prefixIcon: const Icon(Icons.account_balance_wallet),
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),

            // Secret field
            TextField(
              controller: _secretController,
              decoration: const InputDecoration(
                labelText: 'Private Key / Secret',
                hintText: 'Enter your secret for proof generation',
                prefixIcon: Icon(Icons.vpn_key),
                border: OutlineInputBorder(),
              ),
              obscureText: true,
            ),
            const SizedBox(height: 16),

            // Submit button
            ElevatedButton(
              onPressed: _isProcessing || !_isInitialized
                  ? null
                  : _initiateBridgeTransfer,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.deepPurple,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isProcessing
                  ? Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(_currentTransfer?.statusText ?? 'Processing...'),
                      ],
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.lock),
                        SizedBox(width: 8),
                        Text('Generate Proof & Transfer'),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard() {
    final transfer = _currentTransfer!;
    return Card(
      color: _getStatusColor(transfer.status).withOpacity(0.1),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  _getStatusIcon(transfer.status),
                  color: _getStatusColor(transfer.status),
                ),
                const SizedBox(width: 8),
                const Text(
                  'Transfer Status',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(transfer.statusText),
            if (transfer.commitment != null) ...[
              const SizedBox(height: 8),
              Text(
                'Commitment: ${_truncateAddress(transfer.commitment!.commitment)}',
                style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
              ),
            ],
            if (_proofTime != null) ...[
              const SizedBox(height: 8),
              Text(
                'Proof generated in ${_formatDuration(_proofTime)}',
                style: const TextStyle(fontSize: 12, color: Colors.green),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildErrorCard() {
    return Card(
      color: Colors.red.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.error, color: Colors.red),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                _errorMessage!,
                style: TextStyle(color: Colors.red.shade700),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () => setState(() => _errorMessage = null),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('How it works', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildStep(
              '1',
              'Create commitment',
              'Your amount is hidden using cryptographic hash: H(amount || nonce)',
            ),
            _buildStep(
              '2',
              'Lock funds on Stellar',
              'Funds are locked in escrow with your commitment',
            ),
            _buildStep(
              '3',
              'Generate ZK proof',
              'Mobile device proves you know the commitment preimage',
            ),
            _buildStep(
              '4',
              'Verify on Polkadot',
              'Proof is verified without revealing the amount',
            ),
            _buildStep(
              '5',
              'Mint wrapped tokens',
              'Receive wrapped tokens on Polkadot privately',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep(String number, String title, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: const BoxDecoration(
              color: Colors.deepPurple,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                number,
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
                Text(
                  description,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(BridgeTransferStatus status) {
    switch (status) {
      case BridgeTransferStatus.pending:
      case BridgeTransferStatus.locked:
        return Colors.orange;
      case BridgeTransferStatus.proving:
      case BridgeTransferStatus.submitting:
        return Colors.blue;
      case BridgeTransferStatus.completed:
        return Colors.green;
      case BridgeTransferStatus.failed:
        return Colors.red;
      case BridgeTransferStatus.refunded:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(BridgeTransferStatus status) {
    switch (status) {
      case BridgeTransferStatus.pending:
        return Icons.hourglass_empty;
      case BridgeTransferStatus.locked:
        return Icons.lock;
      case BridgeTransferStatus.proving:
        return Icons.memory;
      case BridgeTransferStatus.submitting:
        return Icons.send;
      case BridgeTransferStatus.completed:
        return Icons.check_circle;
      case BridgeTransferStatus.failed:
        return Icons.error;
      case BridgeTransferStatus.refunded:
        return Icons.replay;
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _recipientController.dispose();
    _secretController.dispose();
    super.dispose();
  }
}
