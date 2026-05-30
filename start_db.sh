#!/bin/bash

# Define paths
DB_DIR="/home/nishant/Desktop/cat-app/db_data"
PORT=3309
SOCKET="$DB_DIR/mysql.sock"
PID_FILE="$DB_DIR/mariadb.pid"

# 1. Create data directory if not exists
if [ ! -d "$DB_DIR" ]; then
  echo "Initializing MariaDB data directory..."
  mkdir -p "$DB_DIR"
  /usr/bin/mariadb-install-db --user=nishant --datadir="$DB_DIR"
fi

# 2. Check if mariadbd is already running on port 3309
PID=$(pgrep -f "mariadbd --datadir=$DB_DIR")
if [ -n "$PID" ]; then
  echo "MariaDB is already running with PID $PID"
else
  echo "Starting MariaDB on port $PORT..."
  /usr/sbin/mariadbd \
    --datadir="$DB_DIR" \
    --port=$PORT \
    --socket="$SOCKET" \
    --pid-file="$PID_FILE" \
    --bind-address=127.0.0.1 \
    --skip-grant-tables > /dev/null 2>&1 &
  
  # Wait for it to start
  sleep 3
fi

# 3. Create database
mysql -h 127.0.0.1 -P $PORT -e "CREATE DATABASE IF NOT EXISTS cat_app;"

echo "Database cat_app created/verified."
