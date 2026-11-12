# pi attention queue — fzf picker over sessions waiting for you (alt+q popup).
# Unlike tm, useful inside tmux too (the script attaches when outside,
# switch-client when inside), so no TMUX guard here.
tq() {
    bash "$HOME/scripts/pi_attention_queue.sh" "$@"
}
