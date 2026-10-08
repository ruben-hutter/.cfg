"""Thin seam over `niri msg` — the only place that talks to the compositor."""

import json
import subprocess


class Niri:
    def state(self):
        return (self.query_json("-j", "outputs"),
                self.query_json("-j", "workspaces"),
                self.query_json("-j", "windows"))

    def query(self, *args):
        r = subprocess.run(["niri", "msg", *args], capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError(f"niri msg {' '.join(args)}: {r.stderr.strip()}")
        return r.stdout.strip()

    def query_json(self, *args):
        return json.loads(self.query(*args))

    def raw(self, action):
        """Send one action. Returns the response text, or None on failure.
        NOTE: niri can answer "Handled" while silently doing nothing (e.g.
        while the session is locked) — callers must verify effects."""
        r = subprocess.run(
            ["niri", "msg", "raw-request"],
            input=json.dumps({"Action": action}),
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            return None
        return (r.stdout or "").strip()
