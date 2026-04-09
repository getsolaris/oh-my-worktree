# oml pin

Pin or unpin a worktree. Pinned worktrees are excluded from auto-cleanup operations.

## Usage

```
oml pin [branch]
oml unpin [branch]
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--reason` | | Reason for pinning |
| `--list` | | List all pinned worktrees |
| `--json` | `-j` | Output as JSON |
| `--unpin` | | Unpin instead of pinning |

## Examples

### Pin the current worktree

```bash
oml pin
```

### Pin a specific worktree

```bash
oml pin feature/login
```

### Pin with a reason

```bash
oml pin feature/login --reason "long-running feature, do not clean"
```

### List all pinned worktrees

```bash
oml pin --list
```

### List pinned worktrees as JSON

```bash
oml pin --list --json
```

### Unpin a worktree

```bash
oml unpin feature/login
```

### Unpin using the flag

```bash
oml pin feature/login --unpin
```
