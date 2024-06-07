export VISUAL=nvim
export EDITOR="$VISUAL"

export QT_QPA_PLATFORM='wayland;xcb'
export QT_QPA_PLATFORMTHEME=qt5ct

export XDG_CURRENT_DESKTOP=Hyprland
export XDG_SESSION_TYPE=Hyprland
export XDG_SESSION_DESKTOP=Hyprland

if [ -f ~/.keys ]; then
    . ~/.keys
fi

# Get the path to the SSH agent socket file
SSH_AGENT_SOCKET=$(find /tmp/ssh-* -name 'agent.*' | head -n 1)

# Check if the socket file exists
if [ -S "$SSH_AGENT_SOCKET" ]; then
    # Set SSH_AUTH_SOCK variable
    export SSH_AUTH_SOCK="$SSH_AGENT_SOCKET"
else
    echo "SSH agent socket file not found."
fi
