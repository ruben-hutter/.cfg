# git wrapper for the bare dotfiles repo in ~/.cfg (like `conflg`, but git CLI)
config() {
    GIT_DIR="$HOME/.cfg" GIT_WORK_TREE="$HOME" command git "$@"
}
compdef config=git   # reuse git's completions
