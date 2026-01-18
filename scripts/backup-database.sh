#!/bin/bash
set -e

# LitStatus.com Database Backup Script
# Usage: ./scripts/backup-database.sh [OPTIONS]
#
# Options:
#   --remote         Backup from remote Supabase instance
#   --local          Backup from local database
#   --restore FILE   Restore from backup file
#   --list           List available backups
#   --cleanup        Remove old backups (older than 30 days)
#   --help           Show this help message

set -o pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================
BACKUP_DIR="./backups/database"
REMOTE_BACKUP_DIR="/tmp/litstatus-db-backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="litstatus_db_${TIMESTAMP}.sql"

# Supabase configuration (from .env)
SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env 2>/dev/null | cut -d'=' -f2-)
SUPABASE_DB_URL=$(grep "^DATABASE_URL=" .env 2>/dev/null | cut -d'=' -f2-)
SUPABASE_SERVICE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env 2>/dev/null | cut -d'=' -f2-)

VPS_HOST="root@107.174.42.198"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# ============================================================================
# USAGE
# ============================================================================
show_usage() {
    cat << EOF
${BLUE}LitStatus.com Database Backup Script${NC}

${GREEN}USAGE${NC}
    $0 [OPTIONS]

${GREEN}OPTIONS${NC}
    --remote         Backup from remote Supabase instance
    --local          Backup from local database (development)
    --restore FILE   Restore database from backup file
    --list           List available backups
    --cleanup        Remove old backups (older than ${RETENTION_DAYS} days)
    --help, -h       Show this help message

${GREEN}EXAMPLES${NC}
    $0 --remote              # Backup from remote Supabase
    $0 --restore backups/database/litstatus_db_20240101_120000.sql
    $0 --list                # List available backups
    $0 --cleanup             # Clean up old backups

${GREEN}NOTES${NC}
    - Backups are stored in: ${BACKUP_DIR}
    - Retention policy: ${RETENTION_DAYS} days
    - For Supabase, uses the management API to export data
    - Requires SUPABASE_SERVICE_ROLE_KEY in .env

EOF
}

# ============================================================================
# VALIDATION
# ============================================================================
validate_environment() {
    if [ ! -f ".env" ]; then
        log_error ".env file not found!"
        exit 1
    fi

    if [ -z "$SUPABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
        log_error "Supabase URL not found in .env"
        exit 1
    fi

    mkdir -p "$BACKUP_DIR"
}

# ============================================================================
# BACKUP FUNCTIONS
# ============================================================================
backup_remote() {
    log_step "Creating remote database backup..."

    # Extract project reference from URL
    if [[ "$SUPABASE_URL" =~ https://([^.]+)\.supabase\.co ]]; then
        PROJECT_REF="${BASH_REMATCH[1]}"
        log_info "Project reference: $PROJECT_REF"
    else
        log_error "Could not extract project reference from SUPABASE_URL"
        exit 1
    fi

    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        log_warn "psql not found locally. Attempting backup on VPS..."

        # Try to backup via VPS if it has the tools
        ssh -o ConnectTimeout=10 "$VPS_HOST" "
            set -e
            BACKUP_FILE=\"litstatus_db_\$(date +%Y%m%d_%H%M%S).sql\"
            mkdir -p $REMOTE_BACKUP_DIR

            if command -v pg_dump &> /dev/null; then
                echo \"[INFO] Creating backup on VPS...\"
                # This would require DATABASE_URL on VPS
                # pg_dump \"\$DATABASE_URL\" > $REMOTE_BACKUP_DIR/\$BACKUP_FILE
            else
                echo \"[WARN] pg_dump not available on VPS\"
                echo \"[INFO] Using Supabase CLI export instead...\"

                if command -v supabase &> /dev/null; then
                    supabase db dump --db-url \"\$DATABASE_URL\" -f $REMOTE_BACKUP_DIR/\$BACKUP_FILE
                else
                    echo \"[ERROR] Neither pg_dump nor supabase CLI available\"
                    exit 1
                fi
            fi

            ls -lh $REMOTE_BACKUP_DIR/\$BACKUP_FILE
        " && {
            log_info "Remote backup completed"
            return
        }
    fi

    # Use Supabase management API to backup
    log_info "Using Supabase Management API for backup..."

    local backup_path="${BACKUP_DIR}/${BACKUP_FILE}"

    # Create a data export using the Supabase client
    # This requires node script since we need to use the Supabase JS client
    log_info "Creating backup via Node.js script..."

    cat > /tmp/backup_supabase.js << 'EOJS'
    const { createClient } = require('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const tables = [
        'profiles',
        'wishlists',
        'funnel_events',
        'feedback',
        'security_events',
        'quota_usage'
    ];

    async function backup() {
        const backup = {};
        let totalRows = 0;

        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*');

                if (error) {
                    console.warn(`Warning: Could not backup ${table}: ${error.message}`);
                    backup[table] = [];
                } else {
                    backup[table] = data || [];
                    totalRows += (data || []).length;
                    console.log(`Backed up ${table}: ${(data || []).length} rows`);
                }
            } catch (err) {
                console.warn(`Warning: Error backing up ${table}: ${err.message}`);
                backup[table] = [];
            }
        }

        return { backup, totalRows, timestamp: new Date().toISOString() };
    }

    backup()
        .then(result => {
            console.log(JSON.stringify(result, null, 2));
        })
        .catch(err => {
            console.error('Backup failed:', err.message);
            process.exit(1);
        });
EOJS

    # Run the backup script
    local output_file="${backup_path}.json"
    SUPABASE_URL="$SUPABASE_URL" \
    SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_KEY" \
    node /tmp/backup_supabase.js > "$output_file"

    # Check if backup was successful
    if [ $? -eq 0 ] && [ -s "$output_file" ]; then
        # Also create a more readable SQL-like format
        log_info "Processing backup data..."

        # Get row counts
        local total_rows=$(grep -o '"totalRows":[0-9]*' "$output_file" | cut -d':' -f2)

        log_info "Backup completed: ${output_file}"
        log_info "Total rows backed up: ${total_rows:-0}"

        # Create checksum
        if command -v shasum &> /dev/null; then
            shasum "$output_file" > "${output_file}.sha256"
            log_info "Checksum: ${output_file}.sha256"
        fi

        rm -f /tmp/backup_supabase.js
    else
        log_error "Backup failed"
        rm -f /tmp/backup_supabase.js
        exit 1
    fi
}

