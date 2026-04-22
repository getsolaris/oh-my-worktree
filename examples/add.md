# copse add

Create a new worktree for a branch.

## Usage

```
copse add <branch> [path]
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
| `--no-fetch` | | Skip auto-fetch when `--base` is a remote ref (e.g. `origin/main`) |

## Examples

### Create a worktree for an existing branch

```bash
copse add feature/login
```

### Create a worktree with a new branch

```bash
copse add feature/auth
```

### Create a new branch based on a specific branch

```bash
copse add feature/api --base develop
```

### Create a new branch from a fresh remote ref (auto-fetch)

```bash
# copse runs `git fetch origin main` first, then branches from origin/main
copse add feature/api --base origin/main
```

When `--base` matches the pattern `<remote>/<branch>` and `<remote>` is a known git remote,
`copse add` automatically runs `git fetch <remote> <branch>` before creating the worktree. This
avoids accidentally branching from a stale local copy of a remote-tracking ref.

Pass `--no-fetch` to skip the auto-fetch (useful offline):

```bash
copse add feature/api --base origin/main --no-fetch
```

You can make this the default for a repo or workspace by setting `defaults.base` in config:

```json
{
  "version": 1,
  "defaults": {
    "base": "origin/main"
  }
}
```

With `defaults.base` set, running `copse add feature/x` (no `--base` flag) will auto-fetch
`origin/main` and branch from it.

### Specify a custom path for the worktree

```bash
copse add feature/login ../my-project-login
```

### Create a worktree from a GitHub PR

```bash
copse add --pr 42
```

### Use a config template

```bash
copse add feature/dashboard --template frontend
```

### Focus on specific monorepo packages

```bash
copse add feature/auth --focus @app/web,@app/api
```

### Combine multiple options

```bash
copse add feature/payments --base main --focus @app/billing --template backend
```

### Create a worktree with a tmux session

```bash
copse add feature/review --session --layout dev
```

`--create` remains supported for backward compatibility, but new branches are now created automatically when missing.
