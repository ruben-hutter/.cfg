# Interactive setup only (.zshrc is sourced exclusively by interactive shells).
# Environment/PATH:  ~/.zprofile

# --- History (starting fresh; shared across live shells) ---
HISTFILE="$HOME/.local/share/zsh/history"
HISTSIZE=50000
SAVEHIST=50000
setopt share_history          # append + import between shells live
setopt hist_ignore_dups       # skip consecutive duplicates
setopt hist_find_no_dups      # history navigation skips duplicates (bash 'erasedups' feel)
setopt hist_expire_dups_first # trim duplicates first when HISTSIZE fills
setopt hist_ignore_space      # leading space = off the record
setopt hist_reduce_blanks     # normalize whitespace
setopt extended_history       # record timestamps

# --- Directory history ---
setopt auto_pushd             # cd pushes onto a dir stack -> cd -, cd -<Tab>
setopt pushd_ignore_dups      # no consecutive duplicates in that stack
setopt pushd_minus            # cd -1 means 'one back', not 'stack slot 1'

# --- Globbing ---
# Without this, zsh errors on any pattern with no match — e.g. unquoted
# URLs containing [] or {} — instead of passing them to the command.
setopt no_nomatch

# --- Shell feel ---
setopt auto_cd                # type a directory name to cd into it
setopt interactive_comments   # `# ...` works on the command line
setopt no_beep
setopt extended_glob          # ^pat, *(.), etc.

# --- Vi mode + cursor shapes (block=normal, bar=insert) ---
bindkey -v
export KEYTIMEOUT=1           # 10 ms escape latency
zle-keymap-select() {
    [[ $KEYMAP == vicmd ]] && printf '\e[2 q' || printf '\e[6 q'
}
zle-line-init() { printf '\e[6 q' }   # every prompt starts in insert mode
zle -N zle-keymap-select
zle -N zle-line-init

# --- Completion system (generates candidates; fzf-tab renders them below) ---
# ~/.zfunc holds generated tool completions (_cargo, _rustup); must precede compinit
fpath=("$HOME/.zfunc" $fpath)
autoload -Uz compinit
compinit -d $HOME/.cache/zsh/zcompdump
zstyle ':completion:*' menu no                             # no native menu: lets fzf-tab capture the unambiguous prefix
zstyle ':completion:*' special-dirs true                    # 'cd ..' + Tab -> 'cd ../'
# candidate generation: exact/case-insensitive prefix, substring, subsequence.
# NOT replaced by fzf-tab: it fuzzy-filters what compsys offers, so without the
# loose matchers `cd media<Tab>` in lxc/ would find zero candidates and just beep.
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}' 'r:|?=**' 'l:|=* r:|?=**'
[[ -n $LS_COLORS ]] && zstyle ':completion:*' list-colors ${(s.:.)LS_COLORS}
# group headers, shown by fzf-tab inside the fzf list (escape sequences like
# %F{..} are ignored by fzf-tab, so keep this plain to enable grouping)
zstyle ':completion:*:descriptions' format '[%d]'
zstyle ':completion:*' group-name ''

# --- fzf-tab: fish-style fzf completion menu ---
# must load after compinit and before widget-wrapping plugins (autosuggestions,
# syntax-highlighting) — installed: ~/.zsh/plugins/fzf-tab (git clone)
[[ -f $HOME/.zsh/plugins/fzf-tab/fzf-tab.plugin.zsh ]] \
    && source $HOME/.zsh/plugins/fzf-tab/fzf-tab.plugin.zsh

# v in normal mode: edit the current line in $EDITOR (like fish's edit_command_buffer)
autoload -Uz edit-command-line
zle -N edit-command-line
bindkey -M vicmd v edit-command-line

# --- fzf: ctrl-r history, ctrl-t files, alt-c dirs ---
command -v fzf >/dev/null && source <(fzf --zsh)

# --- Fish-style gray autosuggestions ---
[[ -f /usr/share/zsh-autosuggestions/zsh-autosuggestions.zsh ]] \
    && source /usr/share/zsh-autosuggestions/zsh-autosuggestions.zsh
# Accept whole suggestion with → at end of line, word-wise with Alt-f (plugin default)

# --- Tools ---
command -v direnv  >/dev/null && eval "$(direnv hook zsh)"
command -v starship >/dev/null && eval "$(starship init zsh)"

# --- Aliases & functions ---
source "$HOME/.zsh/aliases.zsh"
for _f in "$HOME/.zsh"/functions/*.zsh(N); source "$_f"
unset _f

# --- Smart Enter for `q`: quote the rest of the line ---
# `q who is ceo (tl)` + Enter runs `q who\ is\ ceo\ (tl)` — one argument,
# no quoting needed. Already-quoted input and lines with |;&<>() are left alone.
_q_smart_enter() {
    if [[ $BUFFER == 'q '* ]]; then
        local rest=${BUFFER#q }
        if [[ $rest != *['|;&<>()']* && $rest != \"*\" && $rest != \'*\' ]]; then
            BUFFER="q ${(q)rest}"
        fi
    fi
    zle .accept-line
}
zle -N accept-line _q_smart_enter

# --- Syntax highlighting: must be sourced last (wraps all widgets above) ---
[[ -f /usr/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh ]] \
    && source /usr/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# --- Greeting (only when stdout is a real terminal; `zsh -i -c` skips it) ---
if [[ -t 1 ]]; then
    command -v fastfetch >/dev/null && fastfetch
    command -v walrus   >/dev/null && walrus show -p month
    tm   # tmux session picker; no-op inside tmux
fi
