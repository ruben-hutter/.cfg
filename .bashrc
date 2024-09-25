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

#ignore upper and lowercase when TAB completion
bind "set completion-ignore-case on"

#list
alias ls='ls --color=auto'
alias la='ls -a'
alias ll='ls -la'
alias l='ls'

#fix obvious typo's
alias cd..='cd ..'

## Colorize the grep command output for ease of use (good for log files)##
alias grep='grep --color=auto'
alias egrep='egrep --color=auto'
alias fgrep='fgrep --color=auto'

#readable output
alias df='df -h'

#free
alias free="free -mt"

# Aliases for software managment
# pacman or pm
alias pacman='sudo pacman --color auto'
alias update='sudo pacman -Syyu'
alias upal="paru -Syu"

#get fastest mirrors in your neighborhood
alias mirror="sudo reflector -f 30 -l 30 --number 10 --verbose --save /etc/pacman.d/mirrorlist"

#Cleanup orphaned packages
alias cleanup='sudo pacman -Rns $(pacman -Qtdq)'


#create a file called .bashrc-personal and put all your personal aliases
#in there. They will not be overwritten by skel.
[[ -f ~/.bashrc-personal ]] && . ~/.bashrc-personal

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

# .gitignore file creator
function gi() { curl -sL https://www.toptal.com/developers/gitignore/api/$@ ;}

# Start Starship
eval "$(starship init bash)"

# Pywal
cat ~/.cache/wal/sequences

# Start fastfetch
fastfetch
