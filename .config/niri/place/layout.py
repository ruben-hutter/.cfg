"""Pure layout logic for place — no I/O happens in here.

Concepts
--------
order   canonical ordering of workspace ids, as one long strip:
        role-1's workspaces, then role-2's, then role-3's.
sizes   [n1, n2, n3] — how many of the strip belong to role 1, 2, 3.
        The last role absorbs any tail (e.g. a 2-monitor setup's laptop).
setup   {"name": str, "roles": [monitor-identity, ...]} — identity is
        "make model serial", whitespace-normalized.

state (what the caller persists) = {"order": [...], "sizes": [...], "session": token}
"""


def identity(out):
    parts = f'{out.get("make", "")} {out.get("model", "")} {out.get("serial", "")}'
    return " ".join(parts.split())


def detect_setup(setups, identities):
    """The setup whose role identities exactly match the connected monitors."""
    ids = set(identities)
    for s in setups:
        if set(s["roles"]) == ids:
            return s
    return None


def role_conns(setup, outputs):
    """Connector names per role, ordered by role."""
    ident2conn = {identity(o): conn for conn, o in outputs.items()}
    return [ident2conn[r] for r in setup["roles"]]


def observed_lists(workspaces, windows, conns):
    """Ordered occupied workspace ids per role monitor: [[role0 ids], ...]."""
    occ = {w["workspace_id"] for w in windows}
    per = {c: [] for c in conns}
    for w in sorted(workspaces, key=lambda w: (w["output"], w["idx"])):
        if w["output"] in per and w["id"] in occ:
            per[w["output"]].append(w["id"])
    return [per[c] for c in conns]


def learn(state, lists, freeze_sizes=False):
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
            return {"order": list(strip), "sizes": [len(strip), 0, 0]}
        return {"order": list(strip),
                "sizes": [len(l) for l in lists] + [0] * (3 - len(lists))}

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
        state["sizes"] = [len(l) for l in lists] + [0] * (3 - len(lists))
    return state


def plan(state, conns, workspaces, windows):
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
    segs = []
    for r in range(len(conns)):
        if r == len(conns) - 1:
            segs.append(order[acc:])
        else:
            n = max(0, sizes[r]) if r < len(sizes) else 0
            segs.append(order[acc:acc + n])
            acc += n

    moves = []
    for r, conn in enumerate(conns):
        full = [w["id"] for w in sorted(workspaces, key=lambda w: (w["output"], w["idx"]))
                if w["output"] == conn]
        desired = [i for i in segs[r] if i in occ]
        desired += [i for i in occupied_full(full, occ) if i not in desired]

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


def occupied_full(full, occ_ids):
    return [i for i in full if i in occ_ids]
