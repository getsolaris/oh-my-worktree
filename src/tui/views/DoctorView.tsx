import { createSignal, For, Show } from "solid-js";
import { useApp } from "../context/AppContext.tsx";
import { runAllChecks, runFixes, type DoctorCheckResult, type DoctorReport, type FixResult } from "../../core/doctor.ts";
import { useKeyboard, useTerminalDimensions } from "@opentui/solid";
import { theme } from "../themes.ts";

export function DoctorView() {
  const app = useApp();
  const dims = useTerminalDimensions();
  const [report, setReport] = createSignal<DoctorReport | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");
  const [fixing, setFixing] = createSignal(false);
  const [fixResults, setFixResults] = createSignal<FixResult[]>([]);

  const runChecks = async () => {
    setLoading(true);
    setError("");
    setFixResults([]);
    try {
      const result = await runAllChecks();
      setReport(result);
    } catch (err) {
      setError((err as Error).message);
    }
    setLoading(false);
  };

  const runAutoFix = async () => {
    if (report()?.healthy) return;
    setFixing(true);
    try {
      const results = await runFixes();
      setFixResults(results);
      const recheckResult = await runAllChecks();
      setReport(recheckResult);
    } catch (err) {
      setError((err as Error).message);
    }
    setFixing(false);
  };

  runChecks();

  useKeyboard((event: any) => {
    if (app.activeTab() !== "doctor") return;
    if (app.showCommandPalette()) return;
    const key = event.name;
    if (key === "r") runChecks();
    if (key === "f" && !loading() && !fixing() && !report()?.healthy) runAutoFix();
  });

  const w = () => dims().width;
  const h = () => dims().height;

  const statusIcon = (status: string) => {
    if (status === "pass") return "\u2713";
    if (status === "warn") return "\u26A0";
    return "\u2717";
  };

  const statusColor = (status: string) => {
    if (status === "pass") return theme.text.success;
    if (status === "warn") return theme.text.warning;
    return theme.text.error;
  };

  const checksLen = () => report()?.checks.length ?? 0;
  const fixLen = () => fixResults().length;

  return (
    <box x={0} y={0} width="100%" height="100%" backgroundColor={theme.bg.base} flexDirection="column">
      <box
        width="100%" height="100%"
        border={true} borderStyle="rounded"
        borderColor={report()?.healthy ? theme.text.success : report() ? theme.text.warning : theme.border.default}
        backgroundColor={theme.bg.surface}
        title=" Doctor "
        titleAlignment="left"
        flexDirection="column"
        paddingX={1}
        paddingY={1}
      >
        <Show when={loading()}>
          <text fg={theme.text.secondary}>Running health checks...</text>
        </Show>

        <Show when={fixing()}>
          <text fg={theme.text.accent}>Running auto-fix...</text>
        </Show>

        <Show when={!loading() && !fixing() && !!error()}>
          <text fg={theme.text.error}>Error: {error()}</text>
        </Show>

        <Show when={!loading() && !fixing() && !error() && !!report()}>
          <text fg={theme.text.accent}>Health Checks</text>
          <text fg={theme.border.subtle}>{"\u2500".repeat(Math.max(w() - 34, 10))}</text>

          <For each={report()!.checks}>
            {(check: DoctorCheckResult) => {
              return (
                <box width="100%" height={1} flexDirection="row">
                  <text fg={statusColor(check.status)}>
                    {statusIcon(check.status)}
                  </text>
                  <text x={2} y={0} fg={theme.text.primary}>
                    {check.name}:
                  </text>
                  <text x={check.name.length + 4} y={0} fg={theme.text.secondary}>
                    {check.message}
                  </text>
                </box>
              );
            }}
          </For>

          <text fg={theme.border.subtle}>{"\u2500".repeat(Math.max(w() - 34, 10))}</text>
          <text
            fg={report()!.healthy ? theme.text.success : theme.text.warning}
          >
            {report()!.healthy
              ? "\u2713 All checks passed"
              : `${report()!.checks.filter((c: DoctorCheckResult) => c.status === "fail").length} error(s), ${report()!.checks.filter((c: DoctorCheckResult) => c.status === "warn").length} warning(s) found`}
          </text>

          <Show when={fixLen() > 0}>
            <text fg={theme.text.accent}>Fix Results</text>
            <text fg={theme.border.subtle}>{"\u2500".repeat(Math.max(w() - 34, 10))}</text>
            <For each={fixResults()}>
              {(fix: FixResult) => {
                return (
                  <box width="100%" height={1} flexDirection="row">
                    <text fg={fix.success ? theme.text.success : theme.text.error}>
                      {fix.success ? "\u2713" : "\u2717"}
                    </text>
                    <text x={2} y={0} fg={theme.text.primary}>
                      {fix.action}
                    </text>
                    <Show when={!!fix.detail}>
                      <text x={fix.action.length + 3} y={0} fg={theme.text.secondary}>
                        ({fix.detail})
                      </text>
                    </Show>
                  </box>
                );
              }}
            </For>
          </Show>
        </Show>
      </box>

      <box width="100%" height={1} backgroundColor={theme.bg.base} flexDirection="row" gap={2}>
        <box flexDirection="row"><text fg={theme.text.secondary}>r</text><text fg={theme.text.primary}>:recheck</text></box>
        <Show when={!report()?.healthy}>
          <box flexDirection="row"><text fg={theme.text.secondary}>f</text><text fg={theme.text.primary}>:fix</text></box>
        </Show>
        <box flexDirection="row"><text fg={theme.text.secondary}>Esc</text><text fg={theme.text.primary}>:back</text></box>
      </box>
    </box>
  );
}
