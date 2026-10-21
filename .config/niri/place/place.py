#!/usr/bin/env python3
"""place — keep niri workspaces arranged by monitor role across setup changes.

Model (see layout.py): workspaces form one canonical strip, cut into blocks
by role (block 0 = primary monitor's workspaces, block 1 = secondary,
block 2 = laptop screen). When the connected monitor set changes to a known
setup, the strip is cut and each block is placed on its role's monitor.

Run:
    place.py watch    poll; converge on setup changes (while unlocked)
    place.py apply    one convergence pass now
    place.py show     current world + remembered state

Config: ~/.config/niri/place.json   (setup table: role -> monitor identity)
State:  ~/.local/state/place/state.json
"""

import json
import os
import subprocess
import sys
import threading
import time
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import layout
from niri import Niri

CONF = Path.home() / ".config/niri/place.json"
STATE = Path.home() / ".local/state/place/state.json"
POLL = 5.0
APPLY_TIMEOUT = 8.0
MAX_TRIES = 4
RETRY_PAUSE = 0.3


def log(msg):
    STATE.parent.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y-%m-%dT%H:%M:%S")
    with open(STATE.parent / "place.log", "a") as f:
        f.write(f"{stamp} {msg}\n")


def notify(title, body):
    try:
        subprocess.Popen(
            ["notify-send", "--app-name=place", "--icon=video-display",
             "--urgency=normal", "--category=device", "--transient", title, body],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except OSError as e:
        log(f"notify failed: {e}")


def session_token():
    return os.path.basename(os.environ.get("NIRI_SOCKET", "unknown"))


def load_state():
    if STATE.exists():
        d = json.loads(STATE.read_text())
    else:
        d = {}
    if d.get("session") != session_token():
        # new niri session: workspace ids are dead; block sizes survive and
        # become the distribution target while the user re-opens work
        sizes = d.get("sizes")
        d = {"order": [], "sizes": sizes, "session": session_token(),
             "fresh": sizes is not None}
        log(f"new session detected, sizes {sizes}")
    return d


def save_state(state):
    STATE.parent.mkdir(parents=True, exist_ok=True)
    state["session"] = session_token()
    STATE.write_text(json.dumps(state, indent=1))


def start_lock_watch():
    """Track niri's session lock from its journal. While locked, niri
    silently drops every IPC action — so applying is pointless."""
    flag = {"locked": False}

    def consider(line):
        if "unlocking session" in line:
            flag["locked"] = False
        elif "locking session" in line:
            flag["locked"] = True

    def run():
        seed = subprocess.run(
            ["journalctl", "--user", "-n", "300", "-o", "cat"],
            capture_output=True, text=True)
        for line in seed.stdout.splitlines():
            consider(line)
        proc = subprocess.Popen(
            ["journalctl", "--user", "-f", "-n", "0", "-o", "cat"],
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
        for line in proc.stdout:
            consider(line)

    threading.Thread(target=run, daemon=True).start()
    return flag


def converge(niri, state, conns, deadline=APPLY_TIMEOUT, attempts=2):
    """Send moves until reality matches (order, sizes), verifying each step
    (niri can accept-but-drop moves). Retries the whole pass a couple of
    times before giving up and reporting. Returns (ok, n_pending)."""
    for attempt in range(1, attempts + 1):
        tries = {}
        end = time.time() + deadline
        ok = False
        while time.time() < end:
            _, workspaces, windows = niri.state()
            moves = layout.plan(state, conns, workspaces, windows)
            if not moves:
                return True, 0
            pending = [m for m in moves if tries.get(m[0], 0) < MAX_TRIES]
            if not pending:
                log(f"ERROR apply attempt {attempt}: workspaces refuse to "
                    f"move: {sorted(set(m[0] for m in moves))}")
                break
            wid, conn, idx = pending[0]
            log(f"move ws {wid} -> {conn}#{idx} (try {tries.get(wid, 0) + 1})")
            r1 = niri.raw({"MoveWorkspaceToMonitor": {"output": conn, "reference": {"Id": wid}}})
            r2 = niri.raw({"MoveWorkspaceToIndex": {"index": idx, "reference": {"Id": wid}}})
            if (r1, r2) != ("\"Handled\"", "\"Handled\""):
                log(f"WARNING unexpected responses: {r1!r} {r2!r}")
            tries[wid] = tries.get(wid, 0) + 1
            time.sleep(RETRY_PAUSE)
        if not ok and attempt < attempts:
            log(f"apply attempt {attempt} incomplete - retrying after pause")
            time.sleep(1.5)
    _, workspaces, windows = niri.state()
    leftover = layout.plan(state, conns, workspaces, windows)
    return (not leftover), len(leftover)


def tick(niri, setups, state, last_setup, locked):
    """One poll. Returns the setup name, or None if unknown / deferred."""
    outputs, workspaces, windows = niri.state()
    identities = [layout.identity(o) for o in outputs.values()]
    setup = layout.detect_setup(setups, identities)
    if not setup:
        return None

    name = setup.get("name") or "?"
    conns = layout.role_conns(setup, outputs)
    lists = layout.observed_lists(workspaces, windows, conns)
    changed = name != last_setup

    if changed:
        # transition: place the blocks per current state
        if locked:
            log(f"setup {name} detected but session is locked - deferring")
            return None  # not marking it done: retried on a later poll
        if state.get("fresh") and not state.get("order"):
            state["order"] = [i for l in lists for i in l]
            log(f"fresh session at {name}: adopting strip for distribution")
        if not state.get("sizes"):
            # first run ever: adopt the current arrangement as the layout
            state.update(layout.learn(state, lists))
            log(f"learned initial layout at {name}: sizes {state['sizes']}")
        ok, pending = converge(niri, state, conns)
        restore_focus(niri, conns, ok)
        if ok:
            state.pop("fresh", None)  # distribution phase done
        log(f"applied {name}: {'ok' if ok else f'INCOMPLETE ({pending} pending)'}")
        if not ok:
            notify(f"place: {name} (incomplete)",
                   "some workspaces refused to move - see place.log")
        return name
    # settled: follow the user's arrangement (also runs while locked -
    # keybinds work there). NEVER on a transition tick: reality is
    # mid-switch, and learning from it would corrupt the strip.
    state.update(layout.learn(state, lists, freeze_sizes=state.get("fresh", False)))
    return name


def cmd_watch(niri, setups, state):
    log(f"watcher started (pid {os.getpid()})")
    locked = start_lock_watch()
    last_setup = None
    while True:
        time.sleep(POLL)
        try:
            name = tick(niri, setups, state, last_setup, locked["locked"])
            last_setup = name  # None (unknown/deferred) -> retried next poll
            if name is not None:
                save_state(state)
        except Exception as e:
            log(f"ERROR tick: {e}")


def restore_focus(niri, conns, converged):
    """After a transition, show each monitor's first occupied workspace (its
    frontmost used one, skipping the leading buffer empty). The primary is
    focused last, so it keeps keyboard focus. Uses a fresh snapshot: the
    workspaces only sit on their new monitors once converge is done. Skipped
    when the apply did not converge (the world is in an unexpected shape;
    better not to move focus around it)."""
    if not converged:
        return
    _, workspaces, windows = niri.state()
    picks = layout.first_occupied(workspaces, windows, conns)
    for r in list(range(1, len(conns))) + [0]:  # primary last
        if picks[r] is not None:
            niri.raw({"FocusWorkspace": {"reference": {"Id": picks[r]}}})
    log(f"restored focus to first used workspace per monitor: {picks}")


def cmd_apply(niri, setups, state):
    outputs, workspaces, windows = niri.state()
    setup = layout.detect_setup(setups, [layout.identity(o) for o in outputs.values()])
    if not setup:
        sys.exit("no known setup for the connected monitors")
    conns = layout.role_conns(setup, outputs)
    lists = layout.observed_lists(workspaces, windows, conns)
    state.update(layout.learn(state, lists, freeze_sizes=state.get("fresh", False)))
    ok, failed = converge(niri, state, conns)
    save_state(state)
    print(f"{setup.get('name')}: {'ok' if ok else f'INCOMPLETE ({failed} pending)'}")


def cmd_show(niri, setups, state):
    outputs, workspaces, windows = niri.state()
    setup = layout.detect_setup(setups, [layout.identity(o) for o in outputs.values()])
    print(f"setup: {setup.get('name') if setup else 'UNKNOWN'}")
    for conn in sorted(outputs):
        for w in sorted(workspaces, key=lambda w: (w["output"], w["idx"])):
            if w["output"] == conn:
                n = sum(1 for x in windows if x["workspace_id"] == w["id"])
                print(f"  {conn:6s} #{w['idx']:2d} id={w['id']:4d} {n} win")
    print(f"sizes: {state.get('sizes')}")
    print(f"order: {state.get('order')}")


def main():
    niri = Niri()
    setups = json.loads(CONF.read_text())["setups"]
    state = load_state()
    cmd = sys.argv[1] if len(sys.argv) > 1 else "watch"
    if cmd == "watch":
        cmd_watch(niri, setups, state)
    elif cmd == "apply":
        cmd_apply(niri, setups, state)
    elif cmd == "show":
        cmd_show(niri, setups, state)
    else:
        sys.exit(f"unknown command {cmd!r}")


if __name__ == "__main__":
    main()
