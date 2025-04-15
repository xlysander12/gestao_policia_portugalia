#!/usr/bin/bash
# Get the current time
current_time=$(date "+%Y-%m-%d_%H-%M-%S")

# The dump should be stored in a SQL file in the "Backups" folder, with the current time attached
backup_file="Backups/backup_$current_time.sql"
mysqldump -u root --single-transaction --skip-triggers --skip-events --routines=FALSE --no-create-db "$(cat dbs.txt)" > "$backup_file"