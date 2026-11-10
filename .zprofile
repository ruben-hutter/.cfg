# Login shells only (getty, ssh, `zsh -l`). Env/PATH live here so the
# session environment (niri, GUI apps, tmux) inherits it once; interactive
# polish is in .zshrc. niri-session re-invokes "$SHELL -l -c" once — the
# NIRI_AUTOSTART marker makes that inner login shell skip the boot hook.

# Boot straight into niri on tty1 (getty autologin; replaces SDDM).
# Guards: no marker yet + tty1 + no Wayland session yet + niri installed.
# readlink on fd 0 instead of `tty`: no failure when stdin isn't a terminal.
if [[ -z $NIRI_AUTOSTART ]] \
   && [[ $(readlink -f /proc/self/fd/0) == /dev/tty1 ]] \
   && [[ -z $WAYLAND_DISPLAY ]] \
   && command -v niri-session >/dev/null 2>&1; then
    export NIRI_AUTOSTART=1
    exec niri-session
fi

# --- Wayland hints (as in the nushell setup) ---
export GDK_BACKEND=wayland
export MOZ_ENABLE_WAYLAND=1
export OZONE_PLATFORM_HINT=wayland
export XDG_SESSION_TYPE=wayland
export XWAYLAND_NO_GLAMOR=1

# --- Environment ---
export EDITOR=nvim
[[ -n $XDG_RUNTIME_DIR ]] && export SSH_AUTH_SOCK="$XDG_RUNTIME_DIR/ssh-agent.socket"
export PNPM_HOME="$HOME/.local/share/pnpm"

# --- PATH (deduped; `typeset -U` keeps it that way) ---
typeset -U path PATH
path=(
    $HOME/.pi/agent/bin
    $HOME/.local/bin
    $HOME/scripts
    $HOME/.cargo/bin
    $HOME/go/bin
    $HOME/.ghcup/bin
    $HOME/.cabal/bin
    $HOME/.juliaup/bin
    $PNPM_HOME
    $HOME/.opencode/bin
    $HOME/.local/share/JetBrains/Toolbox/scripts
    $path
)

# --- Nix (the shipped POSIX script handles PATH/NIX_PROFILES/XDG_DATA_DIRS) ---
[[ -e /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh ]] \
    && . /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh

# --- Rustup ---
[[ -f $HOME/.cargo/env ]] && . $HOME/.cargo/env