backup_local() {
    log_step "Creating local database backup..."

    if [ -z "$SUPABASE_DB_URL" ] && [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL not found in .env"
        log_info "For local development, set DATABASE_URL to your local PostgreSQL connection string"
        exit 1
    fi

    local db_url="${SUPABASE_DB_URL:-$(grep "^DATABASE_URL=" .env | cut -d'=' -f2-)}"
    local backup_path="${BACKUP_DIR}/${BACKUP_FILE}"

    log_info "Backing up database to: ${backup_path}"

    if command -v pg_dump &> /dev/null; then
        pg_dump "$db_url" > "$backup_path"
        log_info "Backup completed: ${backup_path}"

        # Create checksum
        if command -v shasum &> /dev/null; then
            shasum "$backup_path" > "${backup_path}.sha256"
            log_info "Checksum: ${backup_path}.sha256"
        fi

        # Show file size
        local size=$(ls -lh "$backup_path" | awk '{print $5}')
        log_info "Backup size: ${size}"
    else
        log_error "pg_dump not found. Install PostgreSQL client tools"
        exit 1
    fi
}

# ============================================================================
# RESTORE FUNCTIONS
# ============================================================================
restore_backup() {
    local backup_file="$1"

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi

    log_step "Restoring database from: $backup_file"
    log_warn "This will overwrite existing data!"
    echo
    read -p "Continue with restore? (yes/NO) " -r
    echo

    if [ ! "$REPLY" = "yes" ]; then
        log_info "Restore cancelled"
        exit 0
    fi

    # Verify checksum if available
    if [ -f "${backup_file}.sha256" ]; then
        log_info "Verifying backup integrity..."
        if shasum -c "${backup_file}.sha256" >/dev/null 2>&1; then
            log_info "Checksum verified"
        else
            log_error "Checksum verification failed!"
            exit 1
        fi
    fi

    # Determine if JSON or SQL backup
    if [[ "$backup_file" == *.json ]]; then
        restore_from_json "$backup_file"
    else
        restore_from_sql "$backup_file"
    fi
}

restore_from_json() {
    local backup_file="$1"
    log_info "Restoring from JSON backup..."

    cat > /tmp/restore_supabase.js << 'EOJS'
    const { createClient } = require('@supabase/supabase-js');
    const fs = require('fs');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const backupFile = process.env.BACKUP_FILE;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    async function restore() {
        const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
        const { backup } = backupData;

        for (const [table, data] of Object.entries(backup)) {
            if (Array.isArray(data) && data.length > 0) {
                console.log(`Restoring ${table}: ${data.length} rows`);

                try {
                    // Delete existing data first
                    await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');

                    // Insert data in batches
                    const batchSize = 100;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const batch = data.slice(i, i + batchSize);
                        const { error } = await supabase.from(table).insert(batch);
                        if (error) {
                            console.warn(`Warning: Could not insert batch for ${table}: ${error.message}`);
                        }
                    }

                    console.log(`Restored ${table}`);
                } catch (err) {
                    console.error(`Error restoring ${table}: ${err.message}`);
                }
            }
        }
    }

    restore()
        .then(() => {
            console.log('Restore completed');
        })
        .catch(err => {
            console.error('Restore failed:', err.message);
            process.exit(1);
        });
EOJS

    BACKUP_FILE="$backup_file" \
    SUPABASE_URL="$SUPABASE_URL" \
    SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_KEY" \
    node /tmp/restore_supabase.js

    rm -f /tmp/restore_supabase.js
    log_info "Restore completed"
}

