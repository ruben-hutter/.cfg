# tmux session picker — no-op inside tmux (new tmux windows call this too)
tm() {
    [[ -n $TMUX ]] || bash "$HOME/scripts/tmux_session_manager.sh" "$@"
}
