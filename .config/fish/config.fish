# Load environment variables
source ~/.profile

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

