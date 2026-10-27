#!/usr/bin/env python3
"""place — keep niri workspaces arranged by monitor role across setup changes.

Model (see layout.py): workspaces form one canonical strip (order), cut into
blocks by role. Every monitor set ever connected is registered automatically
in place.json. A setup is identified by the HUMAN-DECLARED desk order (the
monitors' left-to-right sequence, defined by clicking the on-screen badges) —
niri's auto-layout is only a provisional guess until then. Arriving at a
setup restores its remembered split (block sizes), so returning somewhere
re-creates its arrangement.

`place.py setup` runs whenever a new setup is connected (auto-launched by
the watcher): pass 1 — click the screens LEFT to RIGHT (desk order); pass 2
— click them in order of importance (role order). Roles default to the
centrality rule (centermost = primary) if you skip pass 2. `locate` and
`arrange` redefine desk order / importance separately.

Cold start (new niri session): the strip is whatever is open; the first
arrival at an expanded setup cuts it by that setup's remembered split.

Run:
    place.py watch    poll; converge on setup changes (while unlocked)
    place.py apply    one convergence pass now (registers unknown setups)
    place.py setup    define desk order (L->R) + importance on the badges
    place.py locate   redefine only the desk order (left to right)
    place.py arrange  redefine only the importance order
    place.py align    snap the screens into the declared desk order (runtime)
    place.py show     current world + remembered state
    place.py pause    hands-off: no moves, no learning, until resume
    place.py resume   resume managing; the next poll re-applies

Config: ~/.config/niri/place/place.json — auto-maintained setup table:
    {"name", "id" (hash of desk order), "set" (hash of monitor set),
     "order" (desk order), "roles" (importance, roles[0] = primary),
     "arranged" (roles were explicitly chosen)}
State:  ~/.local/state/place/state.json  (+ paused flag, place.log)
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Any, BinaryIO
from collections.abc import Callable

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import layout
from niri import Niri

CONF = Path.home() / ".config/niri/place/place.json"
STATE = Path.home() / ".local/state/place/state.json"
PAUSED = STATE.parent / "paused"
BADGE = Path(__file__).resolve().parent / "arrange_gtk.py"
BADGE_APP_ID = "place.arrange"
POLL = 5.0
APPLY_TIMEOUT = 8.0
MAX_TRIES = 4
RETRY_PAUSE = 0.3
ARRANGE_TIMEOUT = 120.0

_SET_WARNED: set[str] = set()  # setup ids whose set-fallback mismatch we already announced


def log(msg: str) -> None:
    STATE.parent.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y-%m-%dT%H:%M:%S")
    with open(STATE.parent / "place.log", "a") as f:
        f.write(f"{stamp} {msg}\n")


def notify(title: str, body: str) -> None:
    try:
        subprocess.Popen(
            ["notify-send", "--app-name=place", "--icon=video-display",
             "--urgency=normal", "--category=device", "--transient", title, body],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except OSError as e:
        log(f"notify failed: {e}")


def session_token() -> str:
    return os.path.basename(os.environ.get("NIRI_SOCKET", "unknown"))


def load_setups() -> list[layout.Setup]:
    return json.loads(CONF.read_text())["setups"]


def save_setups(setups: list[layout.Setup]) -> None:
    tmp = CONF.with_name(".place.json.tmp")
    tmp.write_text(json.dumps({"setups": setups}, indent=2) + "\n")
    tmp.replace(CONF)


def load_state() -> layout.State:
    """Read the persisted strip state; migrate it across niri sessions."""
    d = json.loads(STATE.read_text()) if STATE.exists() else {}
    old = d.get("session")
    d = layout.migrate(d, session_token())
    if d.get("session") != old:
        log(f"new session detected, sizes {d.get('sizes')}")
    return d


def save_state(state: layout.State) -> None:
    STATE.parent.mkdir(parents=True, exist_ok=True)
    state["session"] = session_token()
    STATE.write_text(json.dumps(state, indent=1))


def start_lock_watch() -> dict[str, bool]:
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


def register_setup(setups: list[layout.Setup],
                   outputs: layout.Outputs) -> layout.Setup:
    """Add the connected monitor set to place.json. The desk order starts as
    niri's layout guess and becomes authoritative once the user clicks it
    (place setup/locate). Returns the new entry."""
    identities = [layout.identity(o) for o in outputs.values()]
    sid = layout.setup_id(outputs)
    entry = {"name": f"auto-{sid[:4]}",
             "id": sid,
             "set": layout.set_id(identities),
             "order": layout.signature(outputs),
             "roles": layout.default_roles(outputs)}
    setups.append(entry)
    save_setups(setups)
    log(f"registered setup {entry['name']} ({sid}): roles {entry['roles']}")
    notify(f"place: new setup {entry['name']}",
           "click the screens on your monitor: left to right, then by importance")
    return entry


def current_setup(setups: list[layout.Setup],
                  outputs: layout.Outputs) -> tuple[layout.Setup, str, bool]:
    """Detect the connected monitor set. Returns (setup, how, created) with
    how in {"id", "legacy", "set", "new"}."""
    sid = layout.setup_id(outputs)
    identities = [layout.identity(o) for o in outputs.values()]
    setid = layout.set_id(identities)
    setup, how = layout.detect_setup(setups, sid, setid, identities)
    if setup is None:
        return register_setup(setups, outputs), "new", True
    if not setup.get("set"):
        # entries linked before the set-fallback existed: backfill
        setup["set"] = setid
        setup.setdefault("order", layout.signature(outputs))
        save_setups(setups)
    if how == "legacy":
        # hand-written entry seen connected for the first time: link it
        setup["id"] = sid
        setup["set"] = setid
        setup["order"] = layout.signature(outputs)
        setup["arranged"] = True  # hand-tuned roles: don't clobber them later
        save_setups(setups)
        log(f"linked setup {setup.get('name')} to id {sid}")
        return setup, "legacy", False
    return setup, how, False


def converge(niri: Niri, state: layout.State, conns: list[str],
             deadline: float = APPLY_TIMEOUT, attempts: int = 2,
             now: Callable[[], float] = time.time,
             sleep: Callable[[float], None] = time.sleep) -> tuple[bool, int]:
    """Send moves until reality matches (order, sizes), verifying each step
    (niri can accept-but-drop moves). Retries the whole pass a couple of
    times before giving up and reporting. Returns (ok, n_pending).
    now/sleep are seams for tests."""
    for attempt in range(1, attempts + 1):
        tries: dict[int, int] = {}
        end = now() + deadline
        while now() < end:
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
            if not niri.move(wid, conn, idx):
                log(f"WARNING move ws {wid} not handled by niri")
            tries[wid] = tries.get(wid, 0) + 1
            sleep(RETRY_PAUSE)
        if attempt < attempts:
            log(f"apply attempt {attempt} incomplete - retrying after pause")
            sleep(1.5)
    _, workspaces, windows = niri.state()
    leftover = layout.plan(state, conns, workspaces, windows)
    return (not leftover), len(leftover)


def restore_focus(niri: Niri, conns: list[str], converged: bool) -> None:
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
            niri.focus(picks[r])
    log(f"restored focus to first used workspace per monitor: {picks}")


def apply_setup(niri: Niri, state: layout.State, setup: layout.Setup,
                outputs: layout.Outputs, workspaces: list[layout.Workspace],
                windows: list[layout.Window]) -> tuple[bool, int, layout.State]:
    """Arrive at `setup`: restore its remembered split, converge, remember
    the cut. Returns (ok, n_pending)."""
    conns = layout.role_conns(setup, outputs)
    expanded = len(conns) > 1
    sid = setup["id"]
    if expanded and state["splits"].get(sid):
        log(f"restoring split {state['splits'][sid]} for {setup.get('name')}")
    had_sizes = bool(state.get("sizes"))
    state = layout.arrive(state, sid, layout.observed_lists(workspaces, windows, conns))
    if not had_sizes and state.get("sizes"):
        # first run ever: adopt the current arrangement as the baseline
        log(f"learned initial layout at {setup.get('name')}: sizes {state['sizes']}")
    ok, pending = converge(niri, state, conns)
    restore_focus(niri, conns, ok)
    if ok and expanded:
        state = layout.arrived(state, sid)  # distribution phase done
    return ok, pending, state


def tick(niri: Niri, setups: list[layout.Setup], state: layout.State,
         last: tuple[str, str] | None,
         locked: bool) -> tuple[tuple[str, str] | None, layout.State]:
    """One poll. Returns ((name, id), state), or (None, state) if deferred
    (locked) — callers persist the RETURNED state, not their own."""
    outputs, workspaces, windows = niri.state()
    setup, how, created = current_setup(setups, outputs)
    name = setup.get("name") or "?"
    sid = setup["id"]
    if how == "set" and sid not in _SET_WARNED:
        _SET_WARNED.add(sid)
        log(f"setup {name}: monitor set matches but niri's layout differs "
            f"from the declared desk order - use 'place setup' to redefine")
        notify(f"place: {name} looks rearranged",
               "if the monitors moved on your desk: run 'place setup'")
    conns = layout.role_conns(setup, outputs)
    lists = layout.observed_lists(workspaces, windows, conns)
    changed = (name, sid) != last

    if changed:
        # transition: place the blocks per current state
        if locked:
            log(f"setup {name} detected but session is locked - deferring")
            return None, state  # not marking it done: retried on a later poll
        if how == "set":
            # known monitor set, drifted layout: snap the screens back to the
            # declared desk order before applying (runtime-only)
            align_to_desk(niri, setups, outputs, setup)
        if state.get("fresh"):
            # cold start: pre-reboot ids are dead, the strip is whatever is
            # open right now. layout.transition adopts it; fresh stays alive
            # through collapsed time until an expanded arrival cuts it.
            state = layout.transition(state, lists)
            if state.get("cold"):
                log(f"fresh session at {name}: strip adopted, waiting to expand")
        ok, pending, state = apply_setup(niri, state, setup, outputs, workspaces, windows)
        log(f"applied {name}: {'ok' if ok else f'INCOMPLETE ({pending} pending)'}")
        if not ok:
            notify(f"place: {name} (incomplete)",
                   "some workspaces refused to move - see place.log")
        if created:
            launch_setup_tool()  # freshly registered: define it right away
        return (name, sid), state
    # settled: follow the user's arrangement (also runs while locked -
    # keybinds work there). NEVER on a transition tick: reality is
    # mid-switch, and learning from it would corrupt the strip.
    state = layout.settle(state, lists, sid)
    return (name, sid), state


def launch_setup_tool() -> None:
    """Freshly registered setup: pop the badge overlay to define desk order
    and roles right away (detached; times out on its own if ignored)."""
    STATE.parent.mkdir(parents=True, exist_ok=True)
    err = open(STATE.parent / "setup.err", "ab")
    subprocess.Popen([sys.executable, str(Path(__file__).resolve()), "setup"],
                     stdout=subprocess.DEVNULL, stderr=err,
                     start_new_session=True)
    err.close()
    log("launched 'place setup' for the new setup")


def cmd_watch(niri: Niri, state: layout.State) -> None:
    log(f"watcher started (pid {os.getpid()})")
    locked = start_lock_watch()
    conf_mtime = CONF.stat().st_mtime
    setups = load_setups()
    last: tuple[str, str] | None = None
    while True:
        time.sleep(POLL)
        try:
            try:
                mtime = CONF.stat().st_mtime
                if mtime != conf_mtime:
                    setups = load_setups()
                    conf_mtime = mtime
                    log("config changed on disk - reloaded")
            except OSError:
                pass
            if PAUSED.exists():
                last = None  # resume re-applies, even without a setup change
                continue
            last, state = tick(niri, setups, state, last, locked["locked"])
            if last is not None:
                save_state(state)
        except Exception as e:
            log(f"ERROR tick: {e}")


def parse_pick(text: str) -> dict[str, Any] | None:
    """pick-window replies as JSON (with -j) or as a human-readable block:
    'Window ID 33: (focused)\\n  Title: \"PLACE:DP-4\"\\n  App ID: ...'"""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        title = re.search(r'^\s*Title:\s*"(.*)"', text, re.M)
        app = re.search(r'^\s*App ID:\s*"(.*)"', text, re.M)
        if title:
            return {"title": title.group(1), "app_id": app.group(1) if app else ""}
        return None


def pick_window(timeout: float) -> dict[str, Any] | None:
    """Run niri's interactive window picker; returns the picked window's
    info dict, or None on failure/cancel/timeout."""
    try:
        r = subprocess.run(["niri", "msg", "pick-window"],
                           capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return None
    if r.returncode != 0:
        log(f"pick-window failed: {(r.stderr or '').strip()}")
        return None
    info = parse_pick(r.stdout)
    if info is None:
        log(f"pick-window: unexpected output: {r.stdout.strip()!r}")
    return info


class Abort(Exception):
    pass


def conn_specs(outputs: layout.Outputs, conns: list[str],
               with_index: bool) -> list[dict[str, Any]]:
    """Badge specs: one per monitor; index = its position in the CURRENT
    role order (None = unknown until clicked, used for the desk phase)."""
    specs: list[dict[str, Any]] = []
    for i, conn in enumerate(conns):
        out = outputs[conn]
        spec = {"conn": conn,
                "desc": f'{out.get("make", "")} {out.get("model", "")}'.strip()}
        if with_index:
            spec["index"] = i + 1
        specs.append(spec)
    return specs


def badge_send(badge: subprocess.Popen, *lines: str) -> None:
    try:
        for line in lines:
            badge.stdin.write((line + "\n").encode())
        badge.stdin.flush()
    except (BrokenPipeError, AttributeError, OSError):
        pass


def spawn_badges(niri: Niri,
                 specs: list[dict[str, Any]]) -> tuple[subprocess.Popen, BinaryIO]:
    """Start the badge overlay; wait until every window is actually mapped
    and bring each one's workspace to the front of its monitor. Returns
    (badge, err-file); exits the process on failure."""
    err_path = STATE.parent / "badge.err"
    err_path.parent.mkdir(parents=True, exist_ok=True)
    err = open(err_path, "wb")
    badge = subprocess.Popen([sys.executable, str(BADGE), json.dumps(specs)],
                             stdin=subprocess.PIPE,
                             stdout=subprocess.DEVNULL, stderr=err)
    wins: list[dict[str, Any]] = []
    all_mapped = False
    map_deadline = time.time() + 10
    while time.time() < map_deadline:
        if badge.poll() is not None:
            break
        wins = niri.query_json("-j", "windows")
        if sum(1 for w in wins if w.get("app_id") == BADGE_APP_ID) >= len(specs):
            all_mapped = True
            break
        time.sleep(0.1)
    if badge.poll() is not None:
        err.close()
        log(f"badge process died - see {err_path}")
        sys.exit(f"aborted: badge windows failed to open - see {err_path}")
    if not all_mapped:
        badge.kill()
        err.close()
        log("not all badge windows mapped")
        sys.exit("aborted: not all badges appeared - see place.log")
    # badges map onto each monitor's *active* workspace - a monitor whose
    # front workspace is a different one would hide its badge. Bring every
    # badge's workspace to the front (the picker is pointer-driven, so where
    # keyboard focus ends up doesn't matter).
    for w in wins:
        if w.get("app_id") == BADGE_APP_ID:
            niri.focus(w["workspace_id"])
    return badge, err


def kill_badge(badge: subprocess.Popen, err: BinaryIO) -> None:
    badge.kill()
    try:
        if badge.stdin:
            badge.stdin.close()
    except (BrokenPipeError, OSError, AttributeError):
        pass
    err.close()


def run_picks(niri: Niri, badge: subprocess.Popen, order_conns: list[str],
              deadline: float, bad_click_hint: str) -> list[str]:
    """Collect clicks until all but one monitor are picked (the remaining
    one is implicitly last). Raises Abort on timeout/cancel."""
    picked: list[str] = []
    total = len(order_conns)
    while len(picked) < total - 1:
        remaining = deadline - time.time()
        if remaining <= 0:
            raise Abort(f"timed out after {ARRANGE_TIMEOUT:.0f}s")
        info = pick_window(remaining)
        if info is None:
            raise Abort("picker cancelled or failed")
        title = info.get("title") or ""
        if info.get("app_id") != BADGE_APP_ID or not title.startswith("PLACE:"):
            notify("place", bad_click_hint)
            continue
        conn = title.split("PLACE:", 1)[1].strip()
        if conn in picked:
            notify("place", f"{conn} already picked - keep clicking")
            continue
        picked.append(conn)
        badge_send(badge, f"SET {conn} {len(picked)}",
                   f"STATUS {len(picked)} {total}")
    return picked


def implicit_conn(order_conns: list[str], picked: list[str]) -> str:
    return next(c for c in order_conns if c not in picked)


def commit_desk_order(setups: list[layout.Setup], state: layout.State,
                      setup: layout.Setup, outputs: layout.Outputs,
                      picked: list[str]) -> layout.State:
    """Store a human-declared left-to-right desk order: the entry's order,
    id, and (unless roles were explicitly arranged) centrality roles derived
    from it. Migrates the remembered split to the new id."""
    old_id = setup.get("id")
    desk = [layout.identity(outputs[c]) for c in picked]
    setup["order"] = desk
    setup["id"] = layout.order_id(desk)
    if not setup.get("arranged"):
        internal = {layout.identity(o) for c, o in outputs.items()
                    if c.startswith("eDP")}
        setup["roles"] = layout.default_roles_from_order(desk, internal)
    state = layout.rekey(state, old_id, setup["id"])
    save_setups(setups)
    log(f"desk order for {setup.get('name')}: {' -> '.join(picked)} "
        f"(id {setup['id']}, roles {setup['roles']})")
    return state


def cmd_setup(niri: Niri, setups: list[layout.Setup],
              state: layout.State) -> None:
    """Two-pass definition of the current setup: click the screens left to
    right (desk order), then in order of importance (roles)."""
    outputs, workspaces, windows = niri.state()
    setup, _how, _created = current_setup(setups, outputs)
    order_conns = layout.role_conns(setup, outputs)
    total = len(order_conns)
    badge, err = spawn_badges(niri, conn_specs(outputs, order_conns, with_index=False))
    try:
        badge_send(badge, "PHASE locate", f"STATUS 0 {total}")
        picked = run_picks(niri, badge, order_conns,
                           time.time() + ARRANGE_TIMEOUT,
                           "please click a screen (left to right)")
        picked.append(implicit_conn(order_conns, picked))
        badge_send(badge, f"SET {picked[-1]} {len(picked)}",
                   f"STATUS {len(picked)} {total}")
        time.sleep(0.8)
        state = commit_desk_order(setups, state, setup, outputs, picked)
        align_to_desk(niri, setups, outputs, setup)  # screens snap into place
        order_conns = layout.role_conns(setup, outputs)  # roles may have moved

        badge_send(badge, "PHASE arrange",
                   *[f"SET {c} {i + 1}" for i, c in enumerate(order_conns)],
                   f"STATUS 0 {total}")
        picked = run_picks(niri, badge, order_conns,
                           time.time() + ARRANGE_TIMEOUT,
                           "please click a screen (order of importance)")
        picked.append(implicit_conn(order_conns, picked))
        badge_send(badge, f"SET {picked[-1]} {len(picked)}",
                   f"STATUS {len(picked)} {total}")
        time.sleep(0.8)
        setup["roles"] = [layout.identity(outputs[c]) for c in picked]
        setup["arranged"] = True
        save_setups(setups)
        log(f"role order for {setup.get('name')}: {' -> '.join(picked)}")
    except Abort as e:
        kill_badge(badge, err)
        notify("place setup: aborted", str(e))
        sys.exit(f"setup aborted: {e}")
    kill_badge(badge, err)
    ok, pending, state = apply_setup(niri, state, setup, outputs, workspaces, windows)
    save_state(state)
    notify(f"place setup: {setup.get('name')} defined",
           f"primary: {picked[0]}")
    print(f"{setup.get('name')}: {'ok' if ok else f'INCOMPLETE ({pending} pending)'}"
          f"  primary: {picked[0]}")


def cmd_locate(niri: Niri, setups: list[layout.Setup],
               state: layout.State) -> None:
    """Redefine only the desk order (left to right)."""
    outputs, workspaces, windows = niri.state()
    setup, _how, _created = current_setup(setups, outputs)
    order_conns = layout.role_conns(setup, outputs)
    badge, err = spawn_badges(niri, conn_specs(outputs, order_conns, with_index=False))
    try:
        badge_send(badge, "PHASE locate", f"STATUS 0 {len(order_conns)}")
        picked = run_picks(niri, badge, order_conns,
                           time.time() + ARRANGE_TIMEOUT,
                           "please click a screen (left to right)")
        picked.append(implicit_conn(order_conns, picked))
        badge_send(badge, f"SET {picked[-1]} {len(picked)}",
                   f"STATUS {len(picked)} {len(order_conns)}")
        time.sleep(0.8)
    except Abort as e:
        kill_badge(badge, err)
        notify("place locate: aborted", str(e))
        sys.exit(f"locate aborted: {e}")
    kill_badge(badge, err)
    state = commit_desk_order(setups, state, setup, outputs, picked)
    align_to_desk(niri, setups, outputs, setup)
    ok, pending, state = apply_setup(niri, state, setup, outputs, workspaces, windows)
    save_state(state)
    notify(f"place locate: {setup.get('name')} desk order set",
           " -> ".join(picked))
    print(f"{setup.get('name')}: {'ok' if ok else f'INCOMPLETE ({pending} pending)'}"
          f"  desk: {' -> '.join(picked)}")


def cmd_arrange(niri: Niri, setups: list[layout.Setup],
                state: layout.State) -> None:
    """Redefine only the importance order (roles)."""
    outputs, workspaces, windows = niri.state()
    setup, _how, _created = current_setup(setups, outputs)
    order_conns = layout.role_conns(setup, outputs)
    badge, err = spawn_badges(niri, conn_specs(outputs, order_conns, with_index=True))
    try:
        badge_send(badge, "PHASE arrange", f"STATUS 0 {len(order_conns)}")
        picked = run_picks(niri, badge, order_conns,
                           time.time() + ARRANGE_TIMEOUT,
                           "please click a numbered screen")
        picked.append(implicit_conn(order_conns, picked))
        badge_send(badge, f"SET {picked[-1]} {len(picked)}",
                   f"STATUS {len(picked)} {len(order_conns)}")
        time.sleep(0.8)
    except Abort as e:
        kill_badge(badge, err)
        notify("place arrange: aborted", str(e))
        sys.exit(f"arrange aborted: {e}")
    kill_badge(badge, err)
    setup["roles"] = [layout.identity(outputs[c]) for c in picked]
    setup["arranged"] = True
    save_setups(setups)
    log(f"role order for {setup.get('name')}: {' -> '.join(picked)}")
    ok, pending, state = apply_setup(niri, state, setup, outputs, workspaces, windows)
    save_state(state)
    notify(f"place arrange: order saved ({setup.get('name')})",
           " -> ".join(picked))
    print(f"{setup.get('name')}: {'ok' if ok else f'INCOMPLETE ({pending} pending)'}"
          f"  order: {' -> '.join(picked)}")


def align_to_desk(niri: Niri, setups: list[layout.Setup],
                  outputs: layout.Outputs, setup: layout.Setup) -> None:
    """Push the declared desk order into niri's RUNTIME layout: monitors
    left→right at y=0, using their current logical widths. This aligns the
    physical screen arrangement with what was clicked in pass 1 — it does
    not write any config file (persistent pins stay in output.kdl)."""
    desk = setup.get("order") or []
    if not desk:
        log("align: no declared desk order for this setup")
        return
    conn_by_ident = {layout.identity(o): c for c, o in outputs.items()}
    x = 0
    for ident in desk:
        conn = conn_by_ident.get(ident)
        if conn:
            try:
                niri.query("output", conn, "position", "set", str(x), "0")
                log(f"align: {conn} -> x={x}")
            except RuntimeError as e:
                log(f"WARNING align {conn}: {e}")
        x += outputs[conn]["logical"]["width"] if conn else 0


def cmd_align(niri: Niri, setups: list[layout.Setup],
              state: layout.State) -> None:
    outputs, _workspaces, _windows = niri.state()
    setup, _how, _created = current_setup(setups, outputs)
    align_to_desk(niri, setups, outputs, setup)
    print("aligned to desk order:", " -> ".join(setup.get("order", [])))


def cmd_apply(niri: Niri, setups: list[layout.Setup],
              state: layout.State) -> None:
    outputs, workspaces, windows = niri.state()
    setup, _how, _created = current_setup(setups, outputs)
    ok, pending, state = apply_setup(niri, state, setup, outputs, workspaces, windows)
    save_state(state)
    print(f"{setup.get('name')}: {'ok' if ok else f'INCOMPLETE ({pending} pending)'}")


def cmd_show(niri: Niri, setups: list[layout.Setup],
             state: layout.State) -> None:
    outputs, workspaces, windows = niri.state()
    sid = layout.setup_id(outputs)
    identities = [layout.identity(o) for o in outputs.values()]
    setup, how = layout.detect_setup(setups, sid, layout.set_id(identities), identities)
    print(f"setup: {setup.get('name') if setup else 'UNKNOWN'} ({sid}, match: {how})")
    for conn in sorted(outputs):
        for w in sorted(workspaces, key=lambda w: (w["output"], w["idx"])):
            if w["output"] == conn:
                n = sum(1 for x in windows if x["workspace_id"] == w["id"])
                print(f"  {conn:6s} #{w['idx']:2d} id={w['id']:4d} {n} win")
    print(f"order: {state.get('order')}")
    print(f"sizes: {state.get('sizes')}")
    splits = state.get("splits", {})
    if splits:
        name_by_id = {s.get("id"): s.get("name") for s in setups}
        print("remembered splits:")
        for k in sorted(splits):
            print(f"  {k} {name_by_id.get(k, '?'):10s} {splits[k]}")


def cmd_pause() -> None:
    STATE.parent.mkdir(parents=True, exist_ok=True)
    PAUSED.touch()
    notify("place: paused", "hands-off until 'place.py resume'")
    print("paused - the watcher will not move or learn anything")


def cmd_resume() -> None:
    PAUSED.unlink(missing_ok=True)
    notify("place: resumed", "next poll re-applies the current setup")
    print("resumed")


def main() -> None:
    cmd = sys.argv[1] if len(sys.argv) > 1 else "watch"
    if cmd == "pause":
        cmd_pause()
        return
    if cmd == "resume":
        cmd_resume()
        return
    niri = Niri()
    state = load_state()
    if cmd == "watch":
        cmd_watch(niri, state)
    elif cmd == "apply":
        cmd_apply(niri, load_setups(), state)
    elif cmd == "setup":
        cmd_setup(niri, load_setups(), state)
    elif cmd == "locate":
        cmd_locate(niri, load_setups(), state)
    elif cmd == "arrange":
        cmd_arrange(niri, load_setups(), state)
    elif cmd == "align":
        cmd_align(niri, load_setups(), state)
    elif cmd == "show":
        cmd_show(niri, load_setups(), state)
    else:
        sys.exit(f"unknown command {cmd!r}")


if __name__ == "__main__":
    main()
