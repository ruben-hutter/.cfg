"""Pure layout logic for place — no I/O happens in here.

Concepts
--------
order     canonical ordering of workspace ids, as one long strip:
          role-1's workspaces, then role-2's, then role-3's.
sizes     the ACTIVE cut: how many of the strip belong to each role, in
          role order. The last role absorbs any tail. Length follows the
          setup being cut for; shorter lists tolerate any plan (missing
          roles count 0).
splits    per-setup remembered cuts: {setup-id: [n1, n2, ...]}. Arriving at
          an expanded setup with a remembered split makes it the active
          cut, so each setup re-expands the strip the way it was last
          arranged there. Mirrored from the active sizes while a setup is
          settled (settle — the one place that invariant lives), so user
          rearrangements are kept per setup.
fresh     a cold-start strip: ids from before the (re)boot are dead, the
          strip is whatever is open, waiting for its first expanded
          arrival to cut it by a remembered split
cold      fresh while collapsed: strip adopted, waiting to expand
session   niri socket basename; a change means ids died (migrate)
setup     {"name": str, "id": str, "roles": [monitor-identity, ...]} —
          identity is "make model serial", roles[0] is the primary.
id        short hash of the position-ordered identities: the monitor set
          AND their left-to-right arrangement. A TV left of the laptop is
          a different setup from the same TV right of it.
signature identities ordered by physical position (the id's preimage).

state (what the caller persists) =
    {"order": [...], "sizes": [...], "splits": {...}, "session": token,
     "fresh"/"cold": lifecycle flags}

The state machine's verbs (below): migrate (session boundary),
transition (cold start), arrive/arrived (entering a setup, split around
the I/O step of converging), settle (steady state), rekey (desk order
redefined). All pure: dict in, dict out.
"""

from __future__ import annotations

import hashlib
from typing import Any
from collections.abc import Iterable

# JSON-shaped data: what `niri msg -j` reports and place.json stores. Values
# stay loosely typed (Any) — the shape is niri's/config's, not ours.
Output = dict[str, Any]      # one monitor entry (`niri msg -j outputs`)
Workspace = dict[str, Any]   # one workspace entry (`niri msg -j workspaces`)
Window = dict[str, Any]      # one window entry (`niri msg -j windows`)
Outputs = dict[str, Output]  # connector name -> output
Setup = dict[str, Any]       # one setup entry (a place.json "setups" item)
State = dict[str, Any]       # the persisted strip state (see module docstring)
Move = tuple[int, str, int]  # (workspace id, connector, target index)


def identity(out: Output) -> str:
    parts = f'{out.get("make", "")} {out.get("model", "")} {out.get("serial", "")}'
    return " ".join(parts.split())


def signature(outputs: Outputs) -> list[str]:
    """Identities ordered by physical position (x, then y, then connector):
    the setup's arrangement key."""
    def key(item: tuple[str, Output]) -> tuple[int, int, str]:
        conn, out = item
        log = out.get("logical") or {}
        return (log.get("x", 0), log.get("y", 0), conn)
    return [identity(out) for _, out in sorted(outputs.items(), key=key)]


def setup_id(outputs: Outputs) -> str:
    """Provisional identifier for the connected arrangement: short hash of
    the position-ordered identities (niri's view of the desk)."""
    return _hash(signature(outputs))


def order_id(order: list[str]) -> str:
    """Identifier for a HUMAN-DECLARED desk order (from 'place setup'/'locate').
    This is the authoritative arrangement key: niri's auto-layout can differ
    from the physical desk, the user's clicks cannot."""
    return _hash(order)


def set_id(identities: list[str]) -> str:
    """Identifier for the monitor SET, independent of arrangement - the
    fallback match when the arrangement key differs on a revisit."""
    return _hash(sorted(identities))


def _hash(lines: Iterable[str]) -> str:
    return hashlib.sha256("\n".join(lines).encode()).hexdigest()[:8]


def default_roles(outputs: Outputs) -> list[str]:
    """Centrality order: centermost monitor first (it becomes the primary),
    ties -> internal panel last, then left first. This reproduces every
    setup in place.json that was ordered by hand (middle monitor = role 0)."""
    bounds: list[tuple[int, int]] = []
    for out in outputs.values():
        log = out.get("logical") or {}
        x, w = log.get("x", 0), log.get("width", 0)
        bounds.append((x, x + w))
    mid = (min(a for a, _ in bounds) + max(b for _, b in bounds)) / 2

    def key(item: tuple[str, Output]) -> tuple[float, bool, int, str]:
        conn, out = item
        log = out.get("logical") or {}
        x, w = log.get("x", 0), log.get("width", 0)
        return (abs(x + w / 2 - mid), conn.startswith("eDP"), x, conn)
    return [identity(out) for _, out in sorted(outputs.items(), key=key)]


