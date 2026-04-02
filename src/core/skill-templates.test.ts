import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { cleanupTempDirs, createTempDir } from "./test-helpers.ts";
import {
  generateSkillContent,
  getSkillDir,
  getSkillFilePath,
  writeSkillFile,
  SUPPORTED_PLATFORMS,
} from "./skill-templates.ts";

let origHome: string | undefined;

beforeEach(() => {
  origHome = process.env.HOME;
  process.env.HOME = createTempDir("omw-skill-home-");
});

afterEach(() => {
  process.env.HOME = origHome;
  cleanupTempDirs();
});

describe("SUPPORTED_PLATFORMS", () => {
  it("contains all expected platforms", () => {
    expect(SUPPORTED_PLATFORMS).toContain("claude-code");
    expect(SUPPORTED_PLATFORMS).toContain("codex");
    expect(SUPPORTED_PLATFORMS).toContain("opencode");
    expect(SUPPORTED_PLATFORMS).toHaveLength(3);
  });
});

describe("getSkillDir", () => {
  it("returns ~/.claude/skills/omw for claude-code", () => {
    const dir = getSkillDir("claude-code");
    expect(dir).toEndWith(join(".claude", "skills", "omw"));
  });

  it("returns ~/.agents/skills/omw for codex", () => {
    const dir = getSkillDir("codex");
    expect(dir).toEndWith(join(".agents", "skills", "omw"));
  });

  it("returns ~/.config/opencode/skill/omw for opencode", () => {
    const dir = getSkillDir("opencode");
    expect(dir).toEndWith(join(".config", "opencode", "skill", "omw"));
  });
});

describe("getSkillFilePath", () => {
  it("returns SKILL.md for all platforms", () => {
    for (const platform of SUPPORTED_PLATFORMS) {
      const path = getSkillFilePath(platform);
      expect(path).toEndWith("SKILL.md");
    }
  });
});

describe("generateSkillContent", () => {
  it("includes SKILL.md frontmatter", () => {
    const content = generateSkillContent();
    expect(content).toStartWith("---\n");
    expect(content).toContain("name: omw");
    expect(content).toContain("description:");
  });

  it("includes omw command reference", () => {
    const content = generateSkillContent();
    expect(content).toContain("omw list");
    expect(content).toContain("omw add");
    expect(content).toContain("omw remove");
    expect(content).toContain("omw switch");
    expect(content).toContain("omw exec");
    expect(content).toContain("omw doctor");
  });

  it("includes workflow examples", () => {
    const content = generateSkillContent();
    expect(content).toContain("## Workflows");
    expect(content).toContain("--create");
    expect(content).toContain("--json");
  });

  it("includes config path", () => {
    const content = generateSkillContent();
    expect(content).toContain("~/.config/oh-my-worktree/config.json");
  });
});

describe("writeSkillFile", () => {
  it("creates skill file with directory structure", () => {
    const result = writeSkillFile("codex");

    expect(result.action).toBe("created");
    expect(result.platform).toBe("codex");
    expect(result.filePath).toContain(join(".agents", "skills", "omw", "SKILL.md"));
    expect(existsSync(result.filePath)).toBeTrue();

    const content = readFileSync(result.filePath, "utf-8");
    expect(content).toContain("name: omw");
    expect(content).toContain("oh-my-worktree");
  });

  it("creates claude-code skill in ~/.claude/skills/omw/", () => {
    const result = writeSkillFile("claude-code");

    expect(result.action).toBe("created");
    expect(result.filePath).toContain(join(".claude", "skills", "omw", "SKILL.md"));
    expect(existsSync(result.filePath)).toBeTrue();
  });

  it("creates opencode skill in ~/.config/opencode/skill/omw/", () => {
    const result = writeSkillFile("opencode");

    expect(result.action).toBe("created");
    expect(result.filePath).toContain(join(".config", "opencode", "skill", "omw", "SKILL.md"));
    expect(existsSync(result.filePath)).toBeTrue();
  });

  it("updates existing skill file", () => {
    writeSkillFile("codex");
    const result = writeSkillFile("codex");

    expect(result.action).toBe("updated");
  });

  it("is idempotent — running twice produces same content", () => {
    writeSkillFile("opencode");
    const first = readFileSync(getSkillFilePath("opencode"), "utf-8");

    writeSkillFile("opencode");
    const second = readFileSync(getSkillFilePath("opencode"), "utf-8");

    expect(first).toBe(second);
  });

  it("creates nested directories when they do not exist", () => {
    const dir = getSkillDir("codex");
    expect(existsSync(dir)).toBeFalse();

    writeSkillFile("codex");
    expect(existsSync(dir)).toBeTrue();
  });

  it("all platforms produce valid SKILL.md with frontmatter", () => {
    for (const platform of SUPPORTED_PLATFORMS) {
      const result = writeSkillFile(platform);
      const content = readFileSync(result.filePath, "utf-8");

      expect(content).toStartWith("---\n");
      expect(content).toContain("name: omw");
      expect(content).toContain("description:");
      expect(content).toContain("omw list");
    }
  });
});
