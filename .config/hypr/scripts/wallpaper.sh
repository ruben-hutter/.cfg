#!/usr/bin/env bash

# ----------------------------------------------------- 
# Set wallpaper
# ----------------------------------------------------- 
wal -q -i ~/wallpapers/astronaut_jellyfish.jpg

# ----------------------------------------------------- 
# Load current pywal color scheme
# ----------------------------------------------------- 
source "$HOME/.cache/wal/colors.sh"

# ----------------------------------------------------- 
# Copy selected wallpaper into .cache folder
# ----------------------------------------------------- 
cp $wallpaper ~/.cache/current_wallpaper.jpg

# ----------------------------------------------------- 
# Set the new wallpaper
# ----------------------------------------------------- 
swww-daemon &
sleep 1
swww img $wallpaper &

# ----------------------------------------------------- 
# Launch waybar
# ----------------------------------------------------- 
waybar -c ~/.config/waybar/config -s ~/.config/waybar/style.css &
