#!/usr/bin/env python3
"""
Backend API for Python Smart Contract IDE
Similar to Remix IDE but for Python contracts
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import subprocess
import threading
from web3 import Web3
from deploy_contract import extract_functions_from_python, compile_python_to_bytecode, deploy_contract
from interact import load_deployment

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

# Moonbase Alpha RPC
MOONBASE_ALPHA_RPC = "https://rpc.api.moonbase.moonbeam.network"

# Global state
deployment_status = {
    'status': 'idle',
    'message': '',
    'contract_address': None,
    'error': None
}

@app.route('/')
def index():
    """Serve the frontend"""
    return send_from_directory('frontend', 'index.html')

@app.route('/api/read-file', methods=['GET'])
def read_file():
    """Read main.py file"""
    try:
        if os.path.exists('main.py'):
            with open('main.py', 'r') as f:
                content = f.read()
            return jsonify({'success': True, 'content': content})
        else:
            return jsonify({'success': True, 'content': ''})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/save-file', methods=['POST'])
def save_file():
    """Save Python file"""
    try:
        data = request.json
        content = data.get('content', '')
        
        with open('main.py', 'w') as f:
            f.write(content)
        
        return jsonify({'success': True, 'message': 'File saved successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/get-functions', methods=['GET'])
def get_functions():
    """Extract functions from main.py"""
    try:
        if not os.path.exists('main.py'):
            return jsonify({'success': True, 'functions': []})
        
        functions = extract_functions_from_python('main.py')
        # Filter out main and __main__
        contract_functions = {
            name: info for name, info in functions.items() 
            if name not in ['main', '__main__']
        }
        
        func_list = []
        for name, info in contract_functions.items():
            func_list.append({
                'name': name,
                'args': info['args'],
                'arg_count': len(info['args'])
            })
        
        return jsonify({'success': True, 'functions': func_list})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/deploy', methods=['POST'])
def deploy():
    """Deploy the contract"""
    global deployment_status
    
    try:
        data = request.json
        private_key = data.get('private_key')
        
        if not private_key:
            return jsonify({'success': False, 'error': 'Private key is required'}), 400
        
        # Set environment variable
        os.environ['PRIVATE_KEY'] = private_key
        
        # Check if main.py exists
        if not os.path.exists('main.py'):
            return jsonify({'success': False, 'error': 'main.py not found'}), 400
        
        # Update status
        deployment_status['status'] = 'deploying'
        deployment_status['message'] = 'Reading main.py...'
        deployment_status['error'] = None
        
        # Extract functions
        functions = extract_functions_from_python('main.py')
        if not functions:
            deployment_status['status'] = 'error'
            deployment_status['error'] = 'No functions found in main.py'
            return jsonify({'success': False, 'error': 'No functions found in main.py'}), 400
        
        # Compile
        deployment_status['message'] = 'Compiling Python to blockchain bytecode...'
        python_bytecode = compile_python_to_bytecode(functions)
        
        # Connect to network
        deployment_status['message'] = 'Connecting to Moonbase Alpha...'
        web3 = Web3(Web3.HTTPProvider(MOONBASE_ALPHA_RPC))
        
        if not web3.is_connected():
            deployment_status['status'] = 'error'
            deployment_status['error'] = 'Failed to connect to network'
            return jsonify({'success': False, 'error': 'Failed to connect to network'}), 500
        
        # Get account
        account = web3.eth.account.from_key(private_key)
        balance = web3.eth.get_balance(account.address)
        
        if balance == 0:
            deployment_status['status'] = 'error'
            deployment_status['error'] = 'Insufficient balance. Get testnet tokens from https://faucet.moonbeam.network/'
            return jsonify({'success': False, 'error': 'Insufficient balance'}), 400
        
        # Deploy
        deployment_status['message'] = 'Deploying contract...'
        contract_address, abi = deploy_contract(web3, account, python_bytecode)
        
        # Save deployment info
        deployment_info = {
            'contract_address': contract_address,
            'abi': abi,
            'network': 'Moonbase Alpha',
            'rpc_url': MOONBASE_ALPHA_RPC
        }
        
        with open('deployment.json', 'w') as f:
            json.dump(deployment_info, f, indent=2)
        
        deployment_status['status'] = 'success'
        deployment_status['message'] = 'Deployment successful!'
        deployment_status['contract_address'] = contract_address
        
        return jsonify({
            'success': True,
            'contract_address': contract_address,
            'message': 'Contract deployed successfully'
        })
        
    except Exception as e:
        deployment_status['status'] = 'error'
        deployment_status['error'] = str(e)
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/deployment-status', methods=['GET'])
def deployment_status_endpoint():
    """Get deployment status"""
    return jsonify(deployment_status)

@app.route('/api/get-deployment', methods=['GET'])
def get_deployment():
    """Get deployment information"""
    try:
        contract_address, abi, rpc_url = load_deployment()
        if contract_address:
            # Parse ABI to extract function information
            functions_info = parse_abi_functions(abi)
            
            return jsonify({
                'success': True,
                'contract_address': contract_address,
                'abi': abi,
                'rpc_url': rpc_url,
                'functions': functions_info
            })
        else:
            return jsonify({'success': False, 'error': 'No deployment found'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def parse_abi_functions(abi):
    """Parse ABI to extract function information"""
    functions = {
        'state_changing': [],
        'view': []
    }
    
    for item in abi:
        if item.get('type') == 'function':
            func_info = {
                'name': item.get('name'),
                'inputs': item.get('inputs', []),
                'outputs': item.get('outputs', []),
                'stateMutability': item.get('stateMutability', 'nonpayable')
            }
            
            # Determine if it's a view function
            is_view = (
                func_info['stateMutability'] == 'view' or 
                func_info['stateMutability'] == 'pure' or
                func_info['name'].startswith('get')  # Helper functions
            )
            
            if is_view:
                functions['view'].append(func_info)
            else:
                functions['state_changing'].append(func_info)
    
    return functions

@app.route('/api/call-function', methods=['POST'])
def call_function():
    """Call a contract function (state-changing)"""
    try:
        data = request.json
        function_name = data.get('function_name')
        params = data.get('params', [])
        param_types = data.get('param_types', [])
        private_key = data.get('private_key')
        
        if not private_key:
            return jsonify({'success': False, 'error': 'Private key is required'}), 400
        
        # Load deployment
        contract_address, abi, rpc_url = load_deployment()
        if not contract_address:
            return jsonify({'success': False, 'error': 'Contract not deployed'}), 400
        
        # Connect to network
        web3 = Web3(Web3.HTTPProvider(rpc_url))
        if not web3.is_connected():
            return jsonify({'success': False, 'error': 'Failed to connect to network'}), 500
        
        # Create contract instance
        contract = web3.eth.contract(address=contract_address, abi=abi)
        
        # Get account
        account = web3.eth.account.from_key(private_key)
        
        # Convert params to appropriate types
        converted_params = convert_params(params, param_types)
        
        # Get fresh nonce
        nonce = web3.eth.get_transaction_count(account.address, 'pending')
        
        # Estimate gas
        try:
            gas_estimate = getattr(contract.functions, function_name)(*converted_params).estimate_gas({
                'from': account.address
            })
            gas_limit = int(gas_estimate * 1.2)
        except:
            gas_limit = 200000
        
        # Build transaction
        txn = getattr(contract.functions, function_name)(*converted_params).build_transaction({
            'from': account.address,
            'nonce': nonce,
            'gas': gas_limit,
            'gasPrice': web3.eth.gas_price,
            'chainId': web3.eth.chain_id
        })
        
        # Sign and send
        signed_txn = account.sign_transaction(txn)
        tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
        
        # Wait for receipt
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
        
        # Try to get result from getLastResult if it exists
        result = None
        try:
            result = contract.functions.getLastResult().call()
        except:
            pass
        
        return jsonify({
            'success': True,
            'tx_hash': tx_hash.hex(),
            'result': result,
            'message': 'Transaction confirmed!'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def convert_params(params, param_types):
    """Convert string parameters to appropriate types based on ABI types"""
    converted = []
    for param, param_type in zip(params, param_types):
        if 'int' in param_type:
            converted.append(int(param))
        elif 'uint' in param_type:
            converted.append(int(param))
        elif 'bool' in param_type:
            converted.append(param.lower() in ['true', '1', 'yes'])
        elif 'address' in param_type:
            converted.append(param)
        elif 'string' in param_type or 'bytes' in param_type:
            converted.append(str(param))
        else:
            # Default to int for unknown types
            try:
                converted.append(int(param))
            except:
                converted.append(param)
    return converted

@app.route('/api/view-function', methods=['POST'])
def view_function():
    """Call a view function (read-only)"""
    try:
        data = request.json
        function_name = data.get('function_name')
        params = data.get('params', [])
        param_types = data.get('param_types', [])
        
        # Load deployment
        contract_address, abi, rpc_url = load_deployment()
        if not contract_address:
            return jsonify({'success': False, 'error': 'Contract not deployed'}), 400
        
        # Connect to network
        web3 = Web3(Web3.HTTPProvider(rpc_url))
        if not web3.is_connected():
            return jsonify({'success': False, 'error': 'Failed to connect to network'}), 500
        
        # Create contract instance
        contract = web3.eth.contract(address=contract_address, abi=abi)
        
        # Convert params if provided
        if params and param_types:
            converted_params = convert_params(params, param_types)
            result = getattr(contract.functions, function_name)(*converted_params).call()
        else:
            result = getattr(contract.functions, function_name)().call()
        
        # Handle tuple results
        if isinstance(result, (list, tuple)) and len(result) == 1:
            result = result[0]
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    # Create frontend directory if it doesn't exist
    os.makedirs('frontend', exist_ok=True)
    
    print("=" * 60)
    print("🚀 Python Smart Contract IDE")
    print("=" * 60)
    print("\n📝 Open your browser to: http://localhost:5001")
    print("💡 Similar to Remix IDE but for Python contracts!")
    print("\n" + "=" * 60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5001)

