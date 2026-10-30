function q --description "Quick one-shot question (SwissAI, rendered markdown)"
    if test (count $argv) -eq 0
        echo "usage: q <question>  e.g. q who is the ceo of the swiss army"
        return 2
    end

    # SwissAI first (free CSCS platform; the extension pulls the key from pass
    # itself via !pass show), then your zai plan as last resort.
    # then your zai plan as last resort. Falls back silently if a provider fails.
    set -l candidates
    set -q SWISSAI_API_KEY; and set -a candidates swissai/CSCS-Inference/google/gemma-4-31B-it swissai/RCP-AIaaS/zai-org/GLM-5.3-Flash
    set -a candidates zai/glm-5.3-flash:off

    set -l tmp (mktemp)
    set -l rc 1
    for m in $candidates
        if pi -p --no-session --no-tools --no-context-files --model $m $argv >$tmp 2>/dev/null
            if type -q glow
                glow - <$tmp
            else
                cat $tmp
            end
            set rc 0
            break
        end
    end
    if test $rc -ne 0
        cat $tmp
        echo "q: all providers failed (tried: $candidates)"
    end
    rm -f $tmp
    return $rc
end