restore_from_sql() {
    local backup_file="$1"
    local db_url="${SUPABASE_DB_URL:-$(grep "^DATABASE_URL=" .env | cut -d'=' -f2-)}"

    if ! command -v psql &> /dev/null; then
        log_error "psql not found. Install PostgreSQL client tools"
        exit 1
    fi

    log_info "Restoring from SQL backup..."
    psql "$db_url" < "$backup_file"
    log_info "Restore completed"
}

# ============================================================================
# LIST FUNCTION
# ============================================================================
list_backups() {
    log_step "Available backups:"

    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "No backup directory found"
        return
    fi

    echo
    printf "%-40s %-12s %s\n" "File" "Size" "Date"
    printf "%-40s %-12s %s\n" "----" "----" "----"

    find "$BACKUP_DIR" -type f \( -name "*.sql" -o -name "*.json" \) ! -name "*.sha256" | sort -r | while read -r file; do
        local size=$(ls -lh "$file" | awk '{print $5}')
        local date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null | cut -d'.' -f1)
        local filename=$(basename "$file")
        printf "%-40s %-12s %s\n" "$filename" "$size" "$date"
    done
}

# ============================================================================
# CLEANUP FUNCTION
# ============================================================================
cleanup_old_backups() {
    log_step "Cleaning up old backups (older than ${RETENTION_DAYS} days)..."

    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "No backup directory found"
        return
    fi

    local count=$(find "$BACKUP_DIR" -type f \( -name "*.sql" -o -name "*.json" \) ! -name "*.sha256" -mtime +$RETENTION_DAYS | wc -l)

    if [ "$count" -eq 0 ]; then
        log_info "No old backups to remove"
        return
    fi

    log_info "Found $count old backups"

    find "$BACKUP_DIR" -type f \( -name "*.sql" -o -name "*.json" \) ! -name "*.sha256" -mtime +$RETENTION_DAYS -print0 | while IFS= read -r -d '' file; do
        log_info "Removing: $(basename "$file")"
        rm -f "$file" "${file}.sha256"
    done

    log_info "Cleanup completed"
}

# ============================================================================
# SCHEDULED BACKUP FUNCTION (for cron)
# ============================================================================
scheduled_backup() {
    # This function is meant to be called from cron
    # It creates a backup and cleans up old ones automatically
    log_step "Scheduled backup starting..."

    validate_environment
    backup_remote

    # Get current backup count
    local backup_count=$(find "$BACKUP_DIR" -type f \( -name "*.sql" -o -name "*.json" \) ! -name "*.sha256" | wc -l)

    # If more than 30 backups, clean up old ones
    if [ "$backup_count" -gt 30 ]; then
        cleanup_old_backups
    fi

    log_info "Scheduled backup completed"
}

# ============================================================================
# MAIN
# ============================================================================
main() {
    local action="${1:---remote}"

    case "$action" in
        --remote)
            validate_environment
            backup_remote
            ;;
        --local)
            validate_environment
            backup_local
            ;;
        --restore)
            if [ -z "$2" ]; then
                log_error "Please specify backup file to restore"
                echo
                show_usage
                exit 1
            fi
            validate_environment
            restore_backup "$2"
            ;;
        --list)
            list_backups
            ;;
        --cleanup)
            cleanup_old_backups
            ;;
        --scheduled)
            scheduled_backup
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $action"
            echo
            show_usage
            exit 1
            ;;
    esac
}

# Check for @supabase/supabase-js availability for JSON backup/restore
if [[ "$1" == "--remote" || "$1" == "--restore" ]] && [ ! -d "node_modules/@supabase/supabase-js" ]; then
    log_warn "@supabase/supabase-js not found. JSON backup/restore may not work."
    log_info "Consider running: npm install @supabase/supabase-js"
fi

main "$@"
