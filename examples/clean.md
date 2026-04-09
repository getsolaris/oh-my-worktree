# oml clean

Remove merged worktrees and prune stale entries.

## Usage

```
oml clean
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--dry-run` | `-n` | Show what would be removed without removing |
| `--yes` | `-y` | Skip confirmation prompt |
| `--stale` | | Also show stale worktrees (based on lifecycle config) |

## Examples

### Preview what would be cleaned

```bash
oml clean --dry-run
```

### Clean merged worktrees

```bash
oml clean
```

### Clean without confirmation

```bash
oml clean -y
```

### Include stale worktrees in cleanup

```bash
oml clean --stale
```

### Preview stale worktrees without removing

```bash
oml clean --stale --dry-run
```
