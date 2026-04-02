import type { CommandModule } from "yargs";
import { GitWorktree, invalidateGitCache } from "../../core/git.ts";
import { logActivity } from "../../core/activity-log.ts";
import { GitError } from "../../core/types.ts";
import { dirname, basename, join } from "node:path";

const cmd: CommandModule = {
  command: "rename <old> <new>",
  describe: "Rename worktree branch",
  builder: (yargs) =>
    yargs
      .positional("old", { type: "string", demandOption: true, describe: "Current branch name" })
      .positional("new", { type: "string", demandOption: true, describe: "New branch name" })
      .option("move-path", { type: "boolean", describe: "Also rename the worktree directory path" }),
  handler: async (argv) => {
    const oldBranch = argv.old as string;
    const newBranch = argv.new as string;
    const movePath = !!argv["move-path"];

    try {
      const mainRepoPath = await GitWorktree.getMainRepoPath().catch(() => process.cwd());
      const worktrees = await GitWorktree.list(mainRepoPath);

      const target = worktrees.find(
        (wt) => wt.branch === oldBranch || wt.path === oldBranch || wt.path.endsWith("/" + oldBranch),
      );
      if (!target) {
        console.error(`Error: no worktree found for '${oldBranch}'`);
        process.exit(1);
      }
      if (target.isMain) {
        console.error(`Error: cannot rename the main worktree branch`);
        process.exit(1);
      }

      const existing = worktrees.find((wt) => wt.branch === newBranch);
      if (existing) {
        console.error(`Error: branch '${newBranch}' already exists`);
        process.exit(1);
      }

      const proc = (Bun as any).spawn(["git", "branch", "-m", oldBranch, newBranch], {
        cwd: mainRepoPath,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, LC_ALL: "C" },
      });
      const exitCode = await proc.exited;
      if (exitCode !== 0) {
        const stderr = await new Response(proc.stderr).text();
        throw new GitError(`Failed to rename branch: ${stderr.trim()}`, exitCode, stderr, `git branch -m ${oldBranch} ${newBranch}`);
      }
      invalidateGitCache();

      if (movePath) {
        const branchSlug = newBranch.replace(/\//g, "-");
        const parentDir = dirname(target.path);
        const oldBasename = basename(target.path);
        const oldBranchSlug = oldBranch.replace(/\//g, "-");
        const newBasename = oldBasename.replace(oldBranchSlug, branchSlug);
        const newPath = join(parentDir, newBasename);

        if (newPath !== target.path) {
          await GitWorktree.move(target.path, newPath, mainRepoPath);
          invalidateGitCache();
          console.log(`Moved worktree: ${target.path} → ${newPath}`);
        }
      }

      console.log(`Renamed branch: ${oldBranch} → ${newBranch}`);
      try {
        logActivity(mainRepoPath, {
          timestamp: new Date().toISOString(),
          event: "rename",
          branch: newBranch,
          details: { oldBranch: oldBranch },
        });
      } catch {}
      process.exit(0);
    } catch (err) {
      if (err instanceof GitError) {
        console.error(`Git error: ${err.message}`);
      } else {
        console.error(`Error: ${(err as Error).message}`);
      }
      process.exit(1);
    }
  },
};

export default cmd;
