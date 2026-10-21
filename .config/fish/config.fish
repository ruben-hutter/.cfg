# ============================================================================
# Interactive setup only.
# Environment/PATH:  ~/.config/fish/conf.d/00-env.fish
# Session autostart: ~/.config/fish/conf.d/99-niri-autostart.fish
# ============================================================================

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
end
