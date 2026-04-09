# oml list

List all worktrees with their status.

## Usage

```
oml list
oml ls
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--json` | `-j` | Output as JSON |
| `--porcelain` | `-p` | Machine-readable output |
| `--all` | `-a` | List worktrees from all configured repos |

## Examples

### List worktrees in the current repo

```bash
oml list
```

### Use the short alias

```bash
oml ls
```

### Output as JSON (useful for scripting)

```bash
oml list --json
```

### Machine-readable output

```bash
oml list --porcelain
```

### List worktrees across all configured repos

```bash
oml list --all
```

### Pipe JSON output to jq for filtering

```bash
oml list --json | jq '.[] | select(.dirty == true)'
```
