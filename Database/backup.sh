#!/bin/bash

# INTERNAL
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NOW=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUPS_DIR="$SCRIPT_DIR/Backups"
JSON_PATH="$SCRIPT_DIR/../Backend/config.json"

# Create main backups directory if needed
mkdir -p "$BACKUPS_DIR"

# Read forces and their databases from JSON
databases=$(jq -r '.forces | to_entries[] | "\(.key) \(.value.database)"' "$JSON_PATH")

# Loop through each force/database
while read -r force database; do
    # Create force-specific folder
    FORCE_DIR="$BACKUPS_DIR/$force"
    mkdir -p "$FORCE_DIR"

    # Backup file paths
    backup_sql="$FORCE_DIR/${force}_${NOW}.sql"
    backup_sql_gz="$backup_sql.gz"
    binlog_info="$FORCE_DIR/${force}_${NOW}_binlog.info"

    echo "[$force] Starting backup of database '$database'..."

    # Lock tables and get binlog info
    echo "[$force] Locking tables and fetching binlog info..."
    mysql -u "root" -e "FLUSH TABLES WITH READ LOCK; SHOW MASTER STATUS\G" > "$binlog_info"

    # Dump database (only data, no structure)
    echo "[$force] Dumping data..."
    mysqldump -u "root" \
        --single-transaction \
        --skip-triggers \
        --no-create-info \
        --complete-insert \
        "$database" > "$backup_sql"

    # Unlock tables immediately after
    echo "[$force] Unlocking tables..."
    mysql -u "root" -e "UNLOCK TABLES;"

    # Compress the SQL file
    echo "[$force] Compressing backup..."
    gzip "$backup_sql"

    echo "[$force] Backup complete: $backup_sql_gz"

    echo ""
done <<< "$databases"
