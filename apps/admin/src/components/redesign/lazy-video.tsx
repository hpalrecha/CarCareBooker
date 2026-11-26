import { useEffect, useRef } from "react";

/**
 * A muted looping video that costs nothing until it is on screen.
 *
 * preload="none" plus a poster, then play() once at least 35% is visible and pause() when it
 * leaves, so it never downloads off-screen and never runs unseen. With prefers-reduced-motion
 * or Save-Data on, it stays a poster and the file is never fetched. Decorative: aria-hidden,
 * so the caller supplies any caption.
 */
export default function LazyVideo({
  src,
  poster,
  testId,
  className,
}: {
  src: string;
  poster: string;
  testId?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ((navigator as any).connection?.saveData) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      className={className}
      muted
      loop
      playsInline
      preload="none"
      poster={poster}
      aria-hidden="true"
      data-testid={testId}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
