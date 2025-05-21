# This tells Fish to use git's completions for the 'config' function
# for subcommands (commit, branch, etc.) and their options.
complete -c config -w git

# Specific file path completions for 'config add'
#   -n "__fish_seen_subcommand_from add": Condition: only when 'add' is the subcommand.
#   -f: Force file and directory completion.
#   -x: EXCLUSIVE - if this rule matches, don't try other completion rules (like from -w git for args).
#   -a "(__fish_complete_path (commandline -ct))": Action: use Fish's standard path completion,
#                                                 explicitly passing the current token.
complete -c config -n "__fish_seen_subcommand_from add" -f -x -a "(__fish_complete_path (commandline -ct))"
