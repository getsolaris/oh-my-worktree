# omw open

Open a worktree in your editor or IDE. Auto-detects `$VISUAL` / `$EDITOR` and falls back to a known list of editors (`code`, `cursor`, `vim`, `nvim`, `emacs`, `nano`, `subl`, `zed`, `idea`, `webstorm`).

## Usage

```
omw open [branch-or-path]
```

If no argument is given, opens the current worktree.

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--editor` | `-e` | Editor command to use (overrides `$VISUAL`/`$EDITOR`) |
| `--focus` | `-f` | Open a specific focus path (must match a focus entry on the worktree) |
| `--root` | | Force the worktree root, ignoring any focus paths |
| `--list-editors` | | List detected editors on your system |

## Focus-aware behavior

`omw open` is aware of the focus paths set when a worktree is created with `--focus`:

- **0 focus paths set** → opens the worktree root (default behavior).
- **Exactly 1 focus path set** → opens `<worktree>/<focus>` automatically.
- **2+ focus paths set** → exits with an error and asks you to pick one with `--focus <path>` or fall back to `--root`. (The TUI shows an interactive picker on `o` instead.)

## Examples

### Open the current worktree in your default editor

```bash
omw open
```

### Open a specific worktree

```bash
omw open feature/login
```

### Open with a specific editor

```bash
omw open feature/login --editor code
```

### Open with a different IDE

```bash
omw open feature/login -e "webstorm"
```

### Open a worktree that has a single focus path

```bash
omw add feature/web --focus apps/web
omw open feature/web
# → opens <worktree>/apps/web automatically
```

### Open a specific focus path on a multi-focus worktree

```bash
omw add feature/full --focus apps/web,apps/api
omw open feature/full
# → Error: worktree has multiple focus paths set: apps/web, apps/api
#          Use --focus <path> to pick one, or --root to open the worktree root.

omw open feature/full --focus apps/api
# → opens <worktree>/apps/api

omw open feature/full -f apps/web
# → opens <worktree>/apps/web
```

### Force the worktree root, ignoring focus

```bash
omw open feature/full --root
# → opens <worktree> (the repo root inside the worktree)
```

### List available editors

```bash
omw open --list-editors
```
