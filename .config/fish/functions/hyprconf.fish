function hyprconf
    # Open the configuration directory in the default editor
    pushd $HOME/.config/hypr && $EDITOR . && popd
end

