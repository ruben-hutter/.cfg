#!/usr/bin/env bash

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "tmux is not installed. Please install it first."
    exit 1
fi

# Check if fzf is installed
if ! command -v fzf &> /dev/null; then
    echo "fzf is not installed. Please install it first."
    exit 1
fi

# Get session names
get_sessions() {
    tmux list-sessions -F "#S" 2>/dev/null
}

# If inside a tmux session, get the current session name
current_session=""
if [ -n "$TMUX" ]; then
    current_session=$(tmux display-message -p "#S")
fi

# Function to create a new session
create_session() {
    local session_name="$1"
    echo "Creating new session: $session_name"
    tmux new-session -d -s "$session_name"
    tmux attach-session -t "$session_name"
}

# Get existing sessions or show a prompt for creating a new one
sessions=$(get_sessions)

if [ -z "$sessions" ]; then
    # No existing sessions, prompt for a new one
    echo "No existing tmux sessions."
    read -p "Enter new session name: " new_session
    create_session "$new_session"
else
    # Use fzf to select from existing sessions or enter a new session name
    selected_session=$(echo "$sessions" | fzf --height 40% --reverse --query="$1" --prompt="Select existing session or type new session name: " --print-query)
    # The output of fzf with --print-query gives the query as the first line and the selection as the second
    query=$(echo "$selected_session" | head -1)
    selection=$(echo "$selected_session" | tail -1)

    # Check if a session was selected
    if [ -n "$selection" ] && [ "$selection" != "$query" ]; then
        # A session was selected from the list
        if [ -n "$TMUX" ]; then
            if [ "$selection" != "$current_session" ]; then
                tmux switch-client -t "$selection"
            else
                echo "Already in session '$selection'"
            fi
        else
            tmux attach-session -t "$selection"
        fi
    else
        # No session was selected or the query doesn't match any existing session
        # Use the query as the new session name
        if [ -n "$query" ]; then
            create_session "$query"
        fi
    fi
fi
