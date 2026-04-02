import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type SkillPlatform = "claude-code" | "codex" | "opencode";

export const SUPPORTED_PLATFORMS: SkillPlatform[] = [
  "claude-code",
  "codex",
  "opencode",
];

export interface SkillWriteResult {
  filePath: string;
  platform: SkillPlatform;
  action: "created" | "updated";
}

export function getSkillDir(platform: SkillPlatform): string {
  const home = process.env.HOME || process.env.USERPROFILE || "~";
  switch (platform) {
    case "claude-code":
      return join(home, ".claude", "skills", "omw");
    case "codex":
      return join(home, ".agents", "skills", "omw");
    case "opencode":
      return join(home, ".config", "opencode", "skill", "omw");
  }
}

export function getSkillFilePath(platform: SkillPlatform): string {
  return join(getSkillDir(platform), "SKILL.md");
}

function generateSkillBody(): string {
  return [
    "Git worktree manager. Use `omw` commands instead of raw `git worktree`.",
    "",
    "## Commands",
    "",
    "```bash",
    "omw list [--json]                          # List all worktrees",
    "omw add <branch> --create [--base main]    # Create new branch + worktree",
    "omw add <existing-branch>                  # Worktree for existing branch",
    "omw remove <branch> [--force]              # Remove worktree",
    "omw switch <branch>                        # Switch to worktree directory",
    "omw status [--json]                        # Worktree status overview",
    'omw exec "<cmd>" --all [--parallel]        # Run command in all worktrees',
    "omw doctor [--fix]                         # Health check & auto-fix",
    "omw clean [--dry-run]                      # Remove merged worktrees",
    "omw diff <ref1> [ref2] [--stat]            # Compare branches",
    'omw pin <branch> [--reason "..."]          # Protect from cleanup',
    "omw archive <branch>                       # Archive changes before removal",
    "omw log [--limit N]                        # Activity history",
    "omw session [branch] [--layout <name>]     # Tmux session management",
    "omw clone <url> [--template <name>]        # Clone repo with omw setup",
    "omw import <path>                          # Adopt existing worktree",
    "omw rename <old> <new>                     # Rename worktree branch",
    "omw open [branch]                          # Open worktree in editor",
    "```",
    "",
    "## Workflows",
    "",
    "### Create a feature worktree",
    "",
    "```bash",
    "omw add feature/my-feature --create --base main",
    "# cd to the worktree path (shown in output)",
    "```",
    "",
    "### Check worktrees",
    "",
    "```bash",
    "omw list --json   # JSON output for parsing",
    "omw status --json # Status with upstream info",
    "```",
    "",
    "### Clean up",
    "",
    "```bash",
    "omw remove feature/done          # Remove single worktree",
    "omw clean --dry-run              # Preview merged worktree cleanup",
    "omw clean                        # Execute cleanup",
    "```",
    "",
    "### Cross-worktree operations",
    "",
    "```bash",
    'omw exec "git pull" --all --parallel   # Pull in all worktrees',
    'omw exec "bun test" --dirty            # Test only dirty worktrees',
    "```",
    "",
    "## Notes",
    "",
    "- Config: `~/.config/oh-my-worktree/config.json`",
    "- Use `--json` flag for machine-readable output",
    "- Worktree paths are configured via `worktreeDir` in config",
    "- `omw doctor --fix` auto-repairs common issues",
    "- Environment vars in exec: `OMW_BRANCH`, `OMW_WORKTREE_PATH`, `OMW_REPO_PATH`",
  ].join("\n");
}

const SKILL_DESCRIPTION =
  "Git worktree manager. Use when working with git worktrees — creating, switching, removing, listing, or managing worktrees across repositories.";

export function generateSkillContent(): string {
  const body = generateSkillBody();

  return [
    "---",
    "name: omw",
    `description: ${SKILL_DESCRIPTION}`,
    "---",
    "",
    "# oh-my-worktree (omw)",
    "",
    body,
    "",
  ].join("\n");
}

export function writeSkillFile(platform: SkillPlatform): SkillWriteResult {
  const filePath = getSkillFilePath(platform);
  const content = generateSkillContent();
  const dir = dirname(filePath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const existed = existsSync(filePath);
  writeFileSync(filePath, content, "utf-8");

  return {
    filePath,
    platform,
    action: existed ? "updated" : "created",
  };
}
