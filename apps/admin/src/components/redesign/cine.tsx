import type { CSSProperties, ElementType, ReactNode } from "react";

/**
 * A block that takes part in the page's cinematic scroll motion (hooks/use-cinematic.ts).
 * It only sets data attributes; the motion itself is CSS driven by --cp, which the page's
 * useCinematic() keeps updated. Use it anywhere in a page that calls that hook:
 *
 *   <Cine mode="rise">…</Cine>                 fade up as it scrolls into view
 *   <Cine mode="rise" index={2}>…</Cine>       the same, a little later than its siblings
 *   <Cine mode="frame">{picture}</Cine>        unmask a picture as it arrives
 *   <Cine as="section" mode="zoom">…</Cine>    slow push-in on the hero as it scrolls away
 */
export default function Cine({
  as: Tag = "div",
  mode = "rise",
  index = 0,
  className,
  children,
}: {
  as?: ElementType;
  mode?: "rise" | "frame" | "zoom";
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag data-cine={mode} className={className} style={{ "--i": index } as CSSProperties}>
      {children}
    </Tag>
  );
}
