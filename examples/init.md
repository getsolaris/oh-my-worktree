# oml init

Initialize oml config or install oml skill for AI coding agents.

## Usage

```
oml init
oml init --skill <platform>
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--skill` | `-s` | Install AI agent skill for the specified platform |

## Supported Platforms

| Platform | Skill Path |
|----------|-----------|
| `claude-code` | `~/.claude/skills/oml/SKILL.md` |
| `codex` | `~/.agents/skills/oml/SKILL.md` |
| `opencode` | `~/.config/opencode/skill/oml/SKILL.md` |

## Examples

### Initialize config only

```bash
oml init
# ✓ Initialized config → ~/.config/oh-my-lemontree/config.json
```

### Install skill for Claude Code

```bash
oml init --skill claude-code
# ✓ Installed → ~/.claude/skills/oml/
#     SKILL.md
#     references/ (21 commands)
```

### Install skill for Codex

```bash
oml init --skill codex
# ✓ Installed → ~/.agents/skills/oml/
#     SKILL.md
#     references/ (21 commands)
```

### Install skill for OpenCode

```bash
oml init --skill opencode
# ✓ Installed → ~/.config/opencode/skill/oml/
#     SKILL.md
#     references/ (21 commands)
```

## Behavior

- **Without `--skill`**: Reuses config initialization and creates only `config.json`
- **First skill install**: Creates the skill directory and `SKILL.md` file
- **Subsequent skill installs**: Updates the skill files (idempotent)

All platforms use the same `SKILL.md` format with `name` and `description` frontmatter.
