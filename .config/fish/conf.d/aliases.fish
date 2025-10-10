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
alias update='sudo dnf check-update && sudo dnf upgrade'
alias upal="sudo dnf upgrade --refresh"

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

# open a new note in nvim
alias nn="~/scripts/new_note.sh"

# lauch lazygit
alias lg="lazygit"

