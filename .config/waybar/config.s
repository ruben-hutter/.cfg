// __        __          _                 
// \ \      / /_ _ _   _| |__   __ _ _ __  
//  \ \ /\ / / _` | | | | '_ \ / _` | '__| 
//   \ V  V / (_| | |_| | |_) | (_| | |    
//    \_/\_/ \__,_|\__, |_.__/ \__,_|_|    
//                 |___/                   
//  
// by Stephan Raabe (2023) 
// ----------------------------------------------------- 
//
{
    // General Settings

    // Position TOP
    "layer": "top",
    "margin-top": 14,
    "margin-bottom": 0,

    // Position BOTTOM
    // "position": "bottom",
    // "margin-top": 0,
    // "margin-bottom": 14,
    
    "layer": "top",
    "height": 16,
    "margin-left": 0,
    "margin-right": 0,    
    "spacing": 0,

    // Load Modules
    "include": ["~/dotfiles/waybar/modules.json"],

    // Modules Left
    "modules-left": [
        "custom/appmenu",
        "custom/wallpaper",
        "custom/waybarthemes",          
        "wlr/taskbar",
        "group/quicklinks",
        "hyprland/window"
    ],

    // Modules Center
    "modules-center": [
        "hyprland/workspaces"
    ],

    // Modules Right    
    "modules-right": [
        "custom/updates",
        "pulseaudio",
        "bluetooth",
        "battery", 
        "group/hardware",
        "custom/cliphist",
        "network",
        "custom/exit",
        "clock"
    ],

    // Group Quicklinks
    "group/quicklinks": {
        "orientation": "horizontal",
        "modules": [
            "custom/filemanager",
            "custom/brave",
         ]
    },

    // Group Hardware
    "group/hardware": {
        "orientation": "horizontal",
        "modules": [
            "disk",
            "cpu",
            "memory"
        ]
    }
}
