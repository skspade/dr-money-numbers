#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default database configuration
DB_NAME="drmoneynumbers"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_PORT="5432"

echo -e "${GREEN}🚀 Starting PostgreSQL installation and setup...${NC}\n"

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "✅ Homebrew already installed"
fi

# Install PostgreSQL
echo -e "\n${YELLOW}Installing PostgreSQL...${NC}"
brew install postgresql@16

# Add PostgreSQL to PATH if not already there
if [[ ":$PATH:" != *":/opt/homebrew/opt/postgresql@16/bin:"* ]]; then
    echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
    source ~/.zshrc
fi

# Stop PostgreSQL if it's running
echo -e "\n${YELLOW}Stopping PostgreSQL if running...${NC}"
brew services stop postgresql@16

# Remove existing data directory
echo -e "\n${YELLOW}Cleaning up existing PostgreSQL data...${NC}"
rm -rf /opt/homebrew/var/postgresql@16

# Initialize PostgreSQL with new data directory
echo -e "\n${YELLOW}Initializing PostgreSQL...${NC}"
initdb -D /opt/homebrew/var/postgresql@16 -U $DB_USER --pwfile=<(echo "$DB_PASSWORD") --auth=md5

# Configure PostgreSQL authentication
echo -e "\n${YELLOW}Configuring PostgreSQL authentication...${NC}"
cat > /opt/homebrew/var/postgresql@16/pg_hba.conf << EOL
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all            all                                     md5
host    all            all             127.0.0.1/32            md5
host    all            all             ::1/128                 md5
EOL

# Configure postgresql.conf
echo -e "\n${YELLOW}Configuring PostgreSQL settings...${NC}"
cat > /opt/homebrew/var/postgresql@16/postgresql.conf << EOL
listen_addresses = 'localhost'
port = $DB_PORT
max_connections = 100
shared_buffers = 128MB
dynamic_shared_memory_type = posix
max_wal_size = 1GB
min_wal_size = 80MB
log_timezone = 'UTC'
datestyle = 'iso, mdy'
timezone = 'UTC'
lc_messages = 'en_US.UTF-8'
lc_monetary = 'en_US.UTF-8'
lc_numeric = 'en_US.UTF-8'
lc_time = 'en_US.UTF-8'
default_text_search_config = 'pg_catalog.english'
EOL

# Start PostgreSQL service
echo -e "\n${YELLOW}Starting PostgreSQL service...${NC}"
brew services start postgresql@16

# Wait for PostgreSQL to start and verify connection
echo -e "\n${YELLOW}Waiting for PostgreSQL to start...${NC}"
max_attempts=30
attempt=1
while ! PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h localhost -p $DB_PORT -c '\q' 2>/dev/null; do
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}Failed to connect to PostgreSQL after $max_attempts attempts${NC}"
        exit 1
    fi
    echo -n "."
    sleep 1
    ((attempt++))
done
echo -e "\n✅ PostgreSQL is accepting connections"

# Create default database
echo -e "\n${YELLOW}Creating default database...${NC}"
PGPASSWORD=$DB_PASSWORD createdb -U $DB_USER -h localhost $DB_NAME

# Verify installation
PG_VERSION=$(PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h localhost -d $DB_NAME -c "SELECT version();" | head -n 3 | tail -n 1)
echo -e "\n✅ PostgreSQL installed successfully!"
echo -e "Version: $PG_VERSION"
echo -e "\n${GREEN}Installation Complete!${NC}"

# Print connection information
echo -e "\n${GREEN}Connection Information:${NC}"
echo "Host: localhost"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "Username: $DB_USER"
echo "Password: $DB_PASSWORD"

# Print helpful commands
echo -e "\n${GREEN}Helpful Commands:${NC}"
echo "Start PostgreSQL:   brew services start postgresql@16"
echo "Stop PostgreSQL:    brew services stop postgresql@16"
echo "Restart PostgreSQL: brew services restart postgresql@16"
echo "Connect to psql:    PGPASSWORD=$DB_PASSWORD psql -h localhost -d $DB_NAME -U $DB_USER"

# Create .env file with database URL
echo -e "\n${YELLOW}Creating .env file...${NC}"
echo "POSTGRES_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:$DB_PORT/$DB_NAME" > .env
echo "✅ Created .env file with database URL"

# Verify database connection
echo -e "\n${YELLOW}Verifying database connection...${NC}"
if PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h localhost -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi