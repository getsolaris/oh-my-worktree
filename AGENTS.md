# AGENTS.md — copse

## Project Overview

Git worktree manager with TUI (SolidJS + @opentui/solid) and CLI (yargs). Runtime: Bun. Language: TypeScript (strict mode).

## Build / Lint / Test Commands

```bash
bun run typecheck          # tsc --noEmit --skipLibCheck
bun test                   # Run all tests
bun test src/core/git      # Run tests in a single file (partial match)
bun test --filter "parses" # Run tests matching description
bun run build              # Bundle to dist/copse.js
bun run src/index.ts       # Launch TUI (dev mode)
bun run src/index.ts <cmd> # Run CLI command (dev mode)
```

No linter or formatter is configured. Follow existing code style exactly.

## Architecture

```
src/
  cli/
    index.ts          # CLI entrypoint — yargs setup, lazy imports commands
    cmd/*.ts           # One file per CLI command (CommandModule export default)
  tui/
    App.tsx            # TUI entrypoint — SolidJS + @opentui/solid
    context/*.tsx       # SolidJS context providers (AppContext, GitContext)
    views/*.tsx         # SolidJS components (WorktreeList, Sidebar, DoctorView, etc.)
    views/Spinner.tsx  # Animated braille dots loading spinner
    themes.ts          # Theme definitions
  core/
    git.ts             # GitWorktree static class — all git subprocess operations
    config.ts          # Config loading, validation, expansion (calls expandWorkspaces after validation)
    workspace.ts       # Parent-directory repo auto-discovery and workspace expansion
    hooks.ts           # Hook execution (postCreate, postRemove)
    doctor.ts          # Health check functions
    focus.ts           # Focus metadata (stored in git internals)
    files.ts           # File copy/symlink operations
    monorepo.ts        # Monorepo package detection (pnpm/turbo/nx/lerna/yarn)
    glob-hooks.ts      # Glob-matched per-package hooks
    session.ts         # Tmux session management (stored in git internals)
    types.ts           # Shared types and custom error classes
    test-helpers.ts    # Temp repo creation, cleanup for tests
```

## Code Style

### Imports

- Use `.ts` extensions for local imports: `import { GitWorktree } from "./git.ts";`
- Use `.tsx` extensions for JSX files: `import { useApp } from "../context/AppContext.tsx";`
- Group order: third-party → node builtins → local modules (no blank lines between groups)
- Use `import type` for type-only imports: `import type { CommandModule } from "yargs";`

### TypeScript

- `strict: true` — no `as any`, `@ts-ignore`, `@ts-expect-error`
- Exception: `(Bun as any)` is the established pattern for Bun API calls (shims.d.ts declares `Bun: any`)
- Prefer `interface` over `type` for object shapes
- Export types alongside their implementations in the same file
- Custom error classes extend `Error` with structured fields (see `types.ts`)

### Naming

- Files: kebab-case (`glob-hooks.ts`, `test-helpers.ts`)
- Functions/variables: camelCase (`expandTemplate`, `worktreePath`)
- Classes: PascalCase (`GitWorktree`, `HookError`)
- Types/Interfaces: PascalCase (`ResolvedRepoConfig`, `DoctorCheckResult`)
- Constants: camelCase or UPPER_SNAKE for module-level (`DEFAULT_CACHE_TTL`, `SIDEBAR_W`)

### Error Handling

- Custom error classes with structured data: `GitError(message, exitCode, stderr, command)`
- CLI commands catch errors and print user-friendly messages before `process.exit(1)`
- Core functions throw errors — CLI layer catches and formats
- Empty `catch {}` blocks are acceptable for optional/fallback operations
- Never swallow errors silently in core logic

### Async Patterns

- Use `Promise.all()` for independent parallel operations
- Sequential execution for dependent operations (hooks execute in order)
- git.ts has a TTL cache (`gitCache`) — invalidate with `invalidateGitCache()` after mutations

### CLI Commands

Every CLI command follows this pattern:
```typescript
import type { CommandModule } from "yargs";

const cmd: CommandModule = {
  command: "name <required> [optional]",
  aliases: ["alias"],
  describe: "One-line description",
  builder: (yargs) => yargs.option("flag", { type: "boolean", alias: "f", describe: "..." }),
  handler: async (argv) => {
    try {
      // implementation
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
```

Register new commands in `src/cli/index.ts` — add to the `Promise.all` import array and chain `.command()`.

### TUI Components

- SolidJS JSX with `@opentui/solid` primitives: `<box>`, `<text>`, `<scrollbox>`
- Use `createSignal` for local state, `createMemo` for derived values
- Use `createEffect(on(...))` for side effects with explicit dependencies
- Keyboard handlers via `useKeyboard()` — check `app.activeTab()` to scope key bindings
- Theme colors via `theme.text.primary`, `theme.bg.base`, etc. (never hardcode colors)
- Declare JSX intrinsic elements in App.tsx (`declare module "solid-js"`)

### Testing

