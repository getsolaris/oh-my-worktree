# oml switch

Switch to a worktree directory. Outputs a `cd` command for shell eval.

## Usage

```
oml switch <branch-or-path>
oml sw <branch-or-path>
```

## Prerequisites

Shell integration must be set up first. See [shell-init.md](shell-init.md).

## Examples

### Switch to a worktree by branch name

```bash
oml sw feature/login
```

### Switch using the full command name

```bash
oml switch feature/auth
```

### With shell integration (recommended)

After running `oml shell-init`, switching will automatically `cd` into the worktree:

```bash
# This changes your working directory to the worktree
oml sw feature/login
```

### Without shell integration

Without shell integration, you need to eval the output manually:

```bash
eval $(oml switch feature/login)
```
