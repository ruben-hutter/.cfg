#
# ~/.bashrc — interactive bash setup.
# Environment/PATH lives in ~/.profile (sourced by ~/.bash_profile).
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

export HISTCONTROL=ignoreboth:erasedups

#PS1='[\u@\h \W]\$ '
PS1='\[\e[0;31m\]\u\[\e[m\] \[\e[1;34m\]\w\[\e[m\] \[\e[0;31m\]\$ \[\e[m\]\[\e[0;32m\] '

# Ignore upper and lowercase when TAB completion
bind "set completion-ignore-case on"

if [ -f "$HOME/.bashrc-personal" ]; then
    . "$HOME/.bashrc-personal"
fi

# Start Starship
eval "$(starship init bash)"

# Start fastfetch
fastfetch

# Set up fzf key bindings and fuzzy completion
eval "$(fzf --bash)"

# Enable direnv (auto-activate nix dev shells via .envrc)
eval "$(direnv hook bash)"
