#!/usr/bin/env bash

if tmux has-session -t uni 2>/dev/null; then
    tmux attach -t uni
else
    tmux new-session -s uni -n 'uni' -c ~/UNI/
fi
