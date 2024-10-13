#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

export HISTCONTROL=ignoreboth:erasedups

#PS1='[\u@\h \W]\$ '
PS1='\[\e[0;31m\]\u\[\e[m\] \[\e[1;34m\]\w\[\e[m\] \[\e[0;31m\]\$ \[\e[m\]\[\e[0;32m\] '

if [ -d "$HOME/.bin" ] ;
  then PATH="$HOME/.bin:$PATH"
fi

if [ -d "$HOME/.local/bin" ] ;
  then PATH="$HOME/.local/bin:$PATH"
fi

# Automatically start ssh-agent
if ! pgrep -u "$USER" ssh-agent > /dev/null; then
    ssh-agent -t 1h > "$XDG_RUNTIME_DIR/ssh-agent.env"
fi
if [[ ! "$SSH_AUTH_SOCK" ]]; then
    source "$XDG_RUNTIME_DIR/ssh-agent.env" > /dev/null
fi

# Cargo setup
if [ -d "$HOME/.cargo/bin" ] ;
  then PATH="$PATH:$HOME/.cargo/bin"
fi

# Haskell setup
[ -f "/home/ruben/.ghcup/env" ] && source "/home/ruben/.ghcup/env" # ghcup-env

# Pywal
cat ~/.cache/wal/sequences

# Start fish shell
# Comment out the following lines if you want to use bash
if [ -x /usr/bin/fish ]; then
    exec /usr/bin/fish
fi

# Ignore upper and lowercase when TAB completion
bind "set completion-ignore-case on"

# Create a file called .bashrc-personal and put all your personal aliases
#in there. They will not be overwritten by skel.
[[ -f ~/.bashrc-personal ]] && . ~/.bashrc-personal

# Start Starship
eval "$(starship init bash)"

# Start fastfetch
fastfetch
