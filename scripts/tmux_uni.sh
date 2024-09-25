#!/usr/bin/env bash

SESH="uni"

tmux has-session -t $SESH 2>/dev/null

if [ $? != 0 ]; then
    tmux new-session -d -s $SESH -n "editor"

    tmux send-keys -t $SESH:editor "cd ~/UNI" C-m
fi

tmux attach-session -t $SESH
