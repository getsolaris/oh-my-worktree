# oml exec

Run a command in each worktree.

## Usage

```
oml exec <command>
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--all` | `-a` | Run across all configured repos |
| `--dirty` | | Only run in dirty worktrees |
| `--clean` | | Only run in clean worktrees |
| `--behind` | | Only run in worktrees behind upstream |
| `--parallel` | `-p` | Run commands in parallel (default: sequential) |
| `--json` | `-j` | Output results as JSON |

## Examples

### Run a command in every worktree

```bash
oml exec "git status"
```

### Run only in dirty worktrees

```bash
oml exec "git stash" --dirty
```

### Run only in clean worktrees

```bash
oml exec "git pull" --clean
```

### Run only in worktrees behind upstream

```bash
oml exec "git pull --rebase" --behind
```

### Run in parallel for faster execution

```bash
oml exec "npm install" --parallel
```

### Run across all configured repos

```bash
oml exec "git fetch" --all
```

### Output results as JSON

```bash
oml exec "git log -1 --oneline" --json
```

### Combine filters with parallel execution

```bash
oml exec "npm test" --dirty --parallel
```
