import type { Worktree } from "./types.ts";
import type { LifecycleConfig } from "./config.ts";
import { GitWorktree } from "./git.ts";
import { readPRMeta } from "./pr.ts";

export interface StaleWorktree {
  worktree: Worktree;
  lastActivity: Date | null;
  daysSinceActivity: number;
}

export interface LifecycleReport {
  merged: Worktree[];
  stale: StaleWorktree[];
  overLimit: boolean;
  totalCount: number;
  maxWorktrees: number | null;
}

export async function analyzeLifecycle(
  worktrees: Worktree[],
  config: LifecycleConfig,
  mainBranch: string,
  mainRepoPath: string,
): Promise<LifecycleReport> {
  const nonMain = worktrees.filter((wt) => !wt.isMain);

  const merged: Worktree[] = [];
  if (config.autoCleanMerged) {
    for (const wt of nonMain) {
      if (!wt.branch) continue;
      const isMerged = await GitWorktree.isMergedInto(wt.branch, mainBranch, mainRepoPath);
      if (isMerged && !wt.isDirty) {
        merged.push(wt);
      }
    }
  }

  const stale: StaleWorktree[] = [];
  if (config.staleAfterDays && config.staleAfterDays > 0) {
    const now = new Date();
    for (const wt of nonMain) {
      const lastActivity = await GitWorktree.getWorktreeLastActivity(wt.path);
      const daysSince = lastActivity
        ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;

      if (daysSince >= config.staleAfterDays) {
        stale.push({ worktree: wt, lastActivity, daysSinceActivity: daysSince === Infinity ? -1 : daysSince });
      }
    }
  }

  const overLimit = config.maxWorktrees
    ? nonMain.length > config.maxWorktrees
    : false;

  return {
    merged,
    stale,
    overLimit,
    totalCount: nonMain.length,
    maxWorktrees: config.maxWorktrees ?? null,
  };
}

export function formatLifecycleReport(report: LifecycleReport): string {
  const lines: string[] = [];

  if (report.merged.length > 0) {
    lines.push(`Merged worktrees (${report.merged.length}):`);
    for (const wt of report.merged) {
      lines.push(`  ${wt.branch ?? "(detached)"} → ${wt.path}`);
    }
  }

  if (report.stale.length > 0) {
    lines.push(`Stale worktrees (${report.stale.length}):`);
    for (const s of report.stale) {
      const daysLabel = s.daysSinceActivity < 0 ? "unknown" : `${s.daysSinceActivity} days`;
      lines.push(`  ${s.worktree.branch ?? "(detached)"} — inactive ${daysLabel}`);
    }
  }

  if (report.overLimit) {
    lines.push(`Worktree limit exceeded: ${report.totalCount}/${report.maxWorktrees}`);
  }

  if (lines.length === 0) {
    lines.push("All worktrees are healthy.");
  }

  return lines.join("\n");
}
