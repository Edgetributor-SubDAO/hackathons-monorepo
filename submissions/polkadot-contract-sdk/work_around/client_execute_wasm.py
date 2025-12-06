#!/usr/bin/env python3
"""
Client-side WASM execution
Fetch WASM from IPFS and execute Python functions
"""

import json
import os
import requests
from web3 import Web3

def fetch_from_ipfs(ipfs_hash, local_file=None):
    """Fetch file from IPFS, with fallback to local file"""
    # Check if it's a mock hash
    if ipfs_hash.startswith('QmMock') or ipfs_hash.startswith('QmLocal') or len(ipfs_hash) < 46:
        print("⚠️  Mock/Local IPFS hash detected, using local file...")
        if local_file:
            # Check if it's a .wasm file
            if local_file.endswith('.wasm') and os.path.exists(local_file):
                return local_file  # Return path to binary WASM file
            elif os.path.exists(local_file):
                # Try to load as JSON (fallback)
                with open(local_file, 'r') as f:
                    return json.load(f)
        raise Exception("Mock hash and no local file found. Please deploy with real IPFS service.")
    
    # Try multiple IPFS gateways
    gateways = [
        f"https://ipfs.io/ipfs/{ipfs_hash}",
        f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}",
        f"https://cloudflare-ipfs.com/ipfs/{ipfs_hash}",
        f"https://dweb.link/ipfs/{ipfs_hash}"
    ]
    
    for gateway in gateways:
        try:
            print(f"   Trying {gateway}...")
            response = requests.get(gateway, timeout=10)
            if response.status_code == 200:
                # Check if it's binary WASM (starts with WASM magic)
                if response.content[:4] == b'\x00asm':
                    # Save as .wasm file
                    wasm_file = 'downloaded_contract.wasm'
                    with open(wasm_file, 'wb') as f:
                        f.write(response.content)
                    print(f"✅ Downloaded binary WASM file: {wasm_file}")
                    return wasm_file
                else:
                    # Try JSON
                    try:
                        return response.json()
                    except:
                        return response.text
        except Exception as e:
            continue
    
    # Fallback to local file if IPFS fetch fails
    if local_file and os.path.exists(local_file):
        print("⚠️  IPFS fetch failed, using local file as fallback...")
        if local_file.endswith('.wasm'):
            return local_file  # Return path to binary WASM
        with open(local_file, 'r') as f:
            return json.load(f)
    
    raise Exception("Could not fetch from IPFS and no local file available")

def execute_python_wasm(wasm_data, function_name, args):
    """
    Execute Python function from WASM binary or package
    """
    # Check if it's a binary WASM file path
    if isinstance(wasm_data, str) and wasm_data.endswith('.wasm'):
        return execute_binary_wasm(wasm_data, function_name, args)
    
    # Handle JSON package format (fallback)
    if isinstance(wasm_data, dict):
        code = wasm_data.get('code', '')
        functions = wasm_data.get('functions', [])
        
        available_functions = [f for f in functions if f not in ['main', '__main__']]
        
        if function_name not in available_functions:
            raise Exception(f"Function '{function_name}' not found. Available: {', '.join(available_functions)}")
        
        namespace = {}
        try:
            exec(code, namespace)
        except Exception as e:
            raise Exception(f"Error executing code: {e}")
        
        func = namespace.get(function_name)
        if func:
            try:
                return func(*args)
            except Exception as e:
                raise Exception(f"Error executing {function_name}: {e}")
        else:
            raise Exception(f"Function '{function_name}' not found in executed code")
    
    raise Exception("Invalid WASM data format")

