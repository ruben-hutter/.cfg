# Load environment variables
set GTK_THEME Adwaita:dark
set EDITOR nvim
set SSH_AUTH_SOCK "$XDG_RUNTIME_DIR/keyring/ssh"
set -gx PNPM_HOME "$HOME/.local/share/pnpm"
fish_add_path $PNPM_HOME

if status is-interactive
    # Suppress the default fish greeting
    set fish_greeting

    # Set fish vi key bindings
    fish_user_key_bindings

    # Print fastfetch
    fastfetch

    # Starship prompt
    starship init fish | source

    # Set up fzf key bindings
    fzf --fish | source

    # Enable direnv
    eval (direnv hook fish)
end

