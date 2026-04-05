# Current Command Groups

Use this file as a convenience reference. Re-check the registry before large smoke runs.

## TUI Startup

- `bun run src/index.ts`

## Config / Init / Shell Setup

- `omw config`
- `omw init`
- `omw shell-init [shell]`
- `omw completion`

## Worktree Lifecycle

- `omw add [branch] [path]`
- `omw remove <branch-or-path>`
- `omw rm <branch-or-path>`
- `omw rename <old> <new>`
- `omw clean`
- `omw switch <branch-or-path>`

## Inspection / Reporting

- `omw list`
- `omw ls`
- `omw status`
- `omw st`
- `omw doctor`
- `omw diff <ref1> [ref2]`
- `omw exec <command>`
- `omw log`
- `omw logs`

## Metadata Helpers

- `omw pin [branch]`
- `omw unpin [branch]`
- `omw open [branch-or-path]`

## Remote / Import / Archive

- `omw clone <url> [path]`
- `omw import <path>`
- `omw archive [branch]`

## Session / tmux

- `omw session [branch-or-path]`
- `omw ss [branch-or-path]`

## Suggested Minimal Coverage

For a broad smoke pass, run at least one real invocation from each group, and for destructive groups run every registered command at least once in disposable fixtures.
