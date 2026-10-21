# Boot straight into niri on tty1 (getty autologin; replaces SDDM).
# Guards: login shell + tty1 + no Wayland session yet + niri installed.
# NIRI_AUTOSTART prevents re-entry: niri-session re-invokes "$SHELL -l -c"
# once to pick up the login-shell environment; the marker makes this inner
# shell skip the hook and proceed. conf.d loads before config.fish, so the
# exec happens before any interactive setup (no fastfetch flash at boot).
if not set -q NIRI_AUTOSTART; and status is-login; and test (tty) = /dev/tty1; and not set -q WAYLAND_DISPLAY; and type -q niri-session
    set -gx NIRI_AUTOSTART 1
    exec niri-session
end
