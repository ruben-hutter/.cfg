# ============================================================================
# Environment Variables
# ============================================================================
#set GTK_THEME Adwaita:dark
set EDITOR nvim
#set -gx SSH_AUTH_SOCK "$XDG_RUNTIME_DIR/gcr/ssh"
set -gx SSH_AUTH_SOCK "$HOME/.var/app/com.bitwarden.desktop/data/.bitwarden-ssh-agent.sock"
set -gx PNPM_HOME "$HOME/.local/share/pnpm"

# ============================================================================
# PATH Setup
# ============================================================================
# Custom bin directories
fish_add_path $HOME/.local/bin
fish_add_path $HOME/scripts

# Language-specific paths
fish_add_path $HOME/go/bin
fish_add_path $HOME/.ghcup/bin
fish_add_path $HOME/.cabal/bin

# Package managers
fish_add_path $PNPM_HOME

if status is-interactive
    # Suppress the default fish greeting
    set fish_greeting

    # Set fish vi key bindings
    fish_user_key_bindings

    # Print fastfetch
    fastfetch

    # Print walrus stats
    walrus show -p month

    # Starship prompt
    starship init fish | source

    # Set up fzf key bindings
    fzf --fish | source

    # Enable direnv
    eval (direnv hook fish)

    # Nix Daemon
    if test -e /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.fish
        source /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.fish
    end

    # opencode
    fish_add_path /home/ruben/.opencode/bin
end
