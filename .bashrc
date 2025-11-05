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

# Bun setup
if [ -d "$HOME/.bun/bin" ]; then
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Start fish shell
# Comment out the following lines if you want to use bash
if [ -x /usr/bin/fish ]; then
    exec /usr/bin/fish
fi

if [ -f "$HOME/.bashrc-personal" ]; then
    . "$HOME/.bashrc-personal"
fi

# Start Starship
eval "$(starship init bash)"

# Start fastfetch
fastfetch

# Set up fzf key bindings and fuzzy completion
eval "$(fzf --bash)"

# >>> conda initialize >>>
# !! Contents within this block are managed by 'conda init' !!
__conda_setup="$('$HOME/miniconda3/bin/conda' 'shell.bash' 'hook' 2> /dev/null)"
if [ $? -eq 0 ]; then
    eval "$__conda_setup"
else
    if [ -f "$HOME/miniconda3/etc/profile.d/conda.sh" ]; then
        . "$HOME/miniconda3/etc/profile.d/conda.sh"
    else
        export PATH="$HOME/miniconda3/bin:$PATH"
    fi
fi
unset __conda_setup
# <<< conda initialize <<<

