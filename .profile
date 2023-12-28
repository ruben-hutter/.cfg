export VISUAL=nvim
export EDITOR="$VISUAL"

export QT_QPA_PLATFORM='wayland;xcb'
export QT_QPA_PLATFORMTHEME=qt5ct

export XDG_CURRENT_DESKTOP=Hyprland
export XDG_SESSION_TYPE=Hyprland
export XDG_SESSION_DESKTOP=Hyprland

export HUGGINGFACE_APIKEY=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

if [ -z "$SSH_AUTH_SOCK" ]; then
    eval `ssh-agent -s`
    ssh-add $HOME/.ssh/github
    ssh-add $HOME/.ssh/gitlab_uni
fi
