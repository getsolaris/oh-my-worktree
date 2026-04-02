import { statSync, readFileSync, writeFileSync, unlinkSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import type { PinMetadata, Worktree } from "./types.ts";

function getPinFilePath(worktreePath: string): string {
  const gitPath = join(worktreePath, ".git");
  const stat = statSync(gitPath, { throwIfNoEntry: false });

  if (!stat) {
    return join(gitPath, "omw-pin");
  }

  if (stat.isDirectory()) {
    return join(gitPath, "omw-pin");
  }

  const content = readFileSync(gitPath, "utf-8").trim();
  const actualGitDir = content.replace(/^gitdir:\s*/, "").trim();
  const resolvedGitDir = resolve(worktreePath, actualGitDir);

  return join(resolvedGitDir, "omw-pin");
}

function getCurrentBranch(worktreePath: string): string {
  const pinFilePath = getPinFilePath(worktreePath);
  const gitDir = dirname(pinFilePath);
  const headFile = join(gitDir, "HEAD");
  const headContent = readFileSync(headFile, "utf-8").trim();
  const match = headContent.match(/^ref:\s+refs\/heads\/(.+)$/);
  return match ? match[1] : headContent;
}

export function writePin(worktreePath: string, reason?: string): void {
  const pinFilePath = getPinFilePath(worktreePath);
  const metadata: PinMetadata = {
    branch: getCurrentBranch(worktreePath),
    pinnedAt: new Date().toISOString(),
    ...(reason ? { reason } : {}),
  };

  mkdirSync(dirname(pinFilePath), { recursive: true });
  writeFileSync(pinFilePath, JSON.stringify(metadata), { encoding: "utf-8", mode: 0o600 });
}

export function readPin(worktreePath: string): PinMetadata | null {
  const pinFilePath = getPinFilePath(worktreePath);
  if (!existsSync(pinFilePath)) {
    return null;
  }

  return JSON.parse(readFileSync(pinFilePath, "utf-8")) as PinMetadata;
}

export function removePin(worktreePath: string): void {
  const pinFilePath = getPinFilePath(worktreePath);
  if (!existsSync(pinFilePath)) {
    return;
  }

  unlinkSync(pinFilePath);
}

export function isPinned(worktreePath: string): boolean {
  return existsSync(getPinFilePath(worktreePath));
}

export function listPinnedWorktrees(worktrees: Worktree[]): Worktree[] {
  return worktrees.filter((worktree) => isPinned(worktree.path));
}
