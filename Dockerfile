FROM python:3.10-slim

WORKDIR /app

# Install system dependencies including Solidity compiler
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    nodejs \
    npm \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Install solc using a more reliable method
RUN curl -fsSL https://github.com/ethereum/solidity/releases/download/v0.8.19/solc-static-linux > /usr/local/bin/solc \
    && chmod +x /usr/local/bin/solc

# Verify solc installation
RUN solc --version

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Make scripts executable
RUN chmod +x /app/entrypoint.sh
RUN chmod +x /app/wait_for.py

ENTRYPOINT ["/app/entrypoint.sh"]