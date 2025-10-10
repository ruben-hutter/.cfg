#!/usr/bin/env bash

# ----------------------------------------------------- 
# Set wallpaper
# ----------------------------------------------------- 
#wal -q -i ~/wallpapers/astronaut_jellyfish.jpg
wallpaper=~/wallpapers/city_top_view.jpg

# ----------------------------------------------------- 
# Load current pywal color scheme
# ----------------------------------------------------- 
#source "$HOME/.cache/wal/colors.sh"

# ----------------------------------------------------- 
# Copy selected wallpaper into .cache folder
# ----------------------------------------------------- 
ln -snf $wallpaper ~/.cache/current_wallpaper

# ----------------------------------------------------- 
# Set the new wallpaper
# ----------------------------------------------------- 
cat > ~/.config/hypr/hyprpaper.conf << EOF
preload = $wallpaper
wallpaper = , $wallpaper
EOF

# ----------------------------------------------------- 
# Launch waybar
# ----------------------------------------------------- 
waybar -c ~/.config/waybar/config -s ~/.config/waybar/style.css &
