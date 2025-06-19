#!/usr/bin/env bash

# This script is used to connect to the university VPN
# c, connect option is used to connect to the VPN
# d, disconnect option is used to disconnect from the VPN

# Check if the user has provided an option
if [ -z "$1" ]; then
    echo "Usage: $0 [c|connect|d|disconnect]"
    exit
fi

# Check if the user has provided a valid option
if [ "$1" != "c" ] && [ "$1" != "connect" ] && [ "$1" != "d" ] && [ "$1" != "disconnect" ]; then
    echo "Invalid option"
    exit
fi

# Connect to the VPN
if [ "$1" == "c" ] || [ "$1" == "connect" ]; then
    echo "Connecting to the VPN..."
    sudo -b gpclient connect vpn.unibas.ch
fi

# Disconnect from the VPN
if [ "$1" == "d" ] || [ "$1" == "disconnect" ]; then
    echo "Disconnecting from the VPN..."
    sudo gpclient disconnect
fi
