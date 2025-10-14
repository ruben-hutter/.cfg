#!/usr/bin/env bash

gnome-keyring-daemon --start --components=ssh

for i in {1..10}; do
    if [ -S "${XDG_RUNTIME_DIR}/keyring/ssh" ]; then
        break
    fi
    sleep 0.2
done
