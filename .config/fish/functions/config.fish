function config --description "Manages dotfiles Git repository (bare, in $HOME/.cfg)"
    # Get the actual path to the git executable, bypassing aliases/functions
    set -l git_executable (command -s git)

    # Check if the git command was found
    if test -z "$git_executable"
        echo "Error: The 'git' command was not found in your PATH." >&2
        return 127 # Standard exit code for command not found
    end

    # Set environment variables for this specific command execution
    # and call the actual git executable with the provided arguments.
    env GIT_DIR="$HOME/.cfg" GIT_WORK_TREE="$HOME" "$git_executable" $argv
end