def default_roles_from_order(order: list[str],
                             internal: Iterable[str] = ()) -> list[str]:
    """Centrality order from a human-declared left-to-right sequence
    (no geometry needed): position distance from the middle of the
    sequence, ties -> internal panel last, then left first. Reproduces the
    hand-written setups when fed their true desk orders."""
    n = len(order)
    mid = (n - 1) / 2

    def key(i: int) -> tuple[float, bool, int]:
        return (abs(i - mid), order[i] in internal, i)
    return [order[i] for i in sorted(range(n), key=key)]


def detect_setup(setups: list[Setup], sid: str, setid: str,
                 identities: list[str]) -> tuple[Setup | None, str | None]:
    """Match precedence: exact arrangement id > hand-written legacy entry
    (role-set match, until linked) > monitor set (niri's layout differs
    from the declared desk order). Returns (setup, how) with how in
    {"id", "legacy", "set", None}."""
    for s in setups:
        if s.get("id") == sid:
            return s, "id"
    ids = set(identities)
    for s in setups:
        if not s.get("id") and set(s["roles"]) == ids:
            return s, "legacy"
    for s in setups:
        if s.get("set") == setid:
            return s, "set"
    return None, None


def role_conns(setup: Setup, outputs: Outputs) -> list[str]:
    """Connector names per role, ordered by role."""
    ident2conn = {identity(o): conn for conn, o in outputs.items()}
    return [ident2conn[r] for r in setup["roles"]]


def observed_lists(workspaces: list[Workspace], windows: list[Window],
                   conns: list[str]) -> list[list[int]]:
    """Ordered occupied workspace ids per role monitor: [[role0 ids], ...]."""
    occ = {w["workspace_id"] for w in windows}
    per = {c: [] for c in conns}
    for w in sorted(workspaces, key=lambda w: (w["output"], w["idx"])):
        if w["output"] in per and w["id"] in occ:
            per[w["output"]].append(w["id"])
    return [per[c] for c in conns]


def first_occupied(workspaces: list[Workspace], windows: list[Window],
                   conns: list[str]) -> list[int | None]:
    """Frontmost occupied workspace id per monitor, or None if it has none:
    what each monitor should display right after a transition."""
    occ = {w["workspace_id"] for w in windows}
    picks: list[int | None] = []
    for conn in conns:
        pick = next((w["id"] for w in sorted(workspaces, key=lambda w: w["idx"])
                     if w["output"] == conn and w["id"] in occ), None)
        picks.append(pick)
    return picks


# ---------------------------------------------------------------- state
# The strip-and-cut state machine: {order, sizes, splits, fresh, cold,
# session}. Every verb is pure — dict in, dict out, no I/O — so place.py
# keeps only persistence and process. The split/sizes mirroring invariant
# lives HERE (settle), nowhere else.

def migrate(state: State, session: str) -> State:
    """New niri session: workspace ids are dead. The strip resets; sizes
    survive as the cut seed; splits survive as cut targets; fresh marks a
    strip waiting to be cut by the next expanded arrival."""
    if state.get("session") == session:
        return dict(state, splits=state.get("splits", {}))
    sizes = state.get("sizes")
    state = {"order": [], "sizes": sizes, "splits": state.get("splits", {}),
             "session": session}
    if sizes is not None:
        state["fresh"] = True
    return state


def transition(state: State, lists: list[list[int]]) -> State:
    """Cold start (fresh): adopt the open workspaces as the strip. Collapsed
    time is marked cold; an expanded adoption clears it — the next arrival
    cuts the strip by the setup's remembered split."""
    if not state.get("fresh"):
        return state
    state = dict(state)
    state["order"] = [i for l in lists for i in l]
    if len(lists) > 1:
        state.pop("cold", None)
    else:
        state["cold"] = True
    return state


def arrive(state: State, sid: str, lists: list[list[int]]) -> State:
    """Entering setup sid: an expanded arrival restores its remembered cut
    (sizes = the split); with no sizes yet, reality becomes the baseline and
    a collapsed one waits to expand (fresh + cold). A split summing past the
    open workspaces has dead slots (learned elsewhere, never shrunk) and is
    distrusted - the active cut stays in charge. Runs BEFORE converge."""
    state = dict(state)
    expanded = len(lists) > 1
    split = state.get("splits", {}).get(sid)
    if expanded and split and sum(split) <= sum(map(len, lists)):
        state["sizes"] = list(split)
    if not state.get("sizes"):
        state.update(learn(state, lists))
        if not expanded:
            state["fresh"] = state["cold"] = True
    return state


def _mirror(state: State, sid: str) -> State:
    """Copy-on-write: remember this setup's cut — the active sizes become its
    split. THE place the split/sizes mirroring happens."""
    state = dict(state, splits=dict(state.get("splits", {})))
    state["splits"][sid] = list(state["sizes"])
    return state


def arrived(state: State, sid: str) -> State:
    """The arrival converged: distribution done — fresh ends and the active
    cut is remembered as this setup's split. place.py gates on ok+expanded
    and calls this AFTER converge."""
    state = dict(state)
    state.pop("fresh", None)
    if state.get("sizes"):
        state = _mirror(state, sid)
    return state


