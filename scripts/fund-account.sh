#!/usr/bin/env bash
set -euo pipefail

# 1. Get deployer public key
if ! stellar keys show deployer 2>/dev/null; then
  echo "Generating deployer key..."
  stellar keys generate deployer --network testnet
fi

DEPLOYER=$(stellar keys address deployer)

# 2. Curl Friendbot
echo "Funding account: $DEPLOYER"
curl -s -X GET "https://friendbot.stellar.org?addr=$DEPLOYER" > /dev/null

echo ""
echo "✅ Account funded: $DEPLOYER"
