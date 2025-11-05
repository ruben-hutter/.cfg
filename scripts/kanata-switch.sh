#!/usr/bin/env bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service names
MAC_SERVICE="kanata-mac.service"
STD_SERVICE="kanata-std.service"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check which service is currently running
get_active_service() {
    if systemctl --user is-active --quiet "$MAC_SERVICE"; then
        echo "$MAC_SERVICE"
    elif systemctl --user is-active --quiet "$STD_SERVICE"; then
        echo "$STD_SERVICE"
    else
        echo "none"
    fi
}

# Get the other service (toggle)
get_other_service() {
    local current=$1
    if [[ "$current" == "$MAC_SERVICE" ]]; then
        echo "$STD_SERVICE"
    else
        echo "$MAC_SERVICE"
    fi
}

# Get friendly name for service
get_service_name() {
    case "$1" in
        "$MAC_SERVICE")
            echo "Mac keyboard"
            ;;
        "$STD_SERVICE")
            echo "Standard keyboard"
            ;;
        *)
            echo "Unknown"
            ;;
    esac
}

# Main logic
main() {
    print_info "Checking Kanata service status..."

    local active_service
    active_service=$(get_active_service)

    if [[ "$active_service" == "none" ]]; then
        print_warning "No Kanata service currently running"
        print_info "Starting Standard keyboard config..."
        systemctl --user enable "$STD_SERVICE"
        systemctl --user start "$STD_SERVICE"
        print_success "Standard keyboard config started and enabled"
    else
        local active_name
        active_name=$(get_service_name "$active_service")

        local other_service
        other_service=$(get_other_service "$active_service")

        local other_name
        other_name=$(get_service_name "$other_service")

        print_info "Currently running: $active_name"
        print_info "Switching to: $other_name"

        # Stop the active service
        systemctl --user stop "$active_service"
        print_success "Stopped $active_name"

        # Start the other service
        systemctl --user start "$other_service"
        print_success "Started $other_name"
    fi

    print_info "Done!"
}

main "$@"
