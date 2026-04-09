# oml session

Manage tmux sessions for worktrees. Requires tmux.

## Usage

```
oml session [branch-or-path]
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--list` | `-l` | List active oml tmux sessions |
| `--kill` | `-k` | Kill the session for the specified worktree |
| `--kill-all` | | Kill all oml tmux sessions |
| `--layout` | | Use a named layout from config |
| `--json` | `-j` | Output in JSON format |

## Examples

### Open a session for a worktree

```bash
oml session feature/auth
```

If a session exists, attaches to it. Otherwise creates one and attaches.

### Open with a specific layout

```bash
oml session feature/auth --layout api
```

### List active sessions

```bash
oml session --list
```

```
Active sessions (3):

  oml_feat-auth-token  feat/auth-token  3 windows [api]
  oml_feat-user-api    feat/user-api    3 windows [api] (attached)
  oml_fix-gateway      fix/gateway      1 windows
```

### List as JSON

```bash
oml session --list --json
```

### Kill a session

```bash
oml session feature/auth --kill
```

### Kill all oml sessions

```bash
oml session --kill-all
```

### Create worktree with session

```bash
oml add feature/login --session
oml add feature/login --session --layout api
```

### Auto-create/kill via config

```json
{
  "sessions": {
    "autoCreate": true,
    "autoKill": true,
    "defaultLayout": "dev",
    "layouts": {
      "dev": {
        "windows": [
          { "name": "editor", "command": "$EDITOR ." },
          { "name": "dev", "command": "bun dev" },
          { "name": "test", "command": "bun test --watch" }
        ]
      }
    }
  }
}
```

With `autoCreate: true`, every `oml add` automatically creates a tmux session.
With `autoKill: true`, every `oml remove` automatically kills the associated session.

### Auto-switch in tmux

With `sessions.enabled: true`, running `oml switch` inside tmux automatically switches to the target worktree's tmux session instead of outputting a `cd` command.
