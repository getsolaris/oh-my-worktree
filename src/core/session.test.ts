import { afterEach, describe, expect, it } from "bun:test";
import { existsSync } from "fs";
import { join } from "path";
import { cleanupTempDirs, createTempDir, createTempRepo, runGit } from "./test-helpers";
import {
  toSessionName,
  fromSessionName,
  writeSessionMeta,
  readSessionMeta,
  removeSessionMeta,
} from "./session";

afterEach(cleanupTempDirs);

describe("toSessionName", () => {
  it("converts branch with slashes to safe session name", () => {
    expect(toSessionName("feat/auth-token")).toBe("omw:feat-auth-token");
  });

  it("converts branch with multiple slashes", () => {
    expect(toSessionName("fix/ui/sidebar")).toBe("omw:fix-ui-sidebar");
  });

  it("handles simple branch name", () => {
    expect(toSessionName("main")).toBe("omw:main");
  });

  it("replaces special characters with underscore", () => {
    expect(toSessionName("feat/auth@v2#test")).toBe("omw:feat-auth_v2_test");
  });

  it("uses custom prefix", () => {
    expect(toSessionName("main", "wt")).toBe("wt:main");
  });
});

describe("fromSessionName", () => {
  it("extracts branch from session name", () => {
    expect(fromSessionName("omw:feat-auth-token")).toBe("feat-auth-token");
  });

  it("returns null for non-omw session", () => {
    expect(fromSessionName("other:session")).toBeNull();
  });

  it("returns null for plain name", () => {
    expect(fromSessionName("my-session")).toBeNull();
  });

  it("uses custom prefix", () => {
    expect(fromSessionName("wt:main", "wt")).toBe("main");
  });
});

describe("session metadata", () => {
  it("writes and reads metadata for main worktree", async () => {
    const repoPath = await createTempRepo();
    const info = {
      name: "omw:test-branch",
      branch: "test-branch",
      worktreePath: repoPath,
      createdAt: "2025-01-01T00:00:00.000Z",
    };

    writeSessionMeta(repoPath, info);
    const result = readSessionMeta(repoPath);
    expect(result).toEqual(info);
  });

  it("writes and reads metadata for linked worktree", async () => {
    const repoPath = await createTempRepo();
    const wtPath = createTempDir("omw-session-wt-");
    await runGit(["worktree", "add", wtPath, "-b", "test-session"], repoPath);

    const info = {
      name: "omw:test-session",
      branch: "test-session",
      worktreePath: wtPath,
      createdAt: "2025-01-01T00:00:00.000Z",
      layout: "api",
    };

    writeSessionMeta(wtPath, info);
    const result = readSessionMeta(wtPath);
    expect(result).toEqual(info);

    expect(existsSync(join(wtPath, ".omw-session"))).toBeFalse();
  });

  it("returns null when no metadata exists", async () => {
    const repoPath = await createTempRepo();
    expect(readSessionMeta(repoPath)).toBeNull();
  });

  it("removes metadata", async () => {
    const repoPath = await createTempRepo();
    writeSessionMeta(repoPath, {
      name: "omw:test",
      branch: "test",
      worktreePath: repoPath,
      createdAt: "2025-01-01T00:00:00.000Z",
    });

    expect(readSessionMeta(repoPath)).not.toBeNull();
    removeSessionMeta(repoPath);
    expect(readSessionMeta(repoPath)).toBeNull();
  });

  it("removeSessionMeta is idempotent", async () => {
    const repoPath = await createTempRepo();
    removeSessionMeta(repoPath);
    removeSessionMeta(repoPath);
  });
});
