import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { homedir } from "os";
import { basename, join, resolve } from "path";
import { GitWorktree } from "./git";
import { ArchiveError, type ArchiveEntry } from "./types";

function resolveBranchFromGitMetadata(worktreePath: string): string | null {
  const gitPath = join(worktreePath, ".git");
  const stat = statSync(gitPath, { throwIfNoEntry: false });
  if (!stat) return null;

  let gitDir = gitPath;

  if (!stat.isDirectory()) {
    const content = readFileSync(gitPath, "utf-8").trim();
    const actualGitDir = content.replace(/^gitdir:\s*/, "").trim();
    gitDir = resolve(worktreePath, actualGitDir);
  }

  const headPath = join(gitDir, "HEAD");
  if (!existsSync(headPath)) return null;

  const head = readFileSync(headPath, "utf-8").trim();
  const refMatch = head.match(/^ref:\s+(.+)$/);
  if (!refMatch) return null;
  return refMatch[1]?.replace(/^refs\/heads\//, "") ?? null;
}

async function runGit(args: string[], cwd: string): Promise<string> {
  const proc = (Bun as any).spawn(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...(Bun as any).env,
      LC_ALL: "C",
      LANG: "C",
    },
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${stderr.trim()}`);
  }

  return stdout;
}

export function getArchiveDir(): string {
  const home = (Bun as any).env.HOME ?? homedir();
  return join(home, ".omw", "archives");
}

export async function createArchive(worktreePath: string, repoPath: string): Promise<ArchiveEntry> {
  const repoName = basename(repoPath);
  const branch =
    (await GitWorktree.getBranchForWorktree(worktreePath)) ??
    resolveBranchFromGitMetadata(worktreePath) ??
    "detached-head";
  const sanitizedBranch = branch.replaceAll("/", "-");
  const archivedAt = new Date().toISOString();
  const timestamp = archivedAt.replaceAll(":", "-");

  const repoArchiveDir = join(getArchiveDir(), repoName);
  mkdirSync(repoArchiveDir, { recursive: true });

  const basePath = join(repoArchiveDir, `${sanitizedBranch}-${timestamp}`);
  const patchPath = `${basePath}.patch`;
  const metadataPath = `${basePath}.json`;

  try {
    const [dirtyDiff, recentPatch, lastCommit] = await Promise.all([
      runGit(["diff"], worktreePath),
      runGit(["format-patch", "-5", "HEAD", "--stdout"], worktreePath),
      GitWorktree.getLastCommit(worktreePath),
    ]);

    const patchContent = [
      "# OMW archive",
      `# repo: ${repoName}`,
      `# branch: ${branch}`,
      `# archivedAt: ${archivedAt}`,
      "",
      "# Uncommitted diff",
      dirtyDiff || "# (no uncommitted changes)",
      "",
      "# Recent commits (git format-patch -5 HEAD --stdout)",
      recentPatch || "# (no recent commits)",
    ].join("\n");

    writeFileSync(patchPath, patchContent, "utf-8");

    const entry: ArchiveEntry = {
      branch,
      repo: repoName,
      archivedAt,
      patchPath,
      commitHash: lastCommit?.hash ?? "",
      message: lastCommit?.message ?? "",
    };

    writeFileSync(metadataPath, JSON.stringify(entry, null, 2), "utf-8");
    return entry;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown archive error";
    throw new ArchiveError(`Failed to archive worktree: ${message}`, branch, "archive_failed");
  }
}

export async function listArchives(repoName?: string): Promise<ArchiveEntry[]> {
  const archiveDir = getArchiveDir();
  if (!existsSync(archiveDir)) return [];

  const pattern = repoName ? `${repoName}/*.json` : "**/*.json";
  const glob = new Bun.Glob(pattern);
  const entries: ArchiveEntry[] = [];

  for await (const path of glob.scan({ cwd: archiveDir, absolute: true })) {
    try {
      const content = readFileSync(path, "utf-8");
      entries.push(JSON.parse(content) as ArchiveEntry);
    } catch {
    }
  }

  return entries.sort((a, b) => {
    const left = Date.parse(a.archivedAt);
    const right = Date.parse(b.archivedAt);
    return right - left;
  });
}

export function getArchiveDetail(patchPath: string): string {
  return readFileSync(patchPath, "utf-8");
}
