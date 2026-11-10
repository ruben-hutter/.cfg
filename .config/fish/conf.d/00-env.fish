# ============================================================================
# Environment — sourced for every fish shell, before config.fish.
# Keep this non-interactive: no prompts, no fetches, env/PATH only.
# ============================================================================

set -gx EDITOR nvim
set -gx SSH_AUTH_SOCK "$XDG_RUNTIME_DIR/ssh-agent.socket"
set -gx PNPM_HOME "$HOME/.local/share/pnpm"

# Custom bin directories
fish_add_path $HOME/.pi/agent/bin
fish_add_path $HOME/.local/bin
fish_add_path $HOME/scripts

# Language-specific paths
fish_add_path $HOME/go/bin
fish_add_path $HOME/.ghcup/bin
fish_add_path $HOME/.cabal/bin
fish_add_path $HOME/.juliaup/bin

# Tools
fish_add_path $PNPM_HOME
fish_add_path $HOME/.opencode/bin
fish_add_path $HOME/.local/share/JetBrains/Toolbox/scripts
