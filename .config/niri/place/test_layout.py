"""Tests for layout.py — pure functions, no niri needed. Run: python3 -m unittest test_layout.py -v"""

import importlib.util
import json
import unittest
from pathlib import Path

HERE = Path(__file__).parent
spec = importlib.util.spec_from_file_location("layout", HERE / "layout.py")
layout = importlib.util.module_from_spec(spec)
spec.loader.exec_module(layout)

WORK_ROLES = ["HP Inc. HP 527pm 1H36020DJ7", "HP Inc. HP 527pq CNK6090BL4", "BOE 0x0CE0 None"]
HOME_ROLES = ["HP Inc. HP 24fh 3CM0330VYC", "HP Inc. HP 24fh 3CM033045N", "BOE 0x0CE0 None"]
SETUPS = [{"name": "work", "roles": WORK_ROLES},
          {"name": "home", "roles": HOME_ROLES},
          {"name": "laptop", "roles": ["BOE 0x0CE0 None"]}]

WORK_OUTS = {c: {"make": c.split()[0], "model": c.split()[1], "serial": c.split()[2]}
             for c in WORK_ROLES}
HOME_OUTS = {c: {"make": c.split()[0], "model": c.split()[1], "serial": c.split()[2]}
             for c in HOME_ROLES}
LAPTOP_OUTS = {"BOE 0x0CE0 None": {"make": "BOE", "model": "0x0CE0", "serial": "None"}}


def ws(id, output, idx):
    return {"id": id, "output": output, "idx": idx}


def win(id, ws_id):
    return {"id": id, "workspace_id": ws_id}


class DetectTest(unittest.TestCase):
    def test_exact_match(self):
        ids = list(WORK_ROLES)
        self.assertEqual(layout.detect_setup(SETUPS, ids)["name"], "work")
        ids = list(HOME_ROLES)  # same monitors, order irrelevant
        self.assertEqual(layout.detect_setup(SETUPS, ids)["name"], "home")

    def test_unknown_set_is_not_matched(self):
        self.assertIsNone(layout.detect_setup(SETUPS, ["Some TV", "BOE 0x0CE0 None"]))


class LearnExpandedTest(unittest.TestCase):
    def test_adopts_blocks_and_sizes(self):
        lists = [[10, 11], [20], [30, 31]]
        s = layout.learn({}, lists)
        self.assertEqual(s["order"], [10, 11, 20, 30, 31])
        self.assertEqual(s["sizes"], [2, 1, 2])

    def test_two_role_setup_pads_sizes(self):
        s = layout.learn({}, [[10], [20, 21]])
        self.assertEqual(s["sizes"], [1, 2, 0])


class LearnCollapsedTest(unittest.TestCase):
    def state(self):
        return {"order": [10, 11, 20, 30, 31], "sizes": [2, 1, 2]}

    def test_strip_order_wins_and_sizes_survive(self):
        s = layout.learn(self.state(), [[11, 10, 20, 30, 31]])  # user reordered
        self.assertEqual(s["order"], [11, 10, 20, 30, 31])
        self.assertEqual(s["sizes"], [2, 1, 2])

    def test_new_workspace_joins_block_0(self):
        s = layout.learn(self.state(), [[10, 11, 20, 30, 31, 99]])
        self.assertEqual(s["sizes"], [3, 1, 2])
        self.assertEqual(s["order"][2], 99)  # right after block 0

    def test_closed_workspace_shrinks_its_block(self):
        s = layout.learn(self.state(), [[10, 20, 30, 31]])  # ws 11 closed
        self.assertEqual(s["sizes"], [1, 1, 2])
        self.assertNotIn(11, s["order"])


