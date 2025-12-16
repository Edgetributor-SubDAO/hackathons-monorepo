import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';

import 'bridge_demo_service.dart';

/// =============================================================================
/// INSIDR BRIDGE DEMO PAGE
/// =============================================================================
///
/// Complete working demonstration of the Stellar ↔ Polkadot private bridge.
/// This page shows the full transfer flow with real-time status updates.
/// =============================================================================

class BridgeDemoPage extends StatefulWidget {
  const BridgeDemoPage({super.key});

  @override
  State<BridgeDemoPage> createState() => _BridgeDemoPageState();
}

class _BridgeDemoPageState extends State<BridgeDemoPage>
    with TickerProviderStateMixin {
  final BridgeDemoService _bridgeService = BridgeDemoService();

  // Form controllers
  final _amountController = TextEditingController(text: '100');
  final _senderController = TextEditingController(text: 'GABCD...WXYZ');
  final _recipientController = TextEditingController(
      text: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty');
  final _secretController = TextEditingController(text: 'my_secret_phrase');

  // State
  bool _isTransferring = false;
  DemoBridgeTransfer? _currentTransfer;
  StreamSubscription<DemoBridgeTransfer>? _transferSubscription;

  // Animation
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();

    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _transferSubscription = _bridgeService.transferStream.listen((transfer) {
      setState(() {
        _currentTransfer = transfer;
      });
    });
  }

  @override
  void dispose() {
    _amountController.dispose();
    _senderController.dispose();
    _recipientController.dispose();
    _secretController.dispose();
    _pulseController.dispose();
    _transferSubscription?.cancel();
    super.dispose();
  }

  Future<void> _executeTransfer() async {
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0) {
      _showError('Please enter a valid amount');
      return;
    }

    if (_secretController.text.isEmpty) {
      _showError('Please enter your secret phrase');
      return;
    }

    setState(() {
      _isTransferring = true;
      _currentTransfer = null;
    });

    try {
      // Convert XLM to stroops (1 XLM = 10^7 stroops)
      final amountStroops = BigInt.from((amount * 10000000).round());

      await _bridgeService.executePrivateTransfer(
        senderAddress: _senderController.text,
        amountInStroops: amountStroops,
        recipientAddress: _recipientController.text,
        senderSecret: _secretController.text,
      );

      if (mounted) {
        _showSuccessDialog();
      }
    } catch (e) {
      if (mounted) {
        _showError(e.toString());
      }
    } finally {
      if (mounted) {
        setState(() {
          _isTransferring = false;
        });
      }
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _showSuccessDialog() {
    final transfer = _currentTransfer;
    if (transfer == null) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1a1a2e),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check, color: Colors.green, size: 32),
            ),
            const SizedBox(width: 12),
            const Text(
              'Transfer Complete!',
              style: TextStyle(color: Colors.white),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildSuccessRow('Amount', '${transfer.amountXLM} XLM → wXLM'),
            _buildSuccessRow(
                'Recipient', _truncateAddress(transfer.recipientAddress)),
            const Divider(color: Colors.white24),
            _buildSuccessRow('Proof Time',
                '${transfer.proofGenerationTime?.inMilliseconds ?? 0}ms'),
            _buildSuccessRow(
                'Total Time', '${transfer.totalTransferTime?.inSeconds ?? 0}s'),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
              ),
              child: Column(
                children: [
                  const Icon(Icons.verified, color: Colors.green, size: 32),
                  const SizedBox(height: 8),
                  const Text(
                    'Privacy Preserved',
                    style: TextStyle(
                        color: Colors.green, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Amount hidden in commitment\nNo link between sender & recipient',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey[400], fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child:
                const Text('Close', style: TextStyle(color: Colors.deepPurple)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _viewTransferDetails();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.deepPurple,
            ),
            child: const Text('View Details'),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[400])),
          Text(value,
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  void _viewTransferDetails() {
    final transfer = _currentTransfer;
    if (transfer == null) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1a1a2e),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) =>
            _buildTransferDetailsSheet(transfer, scrollController),
      ),
    );
  }

  Widget _buildTransferDetailsSheet(
      DemoBridgeTransfer transfer, ScrollController scrollController) {
    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.all(20),
      children: [
        Center(
          child: Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[600],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),
        const SizedBox(height: 20),
        const Text(
          'Transfer Details',
          style: TextStyle(
              color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 20),

        // Transfer info
        _buildDetailCard('Transaction ID', transfer.id, icon: Icons.tag),
        _buildDetailCard('Amount', '${transfer.amountXLM} XLM',
            icon: Icons.monetization_on),
        if (transfer.commitment != null)
          _buildDetailCard('Commitment', transfer.commitment!,
              icon: Icons.lock, copyable: true),
        if (transfer.nullifier != null)
          _buildDetailCard('Nullifier', transfer.nullifier!,
              icon: Icons.fingerprint, copyable: true),
        if (transfer.stellarTxHash != null)
          _buildDetailCard('Stellar Tx', transfer.stellarTxHash!,
              icon: Icons.receipt_long, copyable: true),
        if (transfer.polkadotTxHash != null)
          _buildDetailCard('Polkadot Tx', transfer.polkadotTxHash!,
              icon: Icons.receipt, copyable: true),

        const SizedBox(height: 20),
        const Text(
          'Transfer Steps',
          style: TextStyle(
              color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),

        ...transfer.steps.map((step) => _buildStepItem(step)),
      ],
    );
  }

  Widget _buildDetailCard(String label, String value,
      {IconData? icon, bool copyable = false}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, color: Colors.deepPurple, size: 20),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(color: Colors.grey[400], fontSize: 12)),
                const SizedBox(height: 4),
                Text(
                  _truncateIfLong(value),
                  style: const TextStyle(
                      color: Colors.white, fontFamily: 'monospace'),
                ),
              ],
            ),
          ),
          if (copyable)
            IconButton(
              icon: const Icon(Icons.copy, color: Colors.grey, size: 18),
              onPressed: () {
                Clipboard.setData(ClipboardData(text: value));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Copied to clipboard')),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildStepItem(TransferStepLog step) {
    final color = step.isError ? Colors.red : Colors.green;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(
            step.isError ? Icons.error : Icons.check_circle,
            color: color,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(step.message, style: TextStyle(color: Colors.grey[300])),
                Text(
                  _formatTime(step.timestamp),
                  style: TextStyle(color: Colors.grey[600], fontSize: 10),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _truncateAddress(String address) {
    if (address.length <= 16) return address;
    return '${address.substring(0, 8)}...${address.substring(address.length - 8)}';
  }

  String _truncateIfLong(String value) {
    if (value.length <= 40) return value;
    return '${value.substring(0, 20)}...${value.substring(value.length - 16)}';
  }

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}:${time.second.toString().padLeft(2, '0')}.${time.millisecond.toString().padLeft(3, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f0f1a),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // App Bar
            SliverAppBar(
              expandedHeight: 120,
              floating: true,
              pinned: true,
              backgroundColor: const Color(0xFF1a1a2e),
              flexibleSpace: FlexibleSpaceBar(
                title: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.lock, size: 24, color: Colors.white),
                    SizedBox(width: 8),
                    Text('INSIDR',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Colors.deepPurple.shade900,
                        const Color(0xFF1a1a2e),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Content
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Header
                  _buildHeader(),
                  const SizedBox(height: 24),

                  // Chain Display
                  _buildChainDisplay(),
                  const SizedBox(height: 24),

                  // Transfer Form
                  _buildTransferForm(),
                  const SizedBox(height: 24),

                  // Live Status
                  if (_currentTransfer != null) ...[
                    _buildLiveStatus(),
                    const SizedBox(height: 24),
                  ],

                  // Balances
                  _buildBalancesCard(),
                  const SizedBox(height: 24),

                  // Info Card
                  _buildInfoCard(),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.deepPurple.shade800, Colors.deepPurple.shade600],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.privacy_tip, color: Colors.white, size: 28),
              SizedBox(width: 12),
              Text(
                'Private Cross-Chain Bridge',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Transfer assets privately between Stellar and Polkadot.\nZK proofs hide your amount and identity.',
            style: TextStyle(color: Colors.white.withValues(alpha: 0.8)),
          ),
        ],
      ),
    );
  }

  Widget _buildChainDisplay() {
    return Row(
      children: [
        Expanded(
            child: _buildChainCard('Stellar', 'XLM', Icons.star, Colors.blue)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) => Transform.scale(
              scale: _isTransferring ? _pulseAnimation.value : 1.0,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _isTransferring
                      ? Colors.deepPurple
                      : Colors.grey.shade800,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.arrow_forward,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ),
          ),
        ),
        Expanded(
            child: _buildChainCard(
                'Polkadot', 'wXLM', Icons.hexagon, Colors.pink)),
      ],
    );
  }

  Widget _buildChainCard(
      String name, String symbol, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1a1a2e),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 8),
          Text(
            name,
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold),
          ),
          Text(symbol, style: TextStyle(color: Colors.grey[400])),
        ],
      ),
    );
  }

  Widget _buildTransferForm() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1a1a2e),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Transfer Details',
            style: TextStyle(
                color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          // Amount
          _buildInputField(
            controller: _amountController,
            label: 'Amount (XLM)',
            icon: Icons.monetization_on,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 12),

          // Recipient
          _buildInputField(
            controller: _recipientController,
            label: 'Polkadot Recipient Address',
            icon: Icons.person,
          ),
          const SizedBox(height: 12),

          // Secret
          _buildInputField(
            controller: _secretController,
            label: 'Your Secret Phrase (for ZK proof)',
            icon: Icons.key,
            obscureText: true,
          ),
          const SizedBox(height: 20),

          // Transfer Button
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _isTransferring ? null : _executeTransfer,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.deepPurple,
                disabledBackgroundColor: Colors.grey.shade800,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: _isTransferring
                  ? const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(width: 12),
                        Text('Processing...', style: TextStyle(fontSize: 16)),
                      ],
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.send),
                        SizedBox(width: 8),
                        Text('Execute Private Transfer',
                            style: TextStyle(fontSize: 16)),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    bool obscureText = false,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.grey[400]),
        prefixIcon: Icon(icon, color: Colors.deepPurple),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.deepPurple),
        ),
      ),
    );
  }

  Widget _buildLiveStatus() {
    final transfer = _currentTransfer!;
    final isComplete = transfer.status == TransferStatus.completed;
    final isFailed = transfer.status == TransferStatus.failed;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1a1a2e),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isComplete
              ? Colors.green.withValues(alpha: 0.5)
              : isFailed
                  ? Colors.red.withValues(alpha: 0.5)
                  : Colors.deepPurple.withValues(alpha: 0.5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (isComplete)
                const Icon(Icons.check_circle, color: Colors.green)
              else if (isFailed)
                const Icon(Icons.error, color: Colors.red)
              else
                const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.deepPurple),
                ),
              const SizedBox(width: 12),
              Text(
                isComplete
                    ? 'Transfer Complete!'
                    : isFailed
                        ? 'Transfer Failed'
                        : 'Transfer in Progress...',
                style: TextStyle(
                  color: isComplete
                      ? Colors.green
                      : isFailed
                          ? Colors.red
                          : Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Progress steps
          ...transfer.steps.reversed.take(4).map((step) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Icon(
                      step.isError ? Icons.close : Icons.check,
                      color: step.isError ? Colors.red : Colors.green,
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        step.message,
                        style: TextStyle(
                          color: Colors.grey[400],
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              )),

          if (isComplete) ...[
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: _viewTransferDetails,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.green,
                side: const BorderSide(color: Colors.green),
              ),
              child: const Text('View Full Details'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildBalancesCard() {
    final recipientBalance =
        _bridgeService.getWrappedBalance(_recipientController.text);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1a1a2e),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Balances',
            style: TextStyle(
                color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildBalanceItem(
                  'wXLM Balance',
                  '${(recipientBalance.toDouble() / 10000000).toStringAsFixed(2)} wXLM',
                  Icons.account_balance_wallet,
                  Colors.pink,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildBalanceItem(
                  'Transfers',
                  '${_bridgeService.transferHistory.where((t) => t.status == TransferStatus.completed).length}',
                  Icons.swap_horiz,
                  Colors.blue,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBalanceItem(
      String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: color),
          const SizedBox(height: 8),
          Text(value,
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18)),
          Text(label, style: TextStyle(color: Colors.grey[400], fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.deepPurple.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.deepPurple.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.info_outline, color: Colors.deepPurple),
              SizedBox(width: 8),
              Text(
                'How It Works',
                style:
                    TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildInfoStep(
              '1', 'Lock XLM in Stellar escrow with hidden commitment'),
          _buildInfoStep(
              '2', 'Generate ZK proof on your device (proving knowledge)'),
          _buildInfoStep('3', 'Submit proof to Polkadot verifier'),
          _buildInfoStep(
              '4', 'Receive wXLM - no one can link sender to recipient!'),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              children: [
                Icon(Icons.verified_user, color: Colors.green, size: 20),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Your secret never leaves your device. Only the ZK proof is submitted on-chain.',
                    style: TextStyle(color: Colors.green, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoStep(String number, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: Colors.deepPurple.withValues(alpha: 0.3),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                number,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: TextStyle(color: Colors.grey[400], fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
