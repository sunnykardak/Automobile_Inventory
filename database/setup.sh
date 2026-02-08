#!/bin/bash

# ========================================
# Database Setup Script
# ========================================

DB_NAME="automotive_inventory"
DB_USER="nishikesh"
DB_PASSWORD="admin123"
DB_HOST="localhost"
DB_PORT="5432"
PG_SUPERUSER="${USER}"  # Use current system user as PostgreSQL superuser

echo "========================================="
echo "Automobile Inventory Database Setup"
echo "========================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed!"
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql@14"
    echo "  Ubuntu: sudo apt-get install postgresql"
    exit 1
fi

echo "✅ PostgreSQL found"
echo ""

# Check if PostgreSQL service is running
if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
    echo "⚠️  PostgreSQL service is not running!"
    echo "Starting PostgreSQL..."
    
    # For macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start postgresql@14
    fi
    
    sleep 3
fi

echo "✅ PostgreSQL service is running"
echo ""

# Create database user if not exists
echo "Creating database user '$DB_USER'..."
psql -h $DB_HOST -U $PG_SUPERUSER -d postgres -tc "SELECT 1 FROM pg_user WHERE usename = '$DB_USER'" | grep -q 1 || \
psql -h $DB_HOST -U $PG_SUPERUSER -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"

# Create database if not exists
echo "Creating database '$DB_NAME'..."
psql -h $DB_HOST -U $PG_SUPERUSER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -h $DB_HOST -U $PG_SUPERUSER -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Grant privileges
echo "Granting privileges..."
psql -h $DB_HOST -U $PG_SUPERUSER -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo ""
echo "✅ Database and user created successfully"
echo ""

# Run schema file
echo "Running schema.sql..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "$(dirname "$0")/schema.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ Database setup completed successfully!"
    echo "========================================="
    echo ""
    echo "Database Details:"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo ""
    echo "Connection String:"
    echo "  postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    echo ""
else
    echo ""
    echo "❌ Error: Schema creation failed!"
    exit 1
fi
