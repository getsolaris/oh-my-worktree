# oml rename

Rename a worktree's branch.

## Usage

```
oml rename <old> <new>
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--move-path` | | Also rename the worktree directory path |

## Examples

### Rename a branch

```bash
oml rename feature/old-name feature/new-name
```

### Rename a branch and move the directory

```bash
oml rename feature/login feature/authentication --move-path
```
