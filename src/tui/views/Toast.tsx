import { For } from "solid-js";
import { useTerminalDimensions } from "@opentui/solid";
import { useToast } from "../context/ToastContext.tsx";
import { theme } from "../themes.ts";

function toastIcon(type: "info" | "success" | "warning" | "error") {
  if (type === "success") return "✓";
  if (type === "warning") return "⚠";
  if (type === "error") return "✗";
  return "ℹ";
}

function toastColor(type: "info" | "success" | "warning" | "error") {
  if (type === "success") return theme.text.success;
  if (type === "warning") return theme.text.warning;
  if (type === "error") return theme.text.error;
  return theme.text.primary;
}

export function Toast() {
  const dims = useTerminalDimensions();

  const width = () => Math.min(60, Math.max(24, dims().width - 4));
  const x = () => Math.max(0, dims().width - width() - 1);

  return (
    <box x={x()} y={1} width={width()} height={5} flexDirection="column">
      <For each={useToast().toasts()}>
        {(toast, index) => (
          <box x={0} y={index()} width={width()} height={1} backgroundColor={theme.bg.elevated}>
            <text x={1} y={0} fg={toastColor(toast.type)}>{`${toastIcon(toast.type)} ${toast.message}`}</text>
          </box>
        )}
      </For>
    </box>
  );
}
