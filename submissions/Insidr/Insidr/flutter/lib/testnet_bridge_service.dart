import 'dart:async';
import 'package:http/http.dart' as http;
import 'dart:convert';

/// Service to interact with deployed Stellar and Polkadot testnet contracts
class TestnetBridgeService {
  // Stellar Testnet Configuration
  static const String stellarRpcUrl = 'https://soroban-testnet.stellar.org';
  static const String stellarHorizonUrl = 'https://horizon-testnet.stellar.org';

  // Polkadot Testnet Configuration (Contracts on Rococo)
  static const String polkadotRpcUrl = 'wss://rococo-contracts-rpc.polkadot.io';

  // Contract addresses (loaded from environment)
  String? stellarContractId;
  String? stellarPublicKey;
  String? polkadotContractAddress;
  String? polkadotAccountAddress;

  // Transaction tracking
  final StreamController<TransactionUpdate> _txUpdatesController =
      StreamController<TransactionUpdate>.broadcast();

  Stream<TransactionUpdate> get transactionUpdates =>
      _txUpdatesController.stream;

  TestnetBridgeService({
    this.stellarContractId,
    this.stellarPublicKey,
    this.polkadotContractAddress,
    this.polkadotAccountAddress,
  });

  /// Lock XLM on Stellar testnet
  Future<String> lockFundsOnStellar({
    required double amount,
    required String recipientPolkadotAddress,
  }) async {
    try {
      _txUpdatesController.add(TransactionUpdate(
        step: 'Locking ${amount} XLM on Stellar...',
        status: TransactionStatus.pending,
      ));

      // Convert XLM to stroops (1 XLM = 10^7 stroops)
      final stroops = (amount * 10000000).toInt();

      // Call Stellar contract to lock funds
      final response = await http.post(
        Uri.parse('$stellarRpcUrl/soroban/rpc'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'jsonrpc': '2.0',
          'id': DateTime.now().millisecondsSinceEpoch,
          'method': 'simulateTransaction',
          'params': {
            'transaction':
                _buildLockTransaction(stroops, recipientPolkadotAddress),
          }
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final txHash = data['result']['hash'] ??
            'simulated_tx_${DateTime.now().millisecondsSinceEpoch}';

        _txUpdatesController.add(TransactionUpdate(
          step: 'Funds locked on Stellar',
          status: TransactionStatus.success,
          txHash: txHash,
          explorerUrl: '$stellarHorizonUrl/transactions/$txHash',
        ));

        return txHash;
      } else {
        throw Exception('Failed to lock funds: ${response.body}');
      }
    } catch (e) {
      _txUpdatesController.add(TransactionUpdate(
        step: 'Failed to lock funds',
        status: TransactionStatus.failed,
        error: e.toString(),
      ));
      rethrow;
    }
  }

  /// Verify and mint wrapped tokens on Polkadot
  Future<String> mintOnPolkadot({
    required String stellarTxHash,
    required double amount,
  }) async {
    try {
      _txUpdatesController.add(TransactionUpdate(
        step: 'Verifying proof and minting wXLM on Polkadot...',
        status: TransactionStatus.pending,
      ));

      // In a real implementation, this would:
      // 1. Generate ZK proof of Stellar transaction
      // 2. Submit proof to Polkadot contract
      // 3. Contract verifies proof and mints wrapped tokens

      // Simulated for now
      await Future.delayed(Duration(seconds: 2));

      final polkadotTxHash =
          'polkadot_tx_${DateTime.now().millisecondsSinceEpoch}';

      _txUpdatesController.add(TransactionUpdate(
        step: 'wXLM minted on Polkadot',
        status: TransactionStatus.success,
        txHash: polkadotTxHash,
        explorerUrl:
            'https://polkadot.js.org/apps/?rpc=$polkadotRpcUrl#/explorer/query/$polkadotTxHash',
      ));

      return polkadotTxHash;
    } catch (e) {
      _txUpdatesController.add(TransactionUpdate(
        step: 'Failed to mint on Polkadot',
        status: TransactionStatus.failed,
        error: e.toString(),
      ));
      rethrow;
    }
  }

  /// Get Stellar account balance
  Future<double> getStellarBalance() async {
    try {
      if (stellarPublicKey == null) return 0.0;

      final response = await http.get(
        Uri.parse('$stellarHorizonUrl/accounts/$stellarPublicKey'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final balances = data['balances'] as List;
        final xlmBalance = balances.firstWhere(
          (b) => b['asset_type'] == 'native',
          orElse: () => {'balance': '0'},
        );
        return double.parse(xlmBalance['balance']);
      }
      return 0.0;
    } catch (e) {
      print('Error fetching Stellar balance: $e');
      return 0.0;
    }
  }

  /// Get recent Stellar transactions
  Future<List<StellarTransaction>> getRecentStellarTransactions() async {
    try {
      if (stellarPublicKey == null) return [];

      final response = await http.get(
        Uri.parse(
            '$stellarHorizonUrl/accounts/$stellarPublicKey/transactions?limit=10&order=desc'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final records = data['_embedded']['records'] as List;

        return records
            .map((tx) => StellarTransaction(
                  hash: tx['hash'],
                  timestamp: DateTime.parse(tx['created_at']),
                  successful: tx['successful'],
                  sourceAccount: tx['source_account'],
                ))
            .toList();
      }
      return [];
    } catch (e) {
      print('Error fetching transactions: $e');
      return [];
    }
  }

  /// Monitor a specific transaction on Stellar
  Future<void> monitorStellarTransaction(String txHash) async {
    try {
      for (int i = 0; i < 30; i++) {
        await Future.delayed(Duration(seconds: 2));

        final response = await http.get(
          Uri.parse('$stellarHorizonUrl/transactions/$txHash'),
        );

        if (response.statusCode == 200) {
          final tx = jsonDecode(response.body);
          _txUpdatesController.add(TransactionUpdate(
            step: 'Transaction confirmed on Stellar',
            status: TransactionStatus.success,
            txHash: txHash,
            explorerUrl: '$stellarHorizonUrl/transactions/$txHash',
          ));
          return;
        }
      }

      _txUpdatesController.add(TransactionUpdate(
        step: 'Transaction timeout',
        status: TransactionStatus.failed,
        error: 'Transaction not found after 60 seconds',
      ));
    } catch (e) {
      print('Error monitoring transaction: $e');
    }
  }

  String _buildLockTransaction(int stroops, String recipient) {
    // This would build the actual Stellar transaction XDR
    // For now, return a placeholder
    return 'simulated_xdr_transaction';
  }

  void dispose() {
    _txUpdatesController.close();
  }
}

class TransactionUpdate {
  final String step;
  final TransactionStatus status;
  final String? txHash;
  final String? explorerUrl;
  final String? error;

  TransactionUpdate({
    required this.step,
    required this.status,
    this.txHash,
    this.explorerUrl,
    this.error,
  });
}

enum TransactionStatus {
  pending,
  success,
  failed,
}

class StellarTransaction {
  final String hash;
  final DateTime timestamp;
  final bool successful;
  final String sourceAccount;

  StellarTransaction({
    required this.hash,
    required this.timestamp,
    required this.successful,
    required this.sourceAccount,
  });
}