def settle(state: State, lists: list[list[int]], sid: str) -> State:
    """Steady state on the setup's own monitors: follow the user's
    arrangement (learn). NEVER call this on a transition tick: reality is
    mid-switch, and learning from it would corrupt the strip. While settled
    and expanded, the setup's split mirrors the active sizes — the one place
    that invariant lives."""
    state = learn(state, lists, freeze_sizes=bool(state.get("fresh")))
    if len(lists) > 1 and not state.get("fresh") and state.get("sizes"):
        state = _mirror(state, sid)
    return state


def rekey(state: State, old_id: str | None, new_id: str) -> State:
    """Desk order redefined: the remembered cut follows the setup's new id.
    A split already remembered under the new id wins (the old one is
    dropped), matching the historical setdefault behavior."""
    splits = state.get("splits", {})
    if not old_id or old_id == new_id or old_id not in splits:
        return state
    state = dict(state, splits=dict(splits))
    state["splits"].setdefault(new_id, state["splits"].pop(old_id))
    return state


def learn(state: State, lists: list[list[int]],
          freeze_sizes: bool = False) -> State:
    """Adopt observed reality.

    Expanded (one list per role): the arrangement is the truth — order becomes
    the concatenation and sizes the per-role counts. New workspaces land in
    the block of the monitor they appeared on.

    Collapsed (a single list = the whole strip): the strip's order wins, but
    block sizes are kept — block boundaries survive the collapse, so the next
    expand can split correctly. New workspaces join block 0 (they go to the
    primary at expand); closed workspaces shrink their block.

    freeze_sizes: keep sizes as-is (used while distributing after a reboot).
    """
    state = dict(state)
    order = list(state.get("order", []))
    sizes = list(state["sizes"]) if state.get("sizes") else None
    strip = [i for l in lists for i in l]
    unknown = [i for i in strip if i not in order]

    if sizes is None:
        if len(lists) == 1:
            return {"order": list(strip), "sizes": [len(strip)]}
        return {"order": list(strip),
                "sizes": [len(l) for l in lists]}

    if len(lists) == 1:
        # collapsed: strip order wins; block sizes preserved
        new_order = [i for i in strip if i in set(order)]
        closed = set(order) - set(strip)
        if not freeze_sizes:
            acc = 0
            for bi, n in enumerate(sizes):
                lost = sum(1 for i in order[acc:acc + n] if i in closed)
                sizes[bi] = max(0, sizes[bi] - lost)
                acc += n
        pos = min(sizes[0], len(new_order))
        for u in unknown:
            new_order.insert(pos, u)
            pos += 1
        if not freeze_sizes:
            sizes[0] += len(unknown)
        state["order"] = new_order
        state["sizes"] = sizes
        return state

    # expanded
    state["order"] = strip
    if not freeze_sizes:
        state["sizes"] = [len(l) for l in lists]
    return state


def plan(state: State, conns: list[str], workspaces: list[Workspace],
         windows: list[Window]) -> list[Move]:
    """Moves [(ws_id, conn, idx)] that make reality match (order, sizes).

    idx counts ALL workspaces on the monitor, including empty ones (niri's
    MoveWorkspaceToIndex does the same) — with empty-workspace-above-first
    the front slot stays an empty workspace, and occupied workspaces keep
    their relative order behind it."""
    order = state["order"]
    sizes = state["sizes"]
    occ = {w["workspace_id"] for w in windows}
    # the state's segments per role, existing ids only (unknowns park where
    # they are, per learn)
    acc = 0
    segs: list[list[int]] = []
    for r in range(len(conns)):
        if r == len(conns) - 1:
            segs.append(order[acc:])
        else:
            n = max(0, sizes[r]) if r < len(sizes) else 0
            segs.append(order[acc:acc + n])
            acc += n
    homed: set[int] = {i for seg in segs for i in seg if i in occ}

    moves: list[Move] = []
    for r, conn in enumerate(conns):
        full = [w["id"] for w in sorted(workspaces, key=lambda w: (w["output"], w["idx"]))
                if w["output"] == conn]
        desired = [i for i in segs[r] if i in occ]
        # park only occupied workspaces with no home in any segment; managed
        # ones sitting on the wrong monitor get their own segment's slot
        desired += [i for i in occupied_full(full, occ)
                    if i not in desired and i not in homed]

        # simulate: walk the strip, fill occupied slots in desired order,
        # empty workspaces keep their slots
        work = list(full)
        it = iter(desired)
        for i, wid in enumerate(work):
            if wid in occ:
                work[i] = next(it, wid)
        for wid in it:  # desired longer than the strip: append
            work.append(wid)

        for i in range(max(len(work), len(full))):
            wid = work[i] if i < len(work) else None
            old = full[i] if i < len(full) else None
            if wid is not None and wid != old:
                moves.append((wid, conn, i + 1))
    return moves


def occupied_full(full: list[int], occ_ids: set[int]) -> list[int]:
    return [i for i in full if i in occ_ids]
