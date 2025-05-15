function venv
    if test -f .venv/bin/activate.fish
        source .venv/bin/activate.fish
    else if test -f $HOME/.venv/bin/activate.fish
        source $HOME/.venv/bin/activate.fish
    else
        echo "No virtualenv found"
    end
end
