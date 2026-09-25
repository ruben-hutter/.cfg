
# >>> juliaup initialize >>>

# !! Contents within this block are managed by juliaup !!

case ":$PATH:" in
    *:/home/ruben/.juliaup/bin:*)
        ;;

    *)
        export PATH=/home/ruben/.juliaup/bin${PATH:+:${PATH}}
        ;;
esac

# <<< juliaup initialize <<<


# Added by Toolbox App
export PATH="$PATH:/home/ruben/.local/share/JetBrains/Toolbox/scripts"



# Added by Antigravity CLI installer
export PATH="/home/ruben/.local/bin:$PATH"

[ -f "/home/ruben/.ghcup/env" ] && . "/home/ruben/.ghcup/env" # ghcup-env