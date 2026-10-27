"""Tests for layout.py — pure functions, no niri needed. Run: python3 -m unittest test_layout.py -v"""

import importlib.util
import json
import unittest
from pathlib import Path

HERE = Path(__file__).parent
spec = importlib.util.spec_from_file_location("layout", HERE / "layout.py")
layout = importlib.util.module_from_spec(spec)
spec.loader.exec_module(layout)

LAPTOP = "BOE 0x0CE0 None"
WORK_ROLES = ["HP Inc. HP 527pm 1H36020GBC", "HP Inc. HP 527pq CNK6090BWD", LAPTOP]
HOME_ROLES = ["HP Inc. HP 24fh 3CM0330VYC", "HP Inc. HP 24fh 3CM033045N", LAPTOP]


def out(make, model, serial, x, w, y=0):
    """Output fixture; logical geometry like `niri msg -j outputs` reports."""
    return {"make": make, "model": model, "serial": serial,
            "logical": {"x": x, "y": y, "width": w, "height": 1440, "scale": 1.0}}


# Physical positions from conf/output.kdl — the grid the user actually runs.
WORK_OUTS = {"DP-1": out("HP Inc.", "HP 527pq", "CNK6090BWD", x=0, w=2560),
             "DP-2": out("HP Inc.", "HP 527pm", "1H36020GBC", x=2560, w=2560),
             "eDP-1": out("BOE", "0x0CE0", "None", x=5120, w=1920)}
HOME_OUTS = {"eDP-1": out("BOE", "0x0CE0", "None", x=5120, w=1920),
             "DP-3": out("HP Inc.", "HP 24fh", "3CM0330VYC", x=7040, w=1920),
             "DP-4": out("HP Inc.", "HP 24fh", "3CM033045N", x=8960, w=1920)}
OLTEN_OUTS = {"DP-5": out("LG Electronics", "LG TV", "0x01010101", x=1920, w=2560),
              "eDP-1": out("BOE", "0x0CE0", "None", x=5120, w=1920)}
BRUGG_OUTS = {"DP-1": out("HP Inc.", "HP E34m G4", "CNC4140Q0S", x=0, w=3127),
              "eDP-1": out("BOE", "0x0CE0", "None", x=5120, w=1920)}
LAPTOP_OUTS = {"eDP-1": out("BOE", "0x0CE0", "None", x=0, w=1920)}

SETUPS = [{"name": "work", "id": "aaaa1111", "roles": WORK_ROLES},
          {"name": "laptop", "roles": [LAPTOP]}]  # legacy: no id yet


def ws(id, output, idx):
    return {"id": id, "output": output, "idx": idx}


def win(id, ws_id):
    return {"id": id, "workspace_id": ws_id}


class SignatureTest(unittest.TestCase):
    def test_position_order_ignores_connector_names(self):
        self.assertEqual(layout.signature(WORK_OUTS),
                         ["HP Inc. HP 527pq CNK6090BWD",
                          "HP Inc. HP 527pm 1H36020GBC", LAPTOP])

    def test_same_monitors_different_arrangement_different_id(self):
        tv_left = {"DP-5": OLTEN_OUTS["DP-5"], "eDP-1": OLTEN_OUTS["eDP-1"]}
        tv_right = {"DP-5": out("LG Electronics", "LG TV", "0x01010101", x=7680, w=2560),
                    "eDP-1": OLTEN_OUTS["eDP-1"]}
        self.assertNotEqual(layout.setup_id(tv_left), layout.setup_id(tv_right))

    def test_id_is_stable_and_short(self):
        self.assertEqual(layout.setup_id(WORK_OUTS), layout.setup_id(dict(reversed(list(WORK_OUTS.items())))))
        self.assertRegex(layout.setup_id(WORK_OUTS), r"^[0-9a-f]{8}$")


class DefaultRolesTest(unittest.TestCase):
    """The centrality rule must reproduce every hand-written setup."""

    def test_work_middle_monitor_primary(self):
        self.assertEqual(layout.default_roles(WORK_OUTS), WORK_ROLES)

    def test_home_middle_monitor_primary_laptop_last_on_tie(self):
        # laptop (left) and 045N (right) tie in centrality; laptop goes last
        self.assertEqual(layout.default_roles(HOME_OUTS), HOME_ROLES)

    def test_olten_centermost_external_primary(self):
        self.assertEqual(layout.default_roles(OLTEN_OUTS),
                         ["LG Electronics LG TV 0x01010101", LAPTOP])

    def test_brugg_external_primary(self):
        self.assertEqual(layout.default_roles(BRUGG_OUTS),
                         ["HP Inc. HP E34m G4 CNC4140Q0S", LAPTOP])

    def test_single_monitor(self):
        self.assertEqual(layout.default_roles(LAPTOP_OUTS), [LAPTOP])


