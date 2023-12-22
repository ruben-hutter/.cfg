#!/usr/bin/env bash

sleep 1

killall -q polybar

polybar_log=/home/ruben/polybar.log

connected_monitors=$(xrandr --query | grep " connected" | cut -d" " -f1)

primary_monitor=$(xrandr --query | grep " primary" | cut -d" " -f1)

MONITOR="$primary_monitor" polybar -r mybar &

while ! pgrep -x "polybar" > /dev/null; do sleep 1; done

for monitor in $connected_monitors; do
    if [ "$monitor" != "$primary_monitor" ]; then
        MONITOR="$monitor" polybar -r mybar &
    fi
done

