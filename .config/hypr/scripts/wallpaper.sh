#!/usr/bin/env bash

# ----------------------------------------------------- 
# Set wallpaper
# ----------------------------------------------------- 
wallpaper=~/wallpapers/astronaut_jellyfish.jpg

# ----------------------------------------------------- 
# Copy selected wallpaper into .cache folder
# ----------------------------------------------------- 
ln -snf $wallpaper ~/.cache/current_wallpaper

# ----------------------------------------------------- 
# Launch matugen
# ----------------------------------------------------- 
matugen image ~/.cache/current_wallpaper &

# ----------------------------------------------------- 
# Launch waybar
# ----------------------------------------------------- 
waybar -c ~/.config/waybar/config -s ~/.config/waybar/style.css &