class PlanTest(unittest.TestCase):
    def work(self, ids_per_monitor):
        """world from ordered ids per monitor; every ws has one window"""
        workspaces, windows, wid = [], [], 100
        for conn, ids in zip(WORK_ROLES, ids_per_monitor):
            for i, ws_id in enumerate(ids):
                workspaces.append(ws(ws_id, conn, i + 1))
                windows.append(win(wid, ws_id)); wid += 1
        return workspaces, windows

    def test_expanded_routes_block_to_its_monitor(self):
        state = {"order": [10, 11, 20, 30, 31], "sizes": [2, 1, 2]}
        # ws 20 (block 1) drifted onto the laptop
        workspaces = [ws(10, WORK_ROLES[0], 1), ws(11, WORK_ROLES[0], 2),
                      ws(20, WORK_ROLES[2], 1), ws(30, WORK_ROLES[2], 2),
                      ws(31, WORK_ROLES[2], 3)]
        windows = [win(1, 10), win(2, 11), win(3, 20), win(4, 30), win(5, 31)]
        moves = layout.plan(state, WORK_ROLES, workspaces, windows)
        self.assertIn((20, WORK_ROLES[1], 1), moves)

    def test_collapse_reorders_strip_into_blocks(self):
        state = {"order": [10, 11, 20, 30, 31], "sizes": [2, 1, 2]}
        # niri dumped: laptop's own first, then role 1, then role 2
        laptop = LAPTOP_OUTS
        workspaces = [ws(30, "BOE 0x0CE0 None", 1), ws(31, "BOE 0x0CE0 None", 2),
                      ws(10, "BOE 0x0CE0 None", 3), ws(11, "BOE 0x0CE0 None", 4),
                      ws(20, "BOE 0x0CE0 None", 5)]
        windows = [win(i, w["id"]) for i, w in enumerate(workspaces)]
        moves = layout.plan(state, ["BOE 0x0CE0 None"], workspaces, windows)
        # converge mentally: apply each move to a copy and check the strip
        pos = {w["id"]: w["idx"] for w in workspaces}
        for ws_id, _conn, idx in moves:
            pos[ws_id] = idx
        self.assertEqual([pos[i] for i in state["order"]], [1, 2, 3, 4, 5])

    def test_expand_splits_by_sizes(self):
        state = {"order": [10, 11, 20, 30, 31], "sizes": [2, 1, 2]}
        # all on the laptop (post-train), blocks interleaved by collapse order
        workspaces = [ws(10, "BOE 0x0CE0 None", 1), ws(11, "BOE 0x0CE0 None", 2),
                      ws(20, "BOE 0x0CE0 None", 3), ws(30, "BOE 0x0CE0 None", 4),
                      ws(31, "BOE 0x0CE0 None", 5)]
        windows = [win(i, w["id"]) for i, w in enumerate(workspaces)]
        moves = layout.plan(state, WORK_ROLES, workspaces, windows)
        self.assertIn((10, WORK_ROLES[0], 1), moves)
        self.assertIn((11, WORK_ROLES[0], 2), moves)
        self.assertIn((20, WORK_ROLES[1], 1), moves)
        self.assertIn((30, WORK_ROLES[2], 1), moves)
        self.assertIn((31, WORK_ROLES[2], 2), moves)

    def test_two_role_setup_absorbs_tail(self):
        state = {"order": [10, 20, 30], "sizes": [1, 1, 1]}
        conns = ["DP-3", "eDP-1"]  # olten: TV + laptop
        outs = {"DP-3": {"make": "LG", "model": "TV", "serial": "X"},
                "eDP-1": {"make": "BOE", "model": "0x0CE0", "serial": "None"}}
        # drifted: everything sits on the laptop
        workspaces = [ws(10, "eDP-1", 1), ws(20, "eDP-1", 2), ws(30, "eDP-1", 3)]
        windows = [win(1, 10), win(2, 20), win(3, 30)]
        moves = layout.plan(state, conns, workspaces, windows)
        # block 0 -> TV, blocks 1+2 (tail) stay on the laptop in order
        self.assertIn((10, "DP-3", 1), moves)
        self.assertIn((20, "eDP-1", 1), moves)
        self.assertIn((30, "eDP-1", 2), moves)

    def test_extra_unknown_workspaces_stay_where_they_are(self):
        state = {"order": [10], "sizes": [1, 0, 0]}
        workspaces = [ws(10, WORK_ROLES[0], 1), ws(99, WORK_ROLES[0], 2)]
        windows = [win(1, 10), win(2, 99)]
        moves = layout.plan(state, WORK_ROLES, workspaces, windows)
        # unmanaged extras keep their learned slot (only the strip order of
        # managed workspaces is enforced)
        self.assertEqual(moves, [])


class FirstOccupiedTest(unittest.TestCase):
    def test_frontmost_occupied_per_monitor(self):
        # A: buffer empty at #1, occupied at #2; B: occupied at #1; C: all empty
        workspaces = [ws(1, "A", 1), ws(2, "A", 2), ws(3, "B", 1), ws(4, "C", 1)]
        windows = [win(1, 2), win(2, 3)]
        self.assertEqual(layout.first_occupied(workspaces, windows, ["A", "B", "C"]),
                         [2, 3, None])

    def test_picks_by_idx_not_list_order(self):
        workspaces = [ws(5, "A", 2), ws(6, "A", 1)]
        windows = [win(1, 5), win(2, 6)]
        self.assertEqual(layout.first_occupied(workspaces, windows, ["A"]), [6])


if __name__ == "__main__":
    unittest.main(verbosity=2)
