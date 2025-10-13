#!/usr/bin/env bash

# ----------------------------------------------------- 
# Set wallpaper
# ----------------------------------------------------- 
wallpaper="$HOME/wallpapers/astronaut_jellyfish.jpg"

# ----------------------------------------------------- 
# Copy selected wallpaper into .cache folder
# ----------------------------------------------------- 
ln -snf "$wallpaper" "$HOME/.cache/current_wallpaper"

# ----------------------------------------------------- 
# Launch swww
# ----------------------------------------------------- 
swww-daemon &
sleep 1

# ----------------------------------------------------- 
# Launch matugen
# ----------------------------------------------------- 
matugen image "$wallpaper" &

# ----------------------------------------------------- 
# Launch waybar
# ----------------------------------------------------- 
waybar -c "$HOME/.config/waybar/config" -s "$HOME/.config/waybar/style.css" &
