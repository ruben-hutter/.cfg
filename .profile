#
# ~/.profile — environment for bash login shells.
# Sourced by ~/.bash_profile. Keep POSIX-sh compatible: no bashisms,
# no interactive setup (that belongs in ~/.bashrc).
#

# local bins
case ":$PATH:" in
    *":$HOME/.local/bin:"*) ;;
    *) [ -d "$HOME/.local/bin" ] && export PATH="$HOME/.local/bin:$PATH" ;;
esac

# Pi
export PATH="/home/ruben/.pi/agent/bin:$PATH"

# go tools
case ":$PATH:" in
    *":$HOME/go/bin:"*) ;;
    *) [ -d "$HOME/go/bin" ] && export PATH="$HOME/go/bin:$PATH" ;;
esac

# pnpm
export PNPM_HOME="$HOME/.local/share/pnpm"
case ":$PATH:" in
    *":$PNPM_HOME:"*) ;;
    *) export PATH="$PNPM_HOME:$PATH" ;;
esac

# cargo/rustup
[ -f "$HOME/.cargo/env" ] && . "$HOME/.cargo/env"

# ghcup
[ -f "$HOME/.ghcup/env" ] && . "$HOME/.ghcup/env"

# juliaup (block moved here from ~/.bash_profile; if juliaup's installer ever
# re-appends its own copy elsewhere, the case-guard keeps PATH dup-free)
case ":$PATH:" in
    *":$HOME/.juliaup/bin:"*) ;;
    *) export PATH="$HOME/.juliaup/bin:$PATH" ;;
esac

# JetBrains Toolbox app launchers (idea, pycharm, ...)
case ":$PATH:" in
    *":$HOME/.local/share/JetBrains/Toolbox/scripts:"*) ;;
    *) export PATH="$PATH:$HOME/.local/share/JetBrains/Toolbox/scripts" ;;
esac
