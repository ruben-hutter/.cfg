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

# >>> conda initialize >>>
# !! Contents within this block are managed by 'conda init' !!
if test -f /home/ruben/miniconda3/bin/conda
    eval /home/ruben/miniconda3/bin/conda "shell.fish" "hook" $argv | source
else
    if test -f "/home/ruben/miniconda3/etc/fish/conf.d/conda.fish"
        . "/home/ruben/miniconda3/etc/fish/conf.d/conda.fish"
    else
        set -x PATH "/home/ruben/miniconda3/bin" $PATH
    end
end
# <<< conda initialize <<<

