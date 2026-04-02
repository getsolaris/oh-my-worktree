import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";

export interface PRMeta {
  number: number;
  branch: string;
  createdAt: string;
}

function getPRMetaPath(worktreePath: string): string {
  const gitPath = join(worktreePath, ".git");
  const stat = statSync(gitPath, { throwIfNoEntry: false });

  if (!stat) {
    return join(gitPath, "omw-pr");
  }

  if (stat.isDirectory()) {
    return join(gitPath, "omw-pr");
  }

  const content = readFileSync(gitPath, "utf-8").trim();
  const actualGitDir = content.replace(/^gitdir:\s*/, "").trim();
  const resolvedGitDir = resolve(worktreePath, actualGitDir);

  return join(resolvedGitDir, "omw-pr");
}

export function writePRMeta(worktreePath: string, meta: PRMeta): void {
  const metaPath = getPRMetaPath(worktreePath);
  mkdirSync(dirname(metaPath), { recursive: true });
  writeFileSync(metaPath, JSON.stringify(meta), { encoding: "utf-8", mode: 0o600 });
}

export function readPRMeta(worktreePath: string): PRMeta | null {
  const metaPath = getPRMetaPath(worktreePath);

  if (!existsSync(metaPath)) {
    return null;
  }

  try {
    const content = readFileSync(metaPath, "utf-8");
    return JSON.parse(content) as PRMeta;
  } catch {
    return null;
  }
}
