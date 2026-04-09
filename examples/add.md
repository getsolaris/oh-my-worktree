# oml add

Create a new worktree for a branch.

## Usage

```
oml add <branch> [path]
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--create` | `-c` | Optional compatibility flag; missing branches are created automatically |
| `--base` | `-b` | Base branch or commit for the new branch |
| `--focus` | `-f` | Focus packages for monorepo (comma or space separated) |
| `--template` | `-t` | Use a named template from config |
| `--pr` | | Create worktree from a GitHub PR number (requires `gh` CLI) |
| `--session` | `-s` | Create a tmux session for this worktree |
| `--layout` | | Session layout name from config |

## Examples

### Create a worktree for an existing branch

```bash
oml add feature/login
```

### Create a worktree with a new branch

```bash
oml add feature/auth
```

### Create a new branch based on a specific branch

```bash
oml add feature/api --base develop
```

### Specify a custom path for the worktree

```bash
oml add feature/login ../my-project-login
```

### Create a worktree from a GitHub PR

```bash
oml add --pr 42
```

### Use a config template

```bash
oml add feature/dashboard --template frontend
```

### Focus on specific monorepo packages

```bash
oml add feature/auth --focus @app/web,@app/api
```

### Combine multiple options

```bash
oml add feature/payments --base main --focus @app/billing --template backend
```

### Create a worktree with a tmux session

```bash
oml add feature/review --session --layout dev
```

`--create` remains supported for backward compatibility, but new branches are now created automatically when missing.
