import { Show, type JSX, type ParentProps, createSignal, onMount } from "solid-js";
import { Portal as RawPortal, useRenderer, useTerminalDimensions, useTimeline } from "@opentui/solid";
import { theme } from "../themes.ts";

// Type bridge: Portal returns BaseRenderable (valid for OpenTUI renderer) but TS JSX expects Node
const Portal = RawPortal as unknown as (props: { mount: unknown; children?: JSX.Element }) => JSX.Element;

interface PopupShellProps {
  width: number;
  height: number;
  title: string;
  borderColor?: string;
  backgroundColor?: string;
  backdrop?: boolean;
  backdropColor?: string;
  gap?: number;
  footer?: JSX.Element;
}

export function PopupShell(props: ParentProps<PopupShellProps>) {
  const renderer = useRenderer();
  const dims = useTerminalDimensions();
  const [animatedHeight, setAnimatedHeight] = createSignal(0);
  const [animating, setAnimating] = createSignal(true);

  const timeline = useTimeline({ duration: 200 });

  const dialogX = () => Math.max(0, Math.floor((dims().width - props.width) / 2));
  const dialogY = () => Math.max(0, Math.floor((dims().height - props.height) / 2));

  onMount(() => {
    timeline.add(
      { h: 0 },
      {
        h: props.height,
        duration: 200,
        ease: "outQuad",
        onUpdate: (anim) => {
          setAnimatedHeight(Math.round(anim.targets[0].h));
        },
        onComplete: () => {
          setAnimatedHeight(props.height);
          setAnimating(false);
        },
      },
    );
  });

  const shell = () => (
    <box
      x={dialogX()}
      y={dialogY()}
      width={props.width}
      height={animatedHeight()}
      border={true}
      borderStyle="rounded"
      borderColor={props.borderColor ?? theme.border.active}
      backgroundColor={props.backgroundColor ?? theme.bg.surface}
      flexDirection="column"
      paddingX={1}
      paddingY={1}
      gap={props.gap ?? 0}
      title={props.title}
      titleAlignment="left"
      position="absolute"
      zIndex={11}
    >
      <Show when={!animating()}>
        {props.children}
        <Show when={props.footer}>{props.footer}</Show>
      </Show>
    </box>
  );

  return (
    <Portal mount={renderer.root}>
      <Show
        when={props.backdrop}
        fallback={shell()}
      >
        <box
          x={0}
          y={0}
          width={dims().width}
          height={dims().height}
          backgroundColor={props.backdropColor ?? theme.bg.overlay}
          position="absolute"
          zIndex={10}
        >
          {shell()}
        </box>
      </Show>
    </Portal>
  );
}
