import type { CommandModule } from "yargs";
import { GitWorktree } from "../../core/git.ts";
import { GitError } from "../../core/types.ts";

const cmd: CommandModule = {
  command: "diff <ref1> [ref2]",
  describe: "Show diff between two worktrees or branches",
  builder: (yargs) =>
    yargs
      .positional("ref1", {
        type: "string",
        describe: "First worktree branch or ref",
        demandOption: true,
      })
      .positional("ref2", {
        type: "string",
        describe: "Second worktree branch or ref (default: current HEAD)",
      })
      .option("stat", {
        type: "boolean",
        alias: "s",
        describe: "Show diffstat summary only",
      })
      .option("name-only", {
        type: "boolean",
        alias: "n",
        describe: "Show only names of changed files",
      }),
  handler: async (argv) => {
    const ref1 = argv.ref1 as string;
    const ref2 = (argv.ref2 as string | undefined) ?? "HEAD";
    const stat = !!argv.stat;
    const nameOnly = !!(argv as Record<string, unknown>)["name-only"];

    try {
      const mainRepoPath = await GitWorktree.getMainRepoPath().catch(() => process.cwd());
      const worktrees = await GitWorktree.list(mainRepoPath);

      const resolveRef = (ref: string): string => {
        const wt = worktrees.find((w) => w.branch === ref);
        return wt?.branch ?? ref;
      };

      const resolvedRef1 = resolveRef(ref1);
      const resolvedRef2 = resolveRef(ref2);

      const output = await GitWorktree.diffBetween(
        resolvedRef1,
        resolvedRef2,
        { stat, nameOnly },
        mainRepoPath,
      );

      if (!output) {
        console.log(`No differences between ${ref1} and ${ref2 === "HEAD" ? "current HEAD" : ref2}`);
      } else {
        console.log(output);
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
