#!/usr/bin/env bash

SESH="uni"

if ! tmux has-session -t "$SESH" 2>/dev/null; then
    tmux new-session -d -s "$SESH"
fi

tmux attach-session -t "$SESH"
