# omw init

Install omw skill for AI coding agents.

## Usage

```
omw init --skill <platform>
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--skill` | `-s` | Install AI agent skill for the specified platform |

## Supported Platforms

| Platform | Skill Path |
|----------|-----------|
| `claude-code` | `~/.claude/skills/omw/SKILL.md` |
| `codex` | `~/.agents/skills/omw/SKILL.md` |
| `opencode` | `~/.config/opencode/skill/omw/SKILL.md` |

## Examples

### Install skill for Claude Code

```bash
omw init --skill claude-code
# ✓ Installed → ~/.claude/skills/omw/SKILL.md
```

### Install skill for Codex

```bash
omw init --skill codex
# ✓ Installed → ~/.agents/skills/omw/SKILL.md
```

### Install skill for OpenCode

```bash
omw init --skill opencode
# ✓ Installed → ~/.config/opencode/skill/omw/SKILL.md
```

## Behavior

- **First run**: Creates the skill directory and `SKILL.md` file
- **Subsequent runs**: Updates the `SKILL.md` file (idempotent)

All platforms use the same `SKILL.md` format with `name` and `description` frontmatter.
