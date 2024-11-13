#!/usr/bin/env bash

SESH="uni"

if ! tmux has-session -t "$SESH" 2>/dev/null; then
    tmux new-session -d -s "$SESH" -n "editor"
    tmux new-window -t "$SESH" -n "shell"
    tmux new-window -t "$SESH" -n "vpn"
    tmux select-window -t "$SESH":editor
fi

tmux attach-session -t "$SESH"
