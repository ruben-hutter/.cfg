# place

Keep [niri](https://github.com/YaLTeR/niri) workspaces arranged by monitor role
across setup changes (desk order + importance order, learned per monitor
arrangement). See `architecture.html` for the design overview.

## Layout

| file             | role                                                        |
| ---------------- | ----------------------------------------------------------- |
| `place.py`       | CLI + `watch` daemon; the only process that moves workspaces |
| `layout.py`      | pure layout logic (no I/O)                                  |
| `niri.py`        | thin seam over `niri msg`                                   |
| `arrange_gtk.py` | GTK badge overlay for `setup`/`arrange`/`locate`            |
| `test_layout.py` | unittest suite for `layout.py`                              |
| `place.json`     | learned state — runtime data, gitignored                    |

Flat module layout on purpose: niri autostart and the overlay spawn
(`Path(__file__).parent / "arrange_gtk.py"`) both rely on sources living in
this directory.

## Running

Runs on the **system python3** — no venv, no uv required:

```sh
python3 place.py show    # watch/apply/setup/locate/arrange/align/show/pause/resume
python3 -m unittest test_layout.py -v
```

Runtime requirements (Fedora):

- `python3` — everything except the overlay is stdlib-only
- `python3-gobject` — only for the badge overlay of `setup`/`arrange`/`locate`;
  preinstalled on Fedora Workstation, otherwise `sudo dnf install python3-gobject`

The daemon is started by niri (`conf/autostart.kdl`):

```kdl
spawn-at-startup "python3" "/home/ruben/.config/niri/place/place.py" "watch"
```

## Development (optional)

uv manages only dev tooling (pytest, ruff). The runtime never touches the
venv, so sharing the folder means: copy the `.py` files, done.

```sh
uv sync             # .venv with pytest + ruff only — nothing gets compiled
uv run pytest
uv run ruff check .
```

Don't run the overlay through the venv (`uv run python place.py setup`) — the
dev venv has no PyGObject; use the system `python3 place.py …`.
