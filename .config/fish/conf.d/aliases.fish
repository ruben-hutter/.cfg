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
alias pacman='pacman --color auto'
alias update='pacman -Syyu'
alias upal="paru -Syu"

#get fastest mirrors in your neighborhood
alias mirror="reflector -f 30 -l 30 --number 10 --verbose --save /etc/pacman.d/mirrorlist"

#Cleanup orphaned packages
alias cleanup='pacman -Rns $(pacman -Qtdq)'

# git-bare repo for dotfiles
alias config="/usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME"

# get oath code from yubikey
alias ykcode="ykman oath accounts code"

# clearaaa
alias clera="clear"

# neovim alias
alias nv="nvim"

# open vscode with ozone
alias code="env ELECTRON_OZONE_PLATFORM_HINT=auto code"

# tmux session manager
alias tm="~/scripts/tmux_session_manager.sh"

# uni vpn
alias vpn="~/scripts/vpn_uni.sh"

# lauch lazygit
alias lg="lazygit"

