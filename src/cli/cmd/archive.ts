import type { CommandModule } from "yargs";
import { GitWorktree, invalidateGitCache } from "../../core/git.ts";
import { logActivity } from "../../core/activity-log.ts";
import { GitError } from "../../core/types.ts";
import { createArchive, listArchives } from "../../core/archive.ts";
import { loadConfig, getRepoConfig } from "../../core/config.ts";
import { executeHooks } from "../../core/hooks.ts";
import { basename } from "node:path";
import * as readline from "node:readline";

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

const cmd: CommandModule = {
  command: "archive [branch]",
  describe: "Archive worktree changes and optionally remove",
  builder: (yargs) =>
    yargs
      .positional("branch", { type: "string", describe: "Branch name or worktree path" })
      .option("yes", { type: "boolean", alias: "y", describe: "Skip confirmation prompt" })
      .option("keep", { type: "boolean", describe: "Archive without removing the worktree" })
      .option("list", { type: "boolean", describe: "List all archives" })
      .option("json", { type: "boolean", alias: "j", describe: "Output as JSON (with --list)" }),
  handler: async (argv) => {
    const branch = argv.branch as string | undefined;
    const yes = !!argv.yes;
    const keep = !!argv.keep;
    const list = !!argv.list;
    const json = !!argv.json;

    try {
      if (list) {
        const archives = await listArchives();
        if (json) {
          console.log(JSON.stringify(archives, null, 2));
        } else if (archives.length === 0) {
          console.log("No archives found.");
        } else {
          console.log("Archives:\n");
          for (const entry of archives) {
            const date = new Date(entry.archivedAt).toLocaleString();
            console.log(`  ${entry.repo}/${entry.branch}`);
            console.log(`    Date:   ${date}`);
            console.log(`    Commit: ${entry.commitHash.slice(0, 8)} ${entry.message}`);
            console.log(`    Patch:  ${entry.patchPath}`);
            console.log();
          }
        }
        process.exit(0);
      }

      if (!branch) {
        console.error("Error: branch name is required (or use --list to view archives)");
        process.exit(1);
      }

      const mainRepoPath = await GitWorktree.getMainRepoPath().catch(() => process.cwd());
      const worktrees = await GitWorktree.list(mainRepoPath);

      const target = worktrees.find(
        (wt) => wt.branch === branch || wt.path === branch || wt.path.endsWith("/" + branch),
      );
      if (!target) {
        console.error(`Error: no worktree found for '${branch}'`);
        process.exit(1);
      }
      if (target.isMain) {
        console.error(`Error: cannot archive the main worktree`);
        process.exit(1);
      }

      const action = keep ? "Archive" : "Archive and remove";
      if (!yes) {
        const confirmed = await confirm(`${action} worktree '${target.branch ?? basename(target.path)}'? [y/N] `);
        if (!confirmed) {
          console.log("Cancelled.");
          process.exit(0);
        }
      }

      const entry = await createArchive(target.path, mainRepoPath);
      console.log(`Archived: ${entry.patchPath}`);
      try {
        logActivity(mainRepoPath, {
          timestamp: new Date().toISOString(),
          event: "archive",
          branch: entry.branch,
          path: entry.patchPath,
        });
      } catch {}

      if (!keep) {
        const config = loadConfig();
        const repoConfig = getRepoConfig(config, mainRepoPath);
        if (repoConfig.postRemove.length > 0) {
          console.log("Running postRemove hooks...");
          await executeHooks(repoConfig.postRemove, {
            cwd: target.path,
            env: {
              OMW_BRANCH: target.branch ?? "",
              OMW_WORKTREE_PATH: target.path,
              OMW_REPO_PATH: mainRepoPath,
            },
            onOutput: (line) => console.log(`  ${line}`),
          }).catch((err) => console.warn(`Warning: postRemove hook failed: ${(err as Error).message}`));
        }

        await GitWorktree.remove(target.path, { force: false }, mainRepoPath);
        invalidateGitCache();
        console.log(`Removed worktree: ${target.path}`);
      }

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
