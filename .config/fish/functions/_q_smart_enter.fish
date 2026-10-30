function _q_smart_enter --description "Quote the rest of the line when running 'q ...' without quotes"
    set -l buf (commandline)
    if string match -q 'q *' -- $buf
        set -l rest (string sub --start=3 -- $buf)
        # Leave it alone if already quoted or contains shell operators/pipes
        if not string match -qr '[|;&<>()]' -- $rest; and not string match -q '"*"' -- $rest; and not string match -q "'*'" -- $rest
            commandline -r 'q '(string escape -- "$rest")
        end
    end
    commandline -f execute
end
