import type { CommandModule } from "yargs";
import {
  writeSkillFile,
  getSkillFilePath,
  SUPPORTED_PLATFORMS,
} from "../../core/skill-templates.ts";
import type { SkillPlatform } from "../../core/skill-templates.ts";

const cmd: CommandModule = {
  command: "init",
  describe: "Initialize omw integrations",
  builder: (yargs) =>
    yargs.option("skill", {
      type: "string",
      alias: "s",
      describe: `Install AI agent skill (${SUPPORTED_PLATFORMS.join(", ")})`,
      choices: SUPPORTED_PLATFORMS,
    }),
  handler: async (argv) => {
    const platform = argv.skill as SkillPlatform | undefined;

    if (!platform) {
      console.error(
        "Please specify an option.\n\nExample:\n  omw init --skill claude-code\n  omw init --skill codex\n\nSupported platforms: " +
          SUPPORTED_PLATFORMS.join(", "),
      );
      process.exit(1);
    }

    try {
      const result = writeSkillFile(platform);
      const icon = result.action === "created" ? "✓" : "✓";

      console.log(`${icon} ${result.action === "created" ? "Installed" : "Updated"} → ${result.filePath}`);
      process.exit(0);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  },
};

export default cmd;
