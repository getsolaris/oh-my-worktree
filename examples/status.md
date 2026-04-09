# oml status

Show a status overview of all worktrees.

## Usage

```
oml status
oml st
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--json` | `-j` | Output as JSON |
| `--all` | `-a` | Show worktrees from all configured repos |

## Examples

### Show status of all worktrees

```bash
oml status
```

### Use the short alias

```bash
oml st
```

### Output as JSON

```bash
oml status --json
```

### Show status across all configured repos

```bash
oml status --all
```

### Combine flags

```bash
oml st -a -j
```