class DetectTest(unittest.TestCase):
    def test_match_by_id(self):
        s, how = layout.detect_setup(SETUPS, "aaaa1111", "cccc3333", WORK_ROLES)
        self.assertEqual((s["name"], how), ("work", "id"))

    def test_legacy_entry_falls_back_to_identity_set(self):
        s, how = layout.detect_setup(SETUPS, "ffff2222", "cccc3333", [LAPTOP])
        self.assertEqual((s["name"], how), ("laptop", "legacy"))

    def test_id_entry_requires_id_match(self):
        # set matches "work" but the id differs: not a match
        s, how = layout.detect_setup(SETUPS, "ffff2222", "cccc3333", WORK_ROLES)
        self.assertIsNone(s)

    def test_monitor_set_fallback(self):
        setups = [{"name": "twice", "id": "bbbb2222", "set": "cccc3333",
                   "roles": WORK_ROLES}]
        s, how = layout.detect_setup(setups, "ffff2222", "cccc3333", WORK_ROLES)
        self.assertEqual((s["name"], how), ("twice", "set"))

    def test_unknown_set_is_not_matched(self):
        s, how = layout.detect_setup(SETUPS, "ffff2222", "dddd4444", ["Some TV", LAPTOP])
        self.assertIsNone(s)


class DefaultRolesFromOrderTest(unittest.TestCase):
    """Centrality from a human-declared left-to-right sequence (no geometry) -
    fed the true desk orders it must reproduce the hand-written setups."""

    def test_work(self):
        desk = ["HP Inc. HP 527pq CNK6090BWD", "HP Inc. HP 527pm 1H36020GBC", LAPTOP]
        self.assertEqual(layout.default_roles_from_order(desk, {LAPTOP}), WORK_ROLES)

    def test_home(self):
        desk = [LAPTOP, "HP Inc. HP 24fh 3CM0330VYC", "HP Inc. HP 24fh 3CM033045N"]
        self.assertEqual(layout.default_roles_from_order(desk, {LAPTOP}), HOME_ROLES)

    def test_two_screens_tie_puts_internal_last(self):
        self.assertEqual(layout.default_roles_from_order([LAPTOP, "TV"], {LAPTOP}), ["TV", LAPTOP])
        self.assertEqual(layout.default_roles_from_order(["TV", LAPTOP], {LAPTOP}), ["TV", LAPTOP])


class IdsTest(unittest.TestCase):
    def test_order_id_changes_with_arrangement(self):
        a = layout.order_id(["A", "B"])
        b = layout.order_id(["B", "A"])
        self.assertNotEqual(a, b)
        self.assertEqual(a, layout.order_id(["A", "B"]))

    def test_set_id_is_arrangement_independent(self):
        self.assertEqual(layout.set_id(["A", "B", "C"]), layout.set_id(["C", "A", "B"]))
        self.assertNotEqual(layout.set_id(["A", "B"]), layout.set_id(["A", "C"]))


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
        workspaces = [ws(30, "eDP-1", 1), ws(31, "eDP-1", 2),
                      ws(10, "eDP-1", 3), ws(11, "eDP-1", 4),
                      ws(20, "eDP-1", 5)]
        windows = [win(i, w["id"]) for i, w in enumerate(workspaces)]
        moves = layout.plan(state, ["eDP-1"], workspaces, windows)
        # converge mentally: apply each move to a copy and check the strip
        pos = {w["id"]: w["idx"] for w in workspaces}
        for ws_id, _conn, idx in moves:
            pos[ws_id] = idx
        self.assertEqual([pos[i] for i in state["order"]], [1, 2, 3, 4, 5])

    def test_expand_splits_by_sizes(self):
        state = {"order": [10, 11, 20, 30, 31], "sizes": [2, 1, 2]}
        # all on the laptop (post-train), blocks interleaved by collapse order
        workspaces = [ws(10, "eDP-1", 1), ws(11, "eDP-1", 2),
                      ws(20, "eDP-1", 3), ws(30, "eDP-1", 4),
                      ws(31, "eDP-1", 5)]
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
