#
# ~/.bash_profile — entry point for bash *login* shells.
# bash reads only the FIRST of ~/.bash_profile, ~/.bash_login, ~/.profile,
# so this file chain-loads the others.
#

[[ -f ~/.bashrc ]] && . ~/.bashrc
[[ -f ~/.profile ]] && . ~/.profile

# Start niri on tty1 (dormant while fish is the login shell; guarded, harmless).
# NIRI_AUTOSTART prevents re-entry: niri-session re-invokes "$SHELL -l -c" once.
if [ -z "$NIRI_AUTOSTART" ] && [ "$(tty)" = "/dev/tty1" ] && [ -z "$WAYLAND_DISPLAY" ] && command -v niri-session >/dev/null 2>&1; then
    export NIRI_AUTOSTART=1
    exec niri-session
fi