- Test framework: `bun:test` — import `{ describe, it, expect, afterEach }` from `"bun:test"`
- Test files: co-located as `*.test.ts` in `src/core/`
- Use `test-helpers.ts`: `createTempRepo()`, `createTempDir()`, `cleanupTempDirs()`
- Always call `cleanupTempDirs()` in `afterEach`
- Call `invalidateGitCache()` in `afterEach` when testing git operations
- Structure: `describe("ClassName.method")` → `it("does specific thing")`

#### LLM testing protocol

- Every bug fix should add or update a real regression test file whenever the behavior can be covered in `bun:test`.
- After changing CLI behavior, run the command for real with `bun run src/index.ts <cmd>` and verify **stdout/stderr + exit code**, not just types.
- For exhaustive command-by-command manual QA across the full CLI surface, use the project skill at `.claude/skills/copse-cli-smoke-testing/` instead of expanding this file with long procedural steps.
- When CLI commands, options, or command docs change, update the local smoke-testing skill files (`.claude/skills/copse-cli-smoke-testing/SKILL.md` and `references/command-groups.md`) alongside `src/core/skill-templates.ts` to avoid drift.
- Run CLI/manual QA in an isolated temp environment when config or repo state matters:
  - use a temp git repo instead of the project repo
  - set `HOME` / `XDG_CONFIG_HOME` to temp directories when testing config loading
  - use a unique tmux session prefix when testing `session` commands
- After changing TUI behavior, at minimum launch the TUI with `bun run src/index.ts` to catch startup/runtime regressions. If the change affects keyboard/state logic, prefer extracting a small testable helper or adding a regression test for the underlying state transition when full interaction automation is impractical.
- Default verification order for non-trivial changes:
  1. targeted `bun test <file>` for touched regression tests
  2. `bun run typecheck`
  3. `bun test`
  4. `bun run build`
  5. manual command execution for changed CLI flows

### Git Operations

All git commands go through `GitWorktree.run()` (private static). This:
- Spawns `Bun.spawn(["git", ...args])` with `LC_ALL=C` for deterministic output
- Captures stdout/stderr via `new Response(proc.stdout).text()`
- Throws `GitError` on non-zero exit code
- Results are cached with 3-second TTL — call `invalidateGitCache()` after write operations

### Performance

- git subprocess cache: 3s TTL in `gitCache` (Map). Always invalidate after mutations (add/remove/lock).
- TUI detail view: 150ms debounce on selection change to prevent subprocess spam during j/k navigation.
- Doctor checks: `runAllChecks()` fetches worktrees once and passes the array to all check functions.

## Subdirectory Guides

- `src/core/AGENTS.md` — Module API surface, orchestration layer (single source of truth for worktree side effects), git cache invalidation rules, error contracts, testing patterns
- `src/tui/AGENTS.md` — Component tree, state architecture, keyboard scoping, theme integration, performance rules, orchestration delegation rule

## Key Constraints

