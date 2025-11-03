#!/usr/bin/env bash

# Usage: sshfs-umount.sh <mountpoint>
# Example: sshfs-umount.sh ~/remote_concolic

if [ $# -ne 1 ]; then
    echo "Usage: $0 <mountpoint>"
    echo "Example: $0 ~/remote_concolic"
    exit 1
fi

MOUNTPOINT="$1"

# Check if the mountpoint is actually mounted
if [ ! -d "$MOUNTPOINT" ]; then
    echo "Mountpoint $MOUNTPOINT does not exist."
    exit 1
fi

if ! mountpoint -q "$MOUNTPOINT" 2>/dev/null && ! mount | grep -q "$MOUNTPOINT"; then
    echo "Mountpoint $MOUNTPOINT is not mounted."
    exit 1
fi

echo "Unmounting $MOUNTPOINT..."

# Try to kill processes using the mountpoint
PIDS=$(lsof +D "$MOUNTPOINT" 2>/dev/null | awk 'NR>1 {print $2}' | sort -u)
if [ -n "$PIDS" ]; then
    echo "Killing processes using mountpoint: $PIDS"
    echo "$PIDS" | xargs kill 2>/dev/null
    sleep 1
fi

# Try fusermount first (lazy unmount)
if fusermount -uz "$MOUNTPOINT" 2>/dev/null; then
    echo "Successfully unmounted $MOUNTPOINT using fusermount."
    exit 0
fi

# If fusermount failed, try umount
echo "fusermount failed, trying umount..."
if sudo umount -l "$MOUNTPOINT"; then
    echo "Unmounted $MOUNTPOINT using umount."
    exit 0
else
    echo "Failed to unmount $MOUNTPOINT."
    exit 1
fi

