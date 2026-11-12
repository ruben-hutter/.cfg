# Gondolin opt-in sandbox for pi

Runs pi's built-in tools inside a local QEMU micro-VM (Alpine Linux). The
directory pi was started in is mounted at `/workspace` in the guest; file
changes there write through to the host. Everything else (guest filesystem,
processes) is discarded when the sandbox turns off.

The extension is **dormant by default**: in a plain session every tool runs
locally, exactly like pi without extensions.

## Usage

- `/sandbox` — toggle on/off mid-session (VM boots in a few seconds)
- `/sandbox on` / `/sandbox off` / `/sandbox status`
- `PI_SANDBOX=1 pi ...` — start with the sandbox already active
- Move an existing session into the sandbox: leave pi, then
  `pi-sbx --continue` (same folder) and run `/sandbox`.

## Node versions

Activating the sandbox requires Node >= 23.6 (Gondolin's requirement). Plain
`pi` uses the system Node and works fine — `/sandbox` there fails with a hint.

- `pi-sbx` (in `~/.local/bin`) = pi with Node 24 from `~/.local/lib/node-v24`
  prepended to PATH. No other difference.
- The extension itself loads harmlessly under any Node version; only the
  gondolin import is deferred to activation time.

## What the VM can and cannot do

Can:
- read/write the started directory via `/workspace` (write-through)
- run commands, install toolchains (`apk add git`, `cargo`, `npm`, ...) —
  network egress is open by default
- commit to git in the worktree (host git identity is seeded into the guest)

Cannot:
- see or modify anything else on the host (mount boundary = start directory)
- push over SSH (no host SSH keys in guest) — review and push from the host
- keep `apk`-installed packages between sessions (guest image is ephemeral;
  first git command of a session: `apk add git`)

## Persistent caches (host-backed)

| Guest path       | Host path                       |
| ---------------- | ------------------------------- |
| `/root/.cargo`   | `~/.cache/pi-sbx/cargo`         |
| `/root/.rustup`  | `~/.cache/pi-sbx/rustup`        |
| `/root/.npm`     | `~/.cache/pi-sbx/npm`           |

Toolchains installed via rustup/npm therefore survive sessions. If these
mounts ever fail, the VM starts without them (a warning is shown).

## Worktrees (bare repo layout)

Start pi from the **repo root** (the folder containing `.bare` and the
worktrees), e.g. `~/repos/cvlt-web`. The mount then contains git metadata and
all worktrees, so git works naturally and parallel sessions in different
worktrees are separate VMs sharing only that mount.

## Requirements

- QEMU (`qemu-system-x86_64`) — installed
- Node >= 23.6 for activation — via `pi-sbx`
- First activation downloads the ~200 MB Alpine image to
  `~/.cache/gondolin/images/`

## Removal

Delete `~/.pi/agent/extensions/gondolin/`, `~/.local/bin/pi-sbx`, and
optionally `~/.local/lib/node-v24` and `~/.cache/pi-sbx/`.
