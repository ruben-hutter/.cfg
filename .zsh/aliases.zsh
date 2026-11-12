# Aliases. Custom commands live in functions/*.zsh.

# list
alias ls='ls --color=auto'
alias la='ls -a'
alias ll='ls -la'
alias l='ls'

# fix obvious typo
alias cd..='cd ..'

# colorize grep
alias grep='grep --color=auto'
alias egrep='egrep --color=auto'
alias fgrep='fgrep --color=auto'

# readable output
alias df='df -h'
alias free='free -mt'

# update system on Fedora
alias upal='sudo dnf upgrade --refresh'

# use aliases under sudo too (trailing space expands the next word — zsh honors it)
alias sudo='sudo '

alias code='env ELECTRON_OZONE_PLATFORM_HINT=auto code'

alias rebuild='sudo nixos-rebuild switch --flake ~/nixos-config#nixos'  # NixOS hosts

# yubikey oath codes
alias ykcode='ykman oath accounts code'

# neovim / lazygit
alias nv='nvim'
alias lg='lazygit'

# lazygit for the dotfiles bare repo (~/.cfg)
alias conflg='lazygit --git-dir $HOME/.cfg --work-tree $HOME'

# quick connect to proxcode — remote bashrc drops into the tm picker
alias pxc='ssh proxcode'
