#!/bin/sh
dir="$HOME/.nanobot"
if [ -d "$dir" ] && [ ! -w "$dir" ]; then
    owner_uid=$(stat -c %u "$dir" 2>/dev/null || stat -f %u "$dir" 2>/dev/null)
    cat >&2 <<EOF
Error: $dir is not writable (owned by UID $owner_uid, running as UID $(id -u)).
EOF
    exit 1
fi

# Apply message splitting patch
if [ -f /app/patches/split_message_patch.py ]; then
    python3 -c "
import sys
sys.path.insert(0, '/app/patches')
import split_message_patch
split_message_patch.apply_patch()
" 2>/dev/null || true
fi

exec nanobot "$@"
