#!/usr/bin/env bash

# ----------------------------------------------------- 
# Set wallpaper
# ----------------------------------------------------- 
wallpaper="$HOME/wallpapers/city_bridge.jpg"

# ----------------------------------------------------- 
# Copy selected wallpaper into .cache folder
# ----------------------------------------------------- 
ln -snf "$wallpaper" "$HOME/.cache/current_wallpaper"

# ----------------------------------------------------- 
# Set the new wallpaper
# ----------------------------------------------------- 
cat > "$HOME/.config/hypr/hyprpaper.conf" << EOF
preload = $wallpaper
wallpaper = , $wallpaper
EOF

# ----------------------------------------------------- 
# Launch waybar
# ----------------------------------------------------- 
matugen image "$HOME/.cache/current_wallpaper" &
