#!/bin/bash
# Get current Unix timestamp
CURRENT_TIME=$(date +%s)
echo "Starting Ganache with current timestamp: $CURRENT_TIME"
# Use the proper path to the ganache executable in the container
cli.js --deterministic \
  --chain.networkId=1337 \
  --chain.chainId=1337 \
  --miner.blockGasLimit=5000000 \
  --miner.blockTime=0 \
  --miner.instamine=eager \
  --gasPrice=1000000000 \
  --wallet.defaultBalance=1000000000 \
  --accounts=10 \
  --server.host=0.0.0.0 \
  --database.dbPath=/ganache/data \
  --chain.time=$CURRENT_TIME
