# oml archive

Archive worktree changes as a patch file and optionally remove the worktree.

## Usage

```
oml archive [branch]
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--yes` | `-y` | Skip confirmation prompt |
| `--keep` | | Archive without removing the worktree |
| `--list` | | List all archives |
| `--json` | `-j` | Output as JSON (with `--list`) |

## Examples

### Archive and remove the current worktree

```bash
oml archive
```

### Archive a specific worktree

```bash
oml archive feature/experiment
```

### Archive without removing

```bash
oml archive feature/wip --keep
```

### Archive without confirmation

```bash
oml archive feature/old -y
```

### List all archives

```bash
oml archive --list
```

### List archives as JSON

```bash
oml archive --list --json
```
