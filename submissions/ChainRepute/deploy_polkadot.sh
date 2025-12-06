#!/bin/bash
# Instant Polkadot deployment script

echo "🚀 DEPLOYING POLKADOT CONTRACT..."

cargo contract instantiate \
  --manifest-path /Users/ayushyadav/Coding/React-Vite-Template/contracts/governance-sbt/Cargo.toml \
  --url wss://rpc1.paseo.popnetwork.xyz \
  --suri "cover symbol quiz spin weird humble arrange bus bone sketch comic gorilla" \
  -x -y \
  --constructor new \
  --value 0 \
  2>&1 | tee /tmp/polkadot_deploy_output.log

# Extract contract address
CONTRACT_ADDR=$(grep -o "Contract [0-9a-zA-Z]*" /tmp/polkadot_deploy_output.log | awk '{print $2}')

if [ -n "$CONTRACT_ADDR" ]; then
  echo ""
  echo "✅ DEPLOYMENT SUCCESS!"
  echo "📍 Contract Address: $CONTRACT_ADDR"
  echo ""
  echo "Next: Update frontend with this address!"
else
  echo "❌ Deployment failed - check output above"
fi
