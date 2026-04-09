# oml log

Show the worktree activity log. Tracks events like create, delete, switch, rename, archive, and import.

## Usage

```
oml log
oml logs
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--limit` | | Number of entries to show (default: 20) |
| `--json` | `-j` | Output as JSON |
| `--clear` | | Clear the activity log |

## Examples

### Show recent activity

```bash
oml log
```

### Show the last 5 entries

```bash
oml log --limit 5
```

### Show the last 50 entries

```bash
oml log --limit 50
```

### Output as JSON

```bash
oml log --json
```

### Clear the activity log

```bash
oml log --clear
```

### Use the alias

```bash
oml logs
```
