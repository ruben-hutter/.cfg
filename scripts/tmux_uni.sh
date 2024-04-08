#!/usr/bin/env bash

# Check if a tmux session "uni" exists
# If it does, attach to it
# If it doesn't, create it from ~/UNI/

if tmux has-session -t uni 2>/dev/null; then
    tmux attach -t uni
else
    tmux new-session -s uni -n 'uni' -c ~/UNI/
fi
