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
python blockchain/scripts/compile_contract.py

# Populate auth database
echo "Populating authentication database..."
python manage.py populate_auth_db --count 50

# Create superuser if needed
if [ "$DJANGO_SUPERUSER_EMAIL" ]; then
    echo "Creating superuser..."
    python manage.py createsuperuser \
        --noinput \
        --email $DJANGO_SUPERUSER_EMAIL
fi

# Start server
echo "Starting server..."
exec "$@"