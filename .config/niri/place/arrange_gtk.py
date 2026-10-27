#!/usr/bin/env python3
"""place — numbered badge on every connected monitor.

Spawned by `place.py setup` / `arrange` / `locate` with one JSON spec per
monitor: {"conn": "DP-4", "desc": "HP 527pq", "index": 2}  ("index" may be
null for the locate phase, where the number is only earned by clicking).

stdin protocol (from the parent):
    SET <conn> <idx>     that monitor's number becomes <idx>
    STATUS <k> <n>       all badges show "k/n picked"
    PHASE locate         numbers reset to "?", hint: click LEFT -> RIGHT
    PHASE arrange        hint: click in order of importance
The user clicks the monitors; `niri msg pick-window` (run by place.py)
relays each click — the window title encodes the connector as "PLACE:<conn>",
and the app id is "place.arrange" so other windows can be ignored.
"""

import json
import sys
import threading

import gi
gi.require_version("Gtk", "4.0")
gi.require_version("Gdk", "4.0")
from gi.repository import GLib, Gdk, Gtk

TITLE_PREFIX = "PLACE:"
APP_ID = "place.arrange"
AUTO_CLOSE_S = 900
PALETTE = ["#0e7490", "#7c3aed", "#b45309", "#15803d", "#be123c",
           "#4d7c0f", "#1d4ed8", "#9d174d", "#0f766e", "#a16207"]

HINTS = {
    "setup-locate": '1/2 · click the screens <b>LEFT → RIGHT</b> (desk order '
                    '— the rightmost is implicit)',
    "setup-arrange": '2/2 · click the screens in your <b>order of importance</b> '
                     '(first click = primary, last implicit)',
    "locate": 'click the screens <b>LEFT → RIGHT</b> (the rightmost is implicit)',
    "arrange": 'click the screens in your <b>order of importance</b> — first '
               'click = primary, the last screen is implicit',
}
QUESTION = '<span size="286720" weight="bold">?</span>'


def num_markup(idx):
    return f'<span size="286720" weight="bold">{idx}</span>'


class Badges(Gtk.Application):
    def __init__(self, specs):
        super().__init__(application_id=APP_ID)
        self.specs = specs
        self.wins = []
        self.nums = {}    # conn -> number label
        self.status = {}  # conn -> progress label
        self.hints = {}   # conn -> hint label
        threading.Thread(target=self.read_updates, daemon=True).start()

    def read_updates(self):
        """Parent feeds commands on stdin as the user clicks / phases change."""
        for line in sys.stdin:
            parts = line.split()
            if len(parts) == 3 and parts[0] == "SET":
                GLib.idle_add(self.set_number, parts[1], parts[2])
            elif len(parts) == 3 and parts[0] == "STATUS":
                GLib.idle_add(self.set_status, parts[1], parts[2])
            elif len(parts) == 2 and parts[0] == "PHASE":
                GLib.idle_add(self.set_phase, parts[1])
        return False

    def set_number(self, conn, idx):
        label = self.nums.get(conn)
        if label:
            label.set_markup(num_markup(idx))
        return False

    def set_status(self, picked, total):
        for label in self.status.values():
            label.set_markup(f'<span size="20480" weight="bold">{picked}/{total} picked</span>')
        return False

    def set_phase(self, phase):
        hint = HINTS.get(f"{phase}")
        for label in self.hints.values():
            if hint:
                label.set_markup(f'<span size="18432">{hint}</span>\n'
                                 '<span size="16384">Ctrl-C in the terminal to cancel</span>')
        if phase == "locate":
            for label in self.nums.values():
                label.set_markup(QUESTION)
        return False

    def do_activate(self):
        disp = Gdk.Display.get_default()
        provider = Gtk.CssProvider()
        css = "\n".join(
            f".badge{i} {{ background: {PALETTE[i % len(PALETTE)]}; }}\n"
            ".badge-text { color: white; }"
            for i in range(len(self.specs)))
        provider.load_from_string(css)
        Gtk.StyleContext.add_provider_for_display(
            disp, provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)

        monitors = disp.get_monitors()  # Gio.ListModel of Gdk.Monitor
        n_monitors = monitors.get_n_items()
        for i, spec in enumerate(self.specs):
            idx = next((m for m in range(n_monitors)
                        if mon_conn(monitors.get_item(m)) == spec["conn"]), None)
            if idx is None:
                print(f"no monitor for {spec['conn']}", file=sys.stderr)
                continue
            self.wins.append(self.make_badge(monitors.get_item(idx), i, spec))

        GLib.timeout_add_seconds(AUTO_CLOSE_S, self.quit)
        for win in self.wins:
            win.present()

    def make_badge(self, mon, color_idx, spec):
        win = Gtk.Window(application=self)
        win.set_title(TITLE_PREFIX + spec["conn"])
        win.add_css_class(f"badge{color_idx}")
        win.set_decorated(False)

        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=36,
                      valign=Gtk.Align.CENTER, halign=Gtk.Align.CENTER)
        box.set_margin_bottom(60)
        num = Gtk.Label()
        num.set_markup(num_markup(spec["index"]) if spec.get("index") else QUESTION)
        num.add_css_class("badge-text")
        self.nums[spec["conn"]] = num
        status = Gtk.Label()
        status.set_markup('<span size="20480" weight="bold">0/%d picked</span>'
                          % len(self.specs))
        status.add_css_class("badge-text")
        self.status[spec["conn"]] = status
        conn = Gtk.Label()
        conn.set_markup(
            f'<span size="40960" weight="bold">{spec["conn"]}</span>\n'
            f'<span size="24576">{spec["desc"]}</span>')
        conn.add_css_class("badge-text")
        hint = Gtk.Label()
        hint.set_markup('<span size="18432">click the screens in your order '
                        'of importance — first click = primary, the last '
                        'screen is implicit</span>\n'
                        '<span size="16384">Ctrl-C in the terminal to cancel</span>')
        hint.add_css_class("badge-text")
        self.hints[spec["conn"]] = hint
        for w in (num, conn, hint, status):
            box.append(w)
        win.set_child(box)
        win.fullscreen_on_monitor(mon)
        return win


def mon_conn(mon):
    try:
        return mon.get_connector()
    except AttributeError:
        return mon.get_property("connector")


if __name__ == "__main__":
    raise SystemExit(Badges(json.loads(sys.argv[1])).run(None))
