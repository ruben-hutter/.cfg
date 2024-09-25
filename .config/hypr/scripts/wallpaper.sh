#!/bin/bash

# ----------------------------------------------------- 
# Set wallpaper
# ----------------------------------------------------- 
wal -q -i ~/wallpaper/astronaut_jellyfish.jpg

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
swww img $wallpaper

# ----------------------------------------------------- 
# Launch waybar
# ----------------------------------------------------- 
killall waybar
waybar -c ~/.config/waybar/config -s ~/.config/waybar/style.css &
sleep 1

echo "DONE!"
