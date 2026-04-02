import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import type { ActivityEvent } from "./types.ts";

const maxLogLines = 1000;
const truncateToLines = 500;

export function getActivityLogPath(repoPath: string): string {
  const gitPath = join(repoPath, ".git");
  const stat = statSync(gitPath, { throwIfNoEntry: false });

  if (!stat) {
    return join(gitPath, "omw-activity.log");
  }

  if (stat.isDirectory()) {
    return join(gitPath, "omw-activity.log");
  }

  const content = readFileSync(gitPath, "utf-8").trim();
  const actualGitDir = content.replace(/^gitdir:\s*/, "").trim();
  const resolvedGitDir = resolve(repoPath, actualGitDir);

  return join(resolvedGitDir, "omw-activity.log");
}

export function logActivity(repoPath: string, event: ActivityEvent): void {
  const activityLogPath = getActivityLogPath(repoPath);
  mkdirSync(dirname(activityLogPath), { recursive: true });

  appendFileSync(activityLogPath, `${JSON.stringify(event)}\n`, { encoding: "utf-8", mode: 0o600 });

  const lines = readFileSync(activityLogPath, "utf-8").split(/\r?\n/).filter(Boolean);
  if (lines.length > maxLogLines) {
    const recentLines = lines.slice(-truncateToLines);
    writeFileSync(activityLogPath, `${recentLines.join("\n")}\n`, { encoding: "utf-8", mode: 0o600 });
  }
}

export function readActivityLog(repoPath: string, opts?: { limit?: number }): ActivityEvent[] {
  const activityLogPath = getActivityLogPath(repoPath);
  const limit = opts?.limit ?? 50;

  if (!existsSync(activityLogPath)) {
    return [];
  }

  const lines = readFileSync(activityLogPath, "utf-8").split(/\r?\n/).filter(Boolean);
  const events = lines.map((line) => JSON.parse(line) as ActivityEvent);

  return events.reverse().slice(0, limit);
}

export function clearActivityLog(repoPath: string): void {
  rmSync(getActivityLogPath(repoPath), { force: true });
}
