import { createSignal, createEffect, on, For, Show } from "solid-js";
import { useApp } from "../context/AppContext.tsx";
import { useGit } from "../context/GitContext.tsx";
import { GitWorktree } from "../../core/git.ts";
import { loadConfig, getRepoConfig, expandTemplate } from "../../core/config.ts";
import { invalidateGitCache } from "../../core/git.ts";
import { copyFiles, linkFiles } from "../../core/files.ts";
import { executeHooks } from "../../core/hooks.ts";
import { writeFocus } from "../../core/focus.ts";
import { validateFocusPaths } from "../../core/monorepo.ts";
import { matchHooksForFocus, executeGlobHooks } from "../../core/glob-hooks.ts";
import { useKeyboard, useTerminalDimensions } from "@opentui/solid";
import { basename, resolve } from "node:path";
import { toast } from "@opentui-ui/toast/solid";
import { theme } from "../themes.ts";

type StepStatus = "pending" | "running" | "done" | "error";
interface ProgressStep { label: string; status: StepStatus; message?: string; }

type Step = "input" | "preview" | "creating" | "done" | "error";

export function WorktreeCreate() {
  const app = useApp();
  const git = useGit();
  const dims = useTerminalDimensions();
  const [step, setStep] = createSignal<Step>("input");
  const [branchInput, setBranchInput] = createSignal("");
  const [focusInput, setFocusInput] = createSignal("");
  const [focusField, setFocusField] = createSignal<"branch" | "focus">("branch");
  const [resolvedPath, setResolvedPath] = createSignal("");
  const [progressSteps, setProgressSteps] = createSignal<ProgressStep[]>([]);
  const [statusMsg, setStatusMsg] = createSignal("");
  const [branches, setBranches] = createSignal<{ name: string; isRemote: boolean; lastCommitDate: string }[]>([]);
  const [branchPickerIdx, setBranchPickerIdx] = createSignal(-1);
  const [showPicker, setShowPicker] = createSignal(false);

  const filteredBranches = () => {
    const query = branchInput().toLowerCase();
    if (!query) return branches().slice(0, 10);
    return branches()
      .filter((b) => b.name.toLowerCase().includes(query))
      .slice(0, 10);
  };

  createEffect(on(() => activeRepoPath(), async () => {
    try {
      const repoPath = activeRepoPath();
      const branchList = await GitWorktree.listBranches(repoPath);
      setBranches(branchList);
    } catch {
      setBranches([]);
    }
  }));

  createEffect(on(branchInput, () => {
    setBranchPickerIdx(-1);
    setShowPicker(branchInput().length > 0 && filteredBranches().length > 0);
  }));

  const updateStep = (index: number, updates: Partial<ProgressStep>) => {
    setProgressSteps(steps => steps.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const activeRepoPath = () => {
    const wts = git.worktrees() ?? [];
    const selected = wts[app.selectedWorktreeIndex()];
    return selected?.repoPath ?? app.repoPath();
  };

  const activeRepoName = () => {
    const wts = git.worktrees() ?? [];
    const selected = wts[app.selectedWorktreeIndex()];
    return selected?.repoName ?? app.repoPath().split("/").pop() ?? "";
  };

  const resolveTargetPath = () => {
    const branch = branchInput();
    if (!branch) return "";
    const repoPath = activeRepoPath();
    const config = loadConfig();
    const repoConfig = getRepoConfig(config, repoPath);
    const safeBranch = branch.replace(/\//g, "-");
    const repoName = basename(repoPath);
    return resolve(expandTemplate(repoConfig.worktreeDir, { repo: repoName, branch: safeBranch }));
  };

  useKeyboard(async (event: any) => {
    const key = event.name;

    if (key === "escape") {
      if (step() === "preview") {
        setStep("input");
        return;
      }
      app.setActiveTab("list");
      setBranchInput("");
      setFocusInput("");
      setFocusField("branch");
      setStep("input");
      return;
    }

    if (step() === "input") {
      if (key === "tab") {
        if (showPicker() && focusField() === "branch") {
          setShowPicker(false);
          setBranchPickerIdx(-1);
        }
        setFocusField(f => f === "branch" ? "focus" : "branch");
        return;
      }
      if (focusField() === "branch" && showPicker() && filteredBranches().length > 0) {
        if (key === "down") {
          setBranchPickerIdx((i) => Math.min(i + 1, filteredBranches().length - 1));
          return;
        }
        if (key === "up") {
          setBranchPickerIdx((i) => Math.max(i - 1, -1));
          return;
        }
      }
      if (key === "return" || key === "enter") {
        if (focusField() === "branch" && branchPickerIdx() >= 0) {
          const selected = filteredBranches()[branchPickerIdx()];
          if (selected) {
            setBranchInput(selected.name);
            setShowPicker(false);
            setBranchPickerIdx(-1);
            return;
          }
        }
        if (!branchInput()) return;
        setShowPicker(false);
        setResolvedPath(resolveTargetPath());
        setStep("preview");
        return;
      }
      if (key === "backspace") {
        if (focusField() === "branch") {
          setBranchInput((s) => s.slice(0, -1));
        } else {
          setFocusInput((s) => s.slice(0, -1));
        }
        return;
      }
      if (event.sequence === "\x15" || (event.ctrl && key === "u")) {
        if (focusField() === "branch") setBranchInput("");
        else setFocusInput("");
        return;
      }
      if (event.sequence === "\x17" || (event.ctrl && key === "w")) {
        if (focusField() === "branch") setBranchInput((s) => s.replace(/\S+\s*$/, ""));
        else setFocusInput((s) => s.replace(/\S+\s*$/, ""));
        return;
      }
      if (event.sequence && event.sequence.length === 1 && event.sequence.charCodeAt(0) >= 32) {
        if (focusField() === "branch") setBranchInput((s) => s + event.sequence);
        else setFocusInput((s) => s + event.sequence);
      }
    }

    if (step() === "preview") {
      if (key === "return" || key === "enter") {
        setStep("creating");
        const branch = branchInput();
        const wtPath = resolvedPath();
        const repoPath = activeRepoPath();
        const repoName = basename(repoPath);

        try {
          const config = loadConfig();
          const repoConfig = getRepoConfig(config, repoPath);

          const steps: ProgressStep[] = [
            { label: "Creating worktree", status: "pending" },
          ];
          if (repoConfig.autoUpstream) {
            steps.push({ label: "Setting upstream", status: "pending" });
          }
          if (repoConfig.copyFiles.length > 0) {
            steps.push({ label: "Copying files", status: "pending" });
          }
          if (repoConfig.linkFiles.length > 0) {
            steps.push({ label: "Creating symlinks", status: "pending" });
          }
          if (repoConfig.postCreate.length > 0) {
            steps.push({ label: "Running hooks", status: "pending" });
          }

          const rawFocus = focusInput();
          let focusPaths: string[] = [];
          if (rawFocus) {
            focusPaths = rawFocus.split(/[,\s]+/).map(f => f.trim()).filter(Boolean);
          }

          if (focusPaths.length > 0) {
            steps.push({ label: "Setting focus", status: "pending" });
          }
          if (focusPaths.length > 0 && repoConfig.monorepo?.hooks && repoConfig.monorepo.hooks.length > 0) {
            const preMatches = matchHooksForFocus(repoConfig.monorepo.hooks, focusPaths);
            if (preMatches.length > 0) {
              steps.push({ label: "Running monorepo hooks", status: "pending" });
            }
          }

          setProgressSteps(steps);

          let stepIdx = 0;

          // Creating worktree
          updateStep(stepIdx, { status: "running" });
          await GitWorktree.add(branch, wtPath, { createBranch: true }, repoPath);
          updateStep(stepIdx, { status: "done" });
          stepIdx++;

          // Setting upstream
          if (repoConfig.autoUpstream) {
            updateStep(stepIdx, { status: "running" });
            try {
              const remote = await GitWorktree.getDefaultRemote(repoPath);
              const exists = await GitWorktree.remoteBranchExists(branch, remote, repoPath);
              if (exists) {
                await GitWorktree.setUpstream(branch, remote, repoPath);
                updateStep(stepIdx, { status: "done", message: `→ ${remote}/${branch}` });
              } else {
                updateStep(stepIdx, { status: "done", message: "no remote branch" });
              }
            } catch (err) {
              updateStep(stepIdx, { status: "error", message: (err as Error).message });
            }
            stepIdx++;
          }

          // Copying files
          if (repoConfig.copyFiles.length > 0) {
            updateStep(stepIdx, { status: "running" });
            copyFiles(repoPath, wtPath, repoConfig.copyFiles);
            updateStep(stepIdx, { status: "done" });
            stepIdx++;
          }

          // Creating symlinks
          if (repoConfig.linkFiles.length > 0) {
            updateStep(stepIdx, { status: "running" });
            linkFiles(repoPath, wtPath, repoConfig.linkFiles);
            updateStep(stepIdx, { status: "done" });
            stepIdx++;
          }

          const hookEnv: Record<string, string> = {
            OMW_BRANCH: branch,
            OMW_WORKTREE_PATH: wtPath,
            OMW_REPO_PATH: repoPath,
          };

          // Running hooks
          if (repoConfig.postCreate.length > 0) {
            updateStep(stepIdx, { status: "running" });
            await executeHooks(repoConfig.postCreate, {
              cwd: wtPath,
              env: hookEnv,
              onOutput: (line) => updateStep(stepIdx, { message: line }),
            });
            updateStep(stepIdx, { status: "done" });
            stepIdx++;
          }

          // Setting focus
          if (focusPaths.length > 0) {
            updateStep(stepIdx, { status: "running" });
            const { valid } = validateFocusPaths(wtPath, focusPaths);
            focusPaths = valid;
            if (valid.length > 0) {
              writeFocus(wtPath, valid);
              hookEnv.OMW_FOCUS_PATHS = valid.join(",");
            }
            updateStep(stepIdx, { status: "done" });
            stepIdx++;
          }

          // Running monorepo hooks
          if (focusPaths.length > 0 && repoConfig.monorepo?.hooks && repoConfig.monorepo.hooks.length > 0) {
            updateStep(stepIdx, { status: "running" });
            const matches = matchHooksForFocus(repoConfig.monorepo.hooks, focusPaths);
            if (matches.length > 0) {
              await executeGlobHooks(matches, "postCreate", {
                cwd: wtPath,
                env: hookEnv,
                repo: repoName,
                branch,
                focusPaths,
                mainRepoPath: repoPath,
                onOutput: (line) => updateStep(stepIdx, { message: line }),
              });
            }
            updateStep(stepIdx, { status: "done" });
            stepIdx++;
          }

          setStatusMsg("Worktree created successfully!");
          setStep("done");
          toast.success(`Worktree created: ${branch}`);
          git.refetch();
          setTimeout(() => {
            app.setActiveTab("list");
            setBranchInput("");
            setFocusInput("");
            setFocusField("branch");
            setStep("input");
          }, 1500);
        } catch (err) {
          toast.error((err as Error).message);
          const currentSteps = progressSteps();
          const runningIdx = currentSteps.findIndex(s => s.status === "running");
          if (runningIdx >= 0) {
            updateStep(runningIdx, { status: "error", message: (err as Error).message });
          }
          setStatusMsg(`${(err as Error).message}`);
          setStep("error");
        }
        return;
      }
    }

    if (step() === "error") {
      if (key === "escape" || key === "return" || key === "enter") {
        setStep("input");
        setStatusMsg("");
      }
    }
  });

  const w = () => dims().width;
  const h = () => dims().height;
  const inputFieldW = () => Math.max(w() - 10, 20);

  return (
    <box width="100%" height="100%" backgroundColor={theme.bg.base} flexDirection="column" gap={1}>
      <box
        width="100%" height="100%"
        flexDirection="column"
        border={true} borderStyle="rounded"
        borderColor={step() === "done" ? theme.text.success : step() === "error" ? theme.text.error : theme.border.default}
        backgroundColor={theme.bg.surface}
        title=" Create Worktree "
        titleAlignment="left"
        paddingX={1}
        paddingY={1}
        gap={1}
      >
        <Show when={step() === "input"}>
          <box width="100%" height={1} flexDirection="row">
            <text fg={theme.text.accent}>{"\u25B6 New Worktree"}</text>
            <text fg={theme.text.secondary}>{" in "}{activeRepoName()}</text>
          </box>

          <text fg={theme.border.subtle}>{"\u2500".repeat(Math.max(w() - 10, 10))}</text>

          <text fg={theme.text.secondary}>Branch name</text>

          <box width={inputFieldW()} height={1}
               backgroundColor={focusField() === "branch" ? theme.bg.elevated : theme.bg.surface}>
            <text x={1} y={0} fg={theme.text.primary}>
              {branchInput()}
            </text>
            <Show when={focusField() === "branch"}>
              <text x={branchInput().length + 1} y={0} fg={theme.text.accent}>
                {"\u2588"}
              </text>
            </Show>
          </box>

          <Show when={showPicker() && focusField() === "branch" && filteredBranches().length > 0}>
            <For each={filteredBranches()}>
              {(b, idx) => (
                <box height={1}>
                  <text x={1} y={0}
                    fg={idx() === branchPickerIdx() ? theme.text.accent : theme.text.secondary}
                    backgroundColor={idx() === branchPickerIdx() ? theme.select.focusedBg : undefined}>
                    {idx() === branchPickerIdx() ? "\u25B8 " : "  "}
                    {b.name}
                  </text>
                  <text x={Math.max(1 + b.name.length + 4, 27)} y={0} fg={theme.border.subtle}>
                    {b.isRemote ? "(remote) " : ""}{b.lastCommitDate}
                  </text>
                </box>
              )}
            </For>
          </Show>

          <text fg={theme.border.subtle}>{"Tab to switch fields \u00B7 \u2191\u2193 to select branch"}</text>

          <box width="100%" height={1} flexDirection="row">
            <text fg={theme.text.secondary}>{"Focus "}</text>
            <text fg={theme.border.subtle}>{"(optional)"}</text>
          </box>

          <box width={inputFieldW()} height={1}
               backgroundColor={focusField() === "focus" ? theme.bg.elevated : theme.bg.surface}>
            <text x={1} y={0} fg={theme.text.primary}>
              {focusInput()}
            </text>
            <Show when={focusField() === "focus"}>
              <text x={focusInput().length + 1} y={0} fg={theme.text.accent}>
                {"\u2588"}
              </text>
            </Show>
          </box>

          <text fg={theme.border.subtle}>{"comma-separated paths, e.g. apps/web,apps/api"}</text>

          <Show when={branchInput().length > 0}>
            <text fg={theme.text.secondary}>Target path</text>
            <text fg={theme.text.primary}>{resolveTargetPath()}</text>
          </Show>

          <text fg={theme.text.secondary}>Type a branch name, e.g. feature/my-feature</text>
        </Show>

        <Show when={step() === "preview"}>
          <text fg={theme.text.accent}>{"\u25B6 Confirm Worktree"}</text>
          <text fg={theme.border.subtle}>{"\u2500".repeat(Math.max(w() - 10, 10))}</text>

          <box height={1} flexDirection="row">
            <box width={14} height={1}>
              <text fg={theme.text.secondary}>Branch</text>
            </box>
            <text fg={theme.text.accent}>{branchInput()}</text>
          </box>

          <box height={1} flexDirection="row">
            <box width={14} height={1}>
              <text fg={theme.text.secondary}>Path</text>
            </box>
            <text fg={theme.text.primary}>{resolvedPath()}</text>
          </box>

          <Show when={focusInput().length > 0}>
            <box height={1} flexDirection="row">
              <box width={14} height={1}>
                <text fg={theme.text.secondary}>Focus</text>
              </box>
              <text fg={theme.text.accent}>{focusInput()}</text>
            </box>
          </Show>

          <text fg={theme.text.success}>{"\u2713 Ready to create. Press Enter to confirm."}</text>
        </Show>

        <Show when={step() === "creating"}>
          <text fg={theme.text.accent}>{"\u25B6 Creating Worktree"}</text>
          <text fg={theme.border.subtle}>{"\u2500".repeat(Math.max(w() - 10, 10))}</text>

          <For each={progressSteps()}>
            {(step) => (
              <box height={1}>
                <text fg={
                  step.status === "done" ? theme.text.success :
                  step.status === "running" ? theme.text.accent :
                  step.status === "error" ? theme.text.error :
                  theme.text.secondary
                }>
                  {step.status === "done" ? "\u2713" :
                   step.status === "running" ? "\u27F3" :
                   step.status === "error" ? "\u2717" :
                   "\u25CB"}{" "}{step.label}
                </text>
                <Show when={step.message}>
                  <text x={step.label.length + 4} y={0} fg={theme.text.secondary}>
                    {step.message}
                  </text>
                </Show>
              </box>
            )}
          </For>
        </Show>

        <Show when={step() === "done"}>
          <text fg={theme.text.success}>{"\u25B6 Worktree Created"}</text>
          <text fg={theme.border.subtle}>{"\u2500".repeat(Math.max(w() - 10, 10))}</text>

          <box height={1} flexDirection="row">
            <box width={14} height={1}>
              <text fg={theme.text.secondary}>Branch</text>
            </box>
            <text fg={theme.text.accent}>{branchInput()}</text>
          </box>

          <box height={1} flexDirection="row">
            <box width={14} height={1}>
              <text fg={theme.text.secondary}>Path</text>
            </box>
            <text fg={theme.text.primary}>{resolvedPath()}</text>
          </box>

          <Show when={focusInput().length > 0}>
            <box height={1} flexDirection="row">
              <box width={14} height={1}>
                <text fg={theme.text.secondary}>Focus</text>
              </box>
              <text fg={theme.text.accent}>{focusInput()}</text>
            </box>
          </Show>

          <text fg={theme.text.success}>{"\u2713 "}{statusMsg()}</text>
        </Show>

        <Show when={step() === "error"}>
          <text fg={theme.text.error}>{"\u25B6 Error"}</text>
          <text fg={theme.border.subtle}>{"\u2500".repeat(Math.max(w() - 10, 10))}</text>

          <text fg={theme.text.error}>{"\u2717 Failed"}</text>

          <box width={inputFieldW()} height={1} backgroundColor={theme.bg.elevated}>
            <text x={1} y={0} fg={theme.text.primary}>
              {statusMsg().slice(0, Math.max(inputFieldW() - 3, 10))}
            </text>
          </box>

          <text fg={theme.text.secondary}>Press Enter or Escape to try again</text>
        </Show>
      </box>

      <box width="100%" height={1} backgroundColor={theme.bg.base} flexDirection="row" gap={2}>
        <Show when={step() === "input"}>
          <box flexDirection="row"><text fg={theme.text.secondary}>Enter</text><text fg={theme.text.primary}>:confirm</text></box>
          <box flexDirection="row"><text fg={theme.text.secondary}>Esc</text><text fg={theme.text.primary}>:cancel</text></box>
          <box flexDirection="row"><text fg={theme.text.secondary}>Tab</text><text fg={theme.text.primary}>:switch field</text></box>
        </Show>
        <Show when={step() === "preview"}>
          <box flexDirection="row"><text fg={theme.text.success}>Enter</text><text fg={theme.text.primary}>:create</text></box>
          <box flexDirection="row"><text fg={theme.text.secondary}>Esc</text><text fg={theme.text.primary}>:back</text></box>
        </Show>
        <Show when={step() === "creating"}>
          <text fg={theme.text.warning}>Creating worktree...</text>
        </Show>
        <Show when={step() === "done"}>
          <text fg={theme.text.success}>{"\u2713"} Done — returning to list</text>
        </Show>
        <Show when={step() === "error"}>
          <box flexDirection="row"><text fg={theme.text.secondary}>Enter</text><text fg={theme.text.primary}>:retry</text></box>
          <box flexDirection="row"><text fg={theme.text.secondary}>Esc</text><text fg={theme.text.primary}>:back</text></box>
        </Show>
      </box>
    </box>
  );
}