- Runtime is Bun, not Node — use `Bun.spawn`, `Bun.Glob`, `Bun.env`
- No standalone binary — distributed as npm package (`bun install -g`)
- TUI uses SolidJS JSX transform via `@opentui/solid/preload` — loaded by `bunfig.toml` (dev/tests from project root) AND by explicit `import "@opentui/solid/preload"` in `src/index.ts` (required for Homebrew, which runs `bun run src/index.ts` from the user's cwd). The bundled `dist/copse.js` has JSX transformed at build time and strips the runtime preload via a plugin in `scripts/build.ts`.
- Config file: `~/.config/copse/config.json` (XDG-compliant)
- Focus metadata: stored in git internals (`<gitdir>/copse-focus`), not in worktree root
- Session metadata: stored in git internals (`<gitdir>/copse-session`), not in worktree root

## Modification Guidelines (CLI/TUI Parity)

The most painful class of bugs in this project has been **silent feature drift** between the CLI and TUI: a new behavior gets wired into `copse add` but not into the TUI's Create view, or a bug is fixed in CLI `remove` while the TUI and `BulkActions` keep the stale code. The rules below exist to prevent that.

### Rule 1 — Worktree side effects live in `src/core/orchestration/`, not in callers

Any logic that mutates a worktree on create, remove, archive, import, or rename — file copy, symlinks, shared deps, hook execution, focus write, session open/kill, PR metadata, activity log — MUST live in the relevant `orchestration/*.ts` flow. CLI commands and TUI views are thin adapters that only:

1. Collect user input / CLI args
2. Pick a `StepProgressHandler` implementation (console output vs. SolidJS progress state)
3. Call the flow

**DO NOT** inline hook execution, session management, or activity logging in `src/cli/cmd/*.ts` or `src/tui/views/*.tsx`. That code path will drift.

### Rule 2 — New config-driven side effects go in the flow AND its step-plan

When you add a new side effect that should fire based on config (e.g., a new hook, a new metadata write, a new cleanup step):

1. Add a step ID to the relevant `*_STEP_IDS` constant in `src/core/orchestration/types.ts`.
2. Add it to the planner (so `onStepPlan` shows it when enabled, hides it when disabled).
3. Add the execution block inside the flow, wrapped with `handler.onStepStart` / `onStepDone` / `onStepError`.
4. Update `orchestration.test.ts` to assert the step is planned AND executed for the relevant config.

The step-plan is the public contract; UI callers rely on it to render progress.

### Rule 3 — New CLI flag that changes worktree flow goes through orchestration opts

Adding `--foo` to `copse add`? The flag's value must flow into `CreateWorktreeOpts` (and friends), not stay inside `src/cli/cmd/add.ts`. That way:

- Tests can exercise `--foo` via the orchestration function directly
- The TUI can expose the same option via an input/toggle later without reimplementing the logic
- The parity test in `orchestration.test.ts` catches the case "same config produces same plan regardless of caller"

### Rule 4 — When fixing a bug in CLI, check the TUI (and vice versa)

Before shipping a fix, grep for the symptom and the fix surface:

```bash
# Is this call site duplicated in TUI/CLI?
rg -t ts "closeSession|executeHooks|matchHooksForFocus|logActivity" src/cli src/tui
```

If yes, the fix belongs in `src/core/orchestration/` and both callers get it for free. Don't patch only one.

### Rule 5 — When composing flows, use the plan/execute split pattern

`removeWorktreeFlow` is split into `planRemoveWorktreeSteps()` + `executeRemoveWorktreeFlow()` + `removeWorktreeFlow()` (public entry). When a new flow (e.g., `archiveWorktreeFlow`) needs to reuse it:

1. Call `planRemoveWorktreeSteps()` to get the plan — but do NOT emit it yet.
2. Build a combined plan (archive's own steps + remove's steps).
3. Emit the combined plan once via `handler.onStepPlan`.
4. Execute archive's own steps.
5. Call `executeRemoveWorktreeFlow(plan, opts, handlerWithoutOnStepPlan)` — it does NOT re-emit.

This keeps the UI's step list stable across composed flows. When you add a new composable flow, expose `planXxxSteps()` + `executeXxxFlow()` + `xxxFlow()` the same way.

### Rule 6 — Every new flow or non-trivial flow change ships with a parity test

`src/core/orchestration/orchestration.test.ts` must have at least:

- A "minimal" test — flow runs with the empty config
- A "full" test — flow runs with every feature enabled, each step plans + executes
- An error/rollback test where relevant
- A parity test when a second caller (CLI and TUI) exists — same config produces same step plan regardless of entry point

Treat these tests as a **contract**: they're the line of defense against silent drift.

### Rule 7 — `core/*` never imports from `src/cli/*`

The `src/core/` tree is UI-agnostic. If an orchestration flow needs something that currently lives in `src/cli/utils.ts` (e.g., `resolveMainRepo`), promote the helper into `src/core/` or take the value as an input. Circular `core → cli` imports will fail subtly at runtime when imported from the TUI.

### Rule 8 — Empty catch blocks require a codebase-matching form

Core modules throw; CLI catches and formats. For best-effort cleanup (rollback, activity log), use `.catch(() => {})` inline rather than `try { ... } catch {}` blocks with comments. See existing examples in `create-worktree.ts`.

### Rule 9 — When changing orchestration output, update all `onStepDone` / `onStepError` handler sites

The CLI's `console.log` mapping and the TUI's progress UI both switch on step IDs. When you add / rename / remove a step ID, update the switches in `src/cli/cmd/*.ts` and `src/tui/views/*.tsx` to match, or they'll go silent without warning.

## Feature Completion Checklist

When adding or modifying a feature, **all** of the following must be updated before the work is considered complete:

1. **Implementation** — core module in `src/core/`, CLI command in `src/cli/cmd/`
2. **Tests** — co-located `*.test.ts` in `src/core/`
3. **Config** — update `config.ts` (types, validation, valid keys), `schema.json`
4. **CLI index** — register new commands in `src/cli/index.ts`
5. **README.md** — features list, quick start, CLI commands table, command docs, config docs
6. **README.ko.md** — mirror all README.md changes in Korean
7. **examples/** — add or update `examples/<command>.md`
8. **AGENTS.md** — update architecture table, module map, key constraints if applicable
9. **src/core/AGENTS.md** — update module map with new core modules
10. **Skill references** — update `src/core/skill-templates.ts` when CLI commands change (add/remove/rename commands, change options, update config keys). This regenerates the AI agent skill files (`SKILL.md` + `references/*.md`) installed via `copse init --skill`. If the local project smoke-testing skill is affected, update `.claude/skills/copse-cli-smoke-testing/SKILL.md` and `references/command-groups.md` too.
11. **Typecheck + Tests** — `bun run typecheck` and `bun test` must pass
12. **CLI Smoke Test** — after non-trivial CLI changes, run the smoke-testing skill (`.claude/skills/copse-cli-smoke-testing/`) to verify all affected commands and their flags work end-to-end in isolated temp environments. This is the final gate before considering CLI work complete.
