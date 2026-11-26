const TONES = { white: "bg-white", ground: "bg-ground", ink: "bg-ink text-white" } as const;

export function Section({ id, labelledBy, tone = "white", children }: { id?: string; labelledBy: string; tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`${TONES[tone]} py-16 md:py-20`}>
      <div className="wrap">{children}</div>
    </section>
  );
}
