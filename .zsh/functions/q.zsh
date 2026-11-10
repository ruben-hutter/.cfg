# one-shot question via zai. Renders via glow.
# Smart Enter in .zshrc quotes the rest of the line, so `q who is ceo (tl)`
# works unquoted — no parens/quoting caveats like in nushell.
q() {
    if (( $# == 0 )); then
        print -u2 "usage: q <question>  e.g. q who is the ceo of the swiss army"
        return 2
    fi

    local model="zai/glm-5.3-flash:off"
    local tmp=$(mktemp) rc=1

    if pi -p --no-session --no-tools --no-context-files --model "$model" "$@" >$tmp 2>/dev/null; then
        if command -v glow >/dev/null; then
            glow - <$tmp
        else
            cat $tmp
        fi
        rc=0
    else
        cat $tmp
        echo "q: provider failed: $model"
    fi
    rm -f $tmp
    return $rc
}
