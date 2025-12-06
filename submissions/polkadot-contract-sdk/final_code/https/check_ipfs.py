#!/usr/bin/env python3
"""
IPFS Hash Inspector
Check IPFS hash content, view it, and track related information
"""

import os
import json
import sys
import subprocess
import requests
from datetime import datetime
from pathlib import Path

def view_ipfs_content(ipfs_hash):
    """View content from IPFS using various gateways"""
    print("=" * 60)
    print(f"🔍 Inspecting IPFS Hash: {ipfs_hash}")
    print("=" * 60)
    print()
    
    # Try multiple IPFS gateways
    gateways = [
        ("IPFS.io", f"https://ipfs.io/ipfs/{ipfs_hash}"),
        ("Pinata", f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"),
        ("Cloudflare", f"https://cloudflare-ipfs.com/ipfs/{ipfs_hash}"),
        ("dweb.link", f"https://dweb.link/ipfs/{ipfs_hash}"),
    ]
    
    print("📡 Trying IPFS gateways...")
    content = None
    working_gateway = None
    
    for name, url in gateways:
        try:
            print(f"   Trying {name}...", end=" ")
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                content = response.content
                working_gateway = name
                print("✅ Success!")
                break
            else:
                print(f"❌ Failed ({response.status_code})")
        except Exception as e:
            print(f"❌ Error: {str(e)[:50]}")
    
    if not content:
        print("\n❌ Could not fetch from any IPFS gateway")
        return None
    
    print(f"\n✅ Content retrieved from {working_gateway}")
    print(f"📦 Content size: {len(content)} bytes")
    print(f"📄 Content type: ", end="")
    
    # Check if it's WASM
    if content[:4] == b'\x00asm':
        print("WASM binary file")
        print(f"\n💡 This is a WASM file. You can:")
        print(f"   - Download it: curl {gateways[0][1]} -o contract.wasm")
        print(f"   - View in browser: {gateways[0][1]}")
    elif content[:2] == b'{' or content[:2] == b'[':
        try:
            json_data = json.loads(content)
            print("JSON file")
            print("\n📋 JSON Content:")
            print(json.dumps(json_data, indent=2))
        except:
            print("Text/JSON (parse failed)")
            print(f"\n📄 First 500 characters:")
            print(content[:500].decode('utf-8', errors='ignore'))
    else:
        print("Binary/Other")
        print(f"\n📄 First 200 bytes (hex):")
        print(content[:200].hex())
    
    return content

def check_local_ipfs_node(ipfs_hash):
    """Check if local IPFS node has the content"""
    try:
        result = subprocess.run(
            ['ipfs', 'cat', ipfs_hash],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            print("✅ Local IPFS node has the content")
            return result.stdout
        else:
            print("⚠️  Local IPFS node doesn't have the content")
            print("   Run: ipfs pin add " + ipfs_hash)
    except FileNotFoundError:
        print("⚠️  IPFS CLI not installed")
        print("   Install: brew install ipfs")
    except Exception as e:
        print(f"⚠️  Error checking local node: {e}")
    return None

def find_hash_in_deployments(ipfs_hash):
    """Find IPFS hash in deployment files"""
    print("\n" + "=" * 60)
    print("📁 Checking deployment files...")
    print("=" * 60)
    
    deployment_files = []
    
    # Search in current directory and parent
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file == 'deployment.json':
                deployment_files.append(os.path.join(root, file))
    
    # Also check parent directory
    parent_deployment = os.path.join('..', 'deployment.json')
    if os.path.exists(parent_deployment):
        deployment_files.append(parent_deployment)
    
    found = False
    for deploy_file in deployment_files:
        try:
            with open(deploy_file, 'r') as f:
                deployment = json.load(f)
                if deployment.get('ipfs_hash') == ipfs_hash:
                    found = True
                    print(f"\n✅ Found in: {deploy_file}")
                    print(f"   Contract Address: {deployment.get('contract_address', 'N/A')}")
                    print(f"   Network: {deployment.get('network', 'N/A')}")
                    print(f"   WASM File: {deployment.get('wasm_file', 'N/A')}")
                    print(f"   Deployment Type: {deployment.get('deployment_type', 'N/A')}")
                    
                    # Check file modification time
                    mtime = os.path.getmtime(deploy_file)
                    mod_time = datetime.fromtimestamp(mtime)
                    print(f"   Last Modified: {mod_time.strftime('%Y-%m-%d %H:%M:%S')}")
        except Exception as e:
            continue
    
    if not found:
        print(f"\n⚠️  Hash not found in any deployment.json files")
        print(f"   Searched: {len(deployment_files)} file(s)")

def check_blockchain_events(ipfs_hash, deployment_file='deployment.json'):
    """Check blockchain for events related to this IPFS hash"""
    if not os.path.exists(deployment_file):
        return
    
    try:
        from web3 import Web3
        
        with open(deployment_file, 'r') as f:
            deployment = json.load(f)
        
        contract_address = deployment.get('contract_address')
        rpc_url = deployment.get('rpc_url')
        
        if not contract_address or contract_address == "0x0000000000000000000000000000000000000000":
            print("\n⚠️  No valid contract address in deployment.json")
            return
        
        if not rpc_url:
            print("\n⚠️  No RPC URL in deployment.json")
            return
        
        print("\n" + "=" * 60)
        print("⛓️  Checking blockchain...")
        print("=" * 60)
        
        web3 = Web3(Web3.HTTPProvider(rpc_url))
        if not web3.is_connected():
            print("❌ Could not connect to blockchain")
            return
        
        abi = deployment.get('abi', [])
        contract = web3.eth.contract(address=contract_address, abi=abi)
        
        # Get IPFS hash from contract
        try:
            contract_ipfs_hash = contract.functions.getIPFSHash().call()
            print(f"\n📍 Contract Address: {contract_address}")
            print(f"🔗 IPFS Hash on-chain: {contract_ipfs_hash}")
            
            if contract_ipfs_hash == ipfs_hash:
                print("✅ Hash matches!")
            else:
                print(f"⚠️  Hash mismatch! Contract has: {contract_ipfs_hash}")
        except Exception as e:
            print(f"⚠️  Could not read from contract: {e}")
        
        # Try to get recent events
        try:
            # Get block range (last 1000 blocks)
            latest_block = web3.eth.block_number
            from_block = max(0, latest_block - 1000)
            
            print(f"\n📊 Checking events (blocks {from_block} to {latest_block})...")
            
            # Get all events
            events = contract.events.all_events().get_logs(fromBlock=from_block)
            if events:
                print(f"✅ Found {len(events)} event(s)")
                for i, event in enumerate(events[-5:], 1):  # Show last 5
                    print(f"\n   Event {i}:")
                    print(f"   - Block: {event.blockNumber}")
                    print(f"   - Transaction: {event.transactionHash.hex()}")
                    print(f"   - Event: {event.event}")
            else:
                print("   No events found in recent blocks")
        except Exception as e:
            print(f"⚠️  Could not fetch events: {e}")
            
    except ImportError:
        print("\n⚠️  web3 not installed. Install with: pip install web3")
    except Exception as e:
        print(f"\n⚠️  Error checking blockchain: {e}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python check_ipfs.py <IPFS_HASH> [deployment.json]")
        print("\nExample:")
        print("  python check_ipfs.py QmSHSPxNYeAQqZnRbtUcVzCgvQvXjJo3PGzwHAYodGd4i2")
        sys.exit(1)
    
    ipfs_hash = sys.argv[1]
    deployment_file = sys.argv[2] if len(sys.argv) > 2 else 'deployment.json'
    
    # View IPFS content
    content = view_ipfs_content(ipfs_hash)
    
    # Check local IPFS node
    print("\n" + "=" * 60)
    print("💻 Checking local IPFS node...")
    print("=" * 60)
    check_local_ipfs_node(ipfs_hash)
    
    # Find in deployment files
    find_hash_in_deployments(ipfs_hash)
    
    # Check blockchain
    if os.path.exists(deployment_file):
        check_blockchain_events(ipfs_hash, deployment_file)
    else:
        print(f"\n⚠️  {deployment_file} not found, skipping blockchain check")
    
    print("\n" + "=" * 60)
    print("💡 Tips:")
    print("=" * 60)
    print("• IPFS hashes are immutable - content never changes")
    print("• To track changes, check deployment.json files")
    print("• View content: https://ipfs.io/ipfs/" + ipfs_hash)
    print("• Pin content: ipfs pin add " + ipfs_hash)
    print("• Check local node: ipfs cat " + ipfs_hash)

if __name__ == "__main__":
    main()

