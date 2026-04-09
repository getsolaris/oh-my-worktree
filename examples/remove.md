# oml remove

Remove a worktree.

## Usage

```
oml remove <branch-or-path>
oml rm <branch-or-path>
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--force` | `-f` | Force removal even with uncommitted changes |
| `--yes` | `-y` | Skip confirmation prompt |

## Examples

### Remove a worktree by branch name

```bash
oml remove feature/login
```

### Use the short alias

```bash
oml rm feature/login
```

### Force remove a worktree with uncommitted changes

```bash
oml rm feature/experiment -f
```

### Skip the confirmation prompt

```bash
oml rm feature/old-branch -y
```

### Force remove without any prompts

```bash
oml rm feature/abandoned -f -y
```
