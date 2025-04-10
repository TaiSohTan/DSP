#!/bin/bash

# Wait for postgres to be ready
echo "Waiting for PostgreSQL..."
python -m wait_for $DB_HOST $DB_PORT
python -m wait_for $AUTH_DB_HOST $AUTH_DB_PORT

# Apply database migrations
echo "Applying migrations..."
python manage.py migrate --noinput

# Compile smart contract
echo "Compiling smart contract..."
mkdir -p blockchain/contracts/compiled
# Try to compile contract, but continue if it fails
python blockchain/scripts/compile_contract.py || echo "Warning: Contract compilation failed, continuing without it"

# Start server
python manage.py runserver 0.0.0.0:8000
echo "Starting server... at http://127.0.0.1:8000"
exec "$@"