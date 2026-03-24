#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting HabitTracker Deployment..."

cd "$PROJECT_DIR"

# 1. Build contract
echo "▸ Step 1/3: Building contract..."
cd contract
stellar contract build
cd ..

WASM_PATH="contract/target/wasm32v1-none/release/habit_tracker.wasm"

# 2. Ensure identity is funded
echo "▸ Step 2/3: Checking deployer identity..."
bash scripts/fund-account.sh

# 3. Deploy to Testnet
echo "▸ Step 3/3: Deploying to Stellar Testnet..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source deployer \
  --network testnet \
  2>&1 | tail -n 1)

if [[ $CONTRACT_ID == C* ]]; then
  echo "✅ Deployed successfully!"
  echo "   Contract ID: $CONTRACT_ID"
else
  echo "❌ Deployment failed"
  echo "$CONTRACT_ID"
  exit 1
fi

# 4. Update frontend environment
echo "▸ Updating .env.local..."
cat > .env.local << EOF
NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
EOF

echo "✅ Done! You can now run 'npm run dev' to start tracking habits."
