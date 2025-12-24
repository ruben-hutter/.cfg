#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

export HISTCONTROL=ignoreboth:erasedups

#PS1='[\u@\h \W]\$ '
PS1='\[\e[0;31m\]\u\[\e[m\] \[\e[1;34m\]\w\[\e[m\] \[\e[0;31m\]\$ \[\e[m\]\[\e[0;32m\] '

# Ignore upper and lowercase when TAB completion
bind "set completion-ignore-case on"

if [ -d "$HOME/.bin" ]; then
    export PATH="$HOME/.bin:$PATH"
fi

if [ -d "$HOME/.local/bin" ]; then
    export PATH="$HOME/.local/bin:$PATH"
fi

if [ -d "$HOME/go/bin" ]; then
    export PATH="$HOME/go/bin:$PATH"
fi

# Cargo setup
if [ -f "$HOME/.cargo/env" ]; then
    . "$HOME/.cargo/env"
fi

# Haskell setup
if [ -f "$HOME/.ghcup/env" ]; then
    . "$HOME/.ghcup/env"
fi

# Start fish shell
# Comment out the following lines if you want to use bash
#if [ -x /usr/bin/fish ]; then
#    exec /usr/bin/fish
#fi

if [ -f "$HOME/.bashrc-personal" ]; then
    . "$HOME/.bashrc-personal"
fi

# Start Starship
eval "$(starship init bash)"

# Start fastfetch
fastfetch

# Set up fzf key bindings and fuzzy completion
eval "$(fzf --bash)"

# pnpm
export PNPM_HOME="/home/ruben/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end