def execute_binary_wasm(wasm_file_path, function_name, args):
    """
    Execute function from binary WASM file
    Extracts Python code from WASM custom sections and executes it
    """
    import struct
    
    with open(wasm_file_path, 'rb') as f:
        wasm_data = f.read()
    
    # Verify WASM magic number
    if wasm_data[:4] != b'\x00asm':
        raise Exception("Invalid WASM file format")
    
    # Extract Python code from custom section
    python_code = None
    functions = []
    
    # Simple parser to find custom sections
    pos = 8  # Skip magic + version
    while pos < len(wasm_data):
        if pos + 1 >= len(wasm_data):
            break
        
        section_id = wasm_data[pos]
        pos += 1
        
        # Read section size (simplified - assumes 4 bytes)
        if pos + 4 > len(wasm_data):
            break
        section_size = struct.unpack('<I', wasm_data[pos:pos+4])[0]
        pos += 4
        
        if section_id == 0:  # Custom section
            # Read section name length
            if pos >= len(wasm_data):
                break
            name_len = wasm_data[pos]
            pos += 1
            
            # Read section name
            if pos + name_len > len(wasm_data):
                break
            section_name = wasm_data[pos:pos+name_len].decode('utf-8', errors='ignore')
            pos += name_len
            
            # Read section data
            if section_name == 'python_code':
                if pos + 4 > len(wasm_data):
                    break
                code_len = struct.unpack('<I', wasm_data[pos:pos+4])[0]
                pos += 4
                if pos + code_len <= len(wasm_data):
                    python_code = wasm_data[pos:pos+code_len].decode('utf-8')
                    pos += code_len
            elif section_name == 'functions':
                if pos + 4 > len(wasm_data):
                    break
                func_json_len = struct.unpack('<I', wasm_data[pos:pos+4])[0]
                pos += 4
                if pos + func_json_len <= len(wasm_data):
                    func_json = wasm_data[pos:pos+func_json_len].decode('utf-8')
                    functions_data = json.loads(func_json)
                    functions = functions_data.get('functions', [])
                    pos += func_json_len
        else:
            # Skip other sections
            pos += section_size
    
    if not python_code:
        raise Exception("Python code not found in WASM file")
    
    # Execute Python code
    available_functions = [f for f in functions if f not in ['main', '__main__']]
    
    if function_name not in available_functions:
        raise Exception(f"Function '{function_name}' not found. Available: {', '.join(available_functions)}")
    
    namespace = {}
    try:
        exec(python_code, namespace)
    except Exception as e:
        raise Exception(f"Error executing code: {e}")
    
    func = namespace.get(function_name)
    if func:
        try:
            return func(*args)
        except Exception as e:
            raise Exception(f"Error executing {function_name}: {e}")
    else:
        raise Exception(f"Function '{function_name}' not found in executed code")

def main():
    # Load deployment info
    with open('deployment.json', 'r') as f:
        deployment = json.load(f)
    
    if deployment.get('deployment_type') != 'wasm-ipfs':
        print("❌ This deployment is not WASM-IPFS type")
        return
    
    ipfs_hash = deployment['ipfs_hash']
    contract_address = deployment['contract_address']
    wasm_file = deployment.get('wasm_file', 'contract.wasm.json')
    
    print("=" * 60)
    print("🔌 Execute Python WASM from IPFS")
    print("=" * 60)
    print(f"\n📍 Contract: {contract_address}")
    print(f"🔗 IPFS Hash: {ipfs_hash}")
    print(f"📄 Local WASM: {wasm_file}")
    
    # Fetch WASM from IPFS (with local fallback)
    print("\n📥 Fetching WASM from IPFS...")
    try:
        wasm_data = fetch_from_ipfs(ipfs_hash, local_file=wasm_file)
        print("✅ WASM loaded successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n💡 Tip: Set up IPFS service (Pinata or web3.storage) for real IPFS upload")
        print("   Or use the local WASM file directly")
        return
    
    # Execute function
    print("\n" + "=" * 60)
    function_name = input("Enter function name: ").strip()
    
    # Get arguments
    args_input = input("Enter arguments (comma-separated): ").strip()
    args = [int(x.strip()) for x in args_input.split(',') if x.strip()]
    
    print(f"\n🚀 Executing {function_name}({', '.join(map(str, args))})...")
    
    try:
        result = execute_python_wasm(wasm_data, function_name, args)
        print(f"✅ Result: {result}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()

