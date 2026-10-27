"""Tests for place.py's converge loop — pure policy via injected seams.
Run: python3 -m unittest test_place.py -v"""

import importlib.util
import unittest
from collections import Counter
from itertools import count
from pathlib import Path

HERE = Path(__file__).parent
spec = importlib.util.spec_from_file_location("layout", HERE / "layout.py")
layout = importlib.util.module_from_spec(spec)
spec.loader.exec_module(layout)
spec = importlib.util.spec_from_file_location("place", HERE / "place.py")
place = importlib.util.module_from_spec(spec)
spec.loader.exec_module(place)


def ws(id, output, idx):
    return {"id": id, "output": output, "idx": idx}


class FakeNiri:
    """In-memory world {ws_id: (conn, idx)}; state() reports it like niri.
    move() applies instantly and reports Handled."""

    def __init__(self, world, outs=None):
        self.outs = outs or {}
        self.world = dict(world)
        self.moves = []

    def state(self):
        ordered = sorted(self.world.items(), key=lambda kv: (kv[1][0], kv[1][1]))
        workspaces = [ws(wid, conn, idx)
                      for wid, (conn, idx) in ordered]
        windows = [{"id": 900 + w["id"], "workspace_id": w["id"]}
                   for w in workspaces]  # every workspace occupied
        return (self.outs, workspaces, windows)

    def move(self, wid, conn, idx):
        self.moves.append((wid, conn, idx))
        # inserting at a slot shifts later siblings down, like niri does
        for other, (c, i) in self.world.items():
            if other != wid and c == conn and i >= idx:
                self.world[other] = (c, i + 1)
        self.world[wid] = (conn, idx)
        return True


def converged_clock():
    """now() that never advances: the deadline never expires."""
    return (lambda: 0.0, lambda _s: None)


class DroppingNiri(FakeNiri):
    """Accepts every move but drops it — the accept-but-drop behavior that
    makes converge's verify loop necessary (locked session, niri quirks)."""

    def move(self, wid, conn, idx):
        self.moves.append((wid, conn, idx))
        return True


class ConvergeTest(unittest.TestCase):
    """The retry/verify loop: niri can accept-but-drop moves, so converge
    polls, plans, sends one move at a time and verifies the effect."""

    def test_drives_the_world_until_the_plan_is_empty(self):
        niri = FakeNiri({10: ("A", 2), 11: ("A", 1)})  # reversed on purpose
        state = {"order": [10, 11], "sizes": [2]}
        now, sleep = converged_clock()
        ok, pending = place.converge(niri, state, ["A"],
                                     deadline=8, attempts=1, now=now, sleep=sleep)
        self.assertEqual((ok, pending), (True, 0))
        self.assertEqual(niri.world, {10: ("A", 1), 11: ("A", 2)})

    def test_gives_up_after_max_tries_per_workspace(self):
        niri = DroppingNiri({10: ("A", 2), 11: ("A", 1)})
        state = {"order": [10, 11], "sizes": [2]}
        now, sleep = converged_clock()
        ok, pending = place.converge(niri, state, ["A"],
                                     deadline=1000, attempts=1, now=now, sleep=sleep)
        self.assertEqual((ok, pending), (False, 2))
        per_wid = Counter(w for w, _c, _i in niri.moves)
        self.assertEqual(max(per_wid.values()), place.MAX_TRIES)  # then gives up

    def test_retry_pass_resets_the_try_budget(self):
        niri = DroppingNiri({10: ("A", 2), 11: ("A", 1)})
        state = {"order": [10, 11], "sizes": [2]}
        now, sleep = converged_clock()
        place.converge(niri, state, ["A"],
                       deadline=1000, attempts=2, now=now, sleep=sleep)
        per_wid = Counter(w for w, _c, _i in niri.moves)
        self.assertEqual(max(per_wid.values()), place.MAX_TRIES * 2)  # whole pass retried

    def test_stops_when_the_deadline_expires(self):
        niri = DroppingNiri({10: ("A", 2), 11: ("A", 1)})
        state = {"order": [10, 11], "sizes": [2]}
        ticks = iter(count())
        now = lambda: next(ticks) * 3.0   # 3s per poll: expires fast
        sleep = lambda _s: None
        ok, pending = place.converge(niri, state, ["A"],
                                     deadline=8, attempts=1, now=now, sleep=sleep)
        self.assertEqual((ok, pending), (False, 2))
        self.assertLessEqual(len(niri.moves), 3)  # a few tries, not forever


class TickTest(unittest.TestCase):
    """tick must RETURN the updated state so callers persist what it learned
    — the regression the pure-verb refactor nearly shipped: callers saved
    their own stale dict while settle/arrive results were dropped."""

    def setup_world(self):
        outs = {"A": {"make": "M", "model": "X", "serial": "1",
                      "logical": {"x": 0, "y": 0, "width": 100,
                                  "height": 9, "scale": 1.0}}}
        ident = layout.identity(outs["A"])
        sid = layout.setup_id(outs)
        setups = [{"name": "t", "id": sid, "set": layout.set_id([ident]),
                   "roles": [ident], "arranged": True}]
        return outs, setups, sid

    def test_settled_tick_returns_the_learned_state(self):
        outs, setups, sid = self.setup_world()
        niri = FakeNiri({10: ("A", 1), 20: ("A", 2)}, outs)
        state = {"order": [10, 20, 30], "sizes": [1, 1, 1],
                 "splits": {}, "session": "s"}
        last, new_state = place.tick(niri, setups, state, ("t", sid),
                                     {"locked": False})
        self.assertEqual(last, ("t", sid))
        self.assertEqual(new_state["order"], [10, 20])   # ws 30 closed
        self.assertEqual(new_state["sizes"], [1, 1, 0])
        self.assertIsNot(new_state, state)  # callers MUST save the returned dict


if __name__ == "__main__":
    unittest.main(verbosity=2)
