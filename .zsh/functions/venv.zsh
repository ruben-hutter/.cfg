# activate .venv in cwd or ~ (zsh sources the real activate script —
# `deactivate` comes with it, no PATH juggling needed)
venv() {
    if [[ -f .venv/bin/activate ]]; then
        . .venv/bin/activate
    elif [[ -f $HOME/.venv/bin/activate ]]; then
        . "$HOME/.venv/bin/activate"
    else
        echo "No virtualenv found"
        return 1
    fi
}
