function pxc --description 'connect to proxcode and pick a tmux session'
    ssh -t proxcode "~/scripts/tmux_session_manager.sh"
end
