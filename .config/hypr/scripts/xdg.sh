#!/usr/bin/env bash

sleep 1
killall -e xdg-desktop-portal-hyprland 2>/dev/null
killall -e xdg-desktop-portal-wlr 2>/dev/null
killall -e xdg-desktop-portal 2>/dev/null
sleep 1

/usr/libexec/xdg-desktop-portal-hyprland &
/usr/libexec/xdg-desktop-portal &
