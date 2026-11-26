import { ButtonLink } from "./button-link";

export function CtaBand({ title, body, primary, secondary }: { title: string; body?: string; primary: { href: string; label: string }; secondary?: { href: string; label: string } }) {
  return (
    <div className="wrap pb-20">
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-[16px] border-t-4 border-brand bg-ink p-8 text-white md:p-11">
        <div className="min-w-0 flex-[1_1_380px]">
          <h2 className="m-0 text-[clamp(28px,3.4vw,42px)] font-extrabold">{title}</h2>
          {body && <p className="m-0 mt-2 text-lg text-white/85">{body}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={primary.href} variant="on-ink">{primary.label}</ButtonLink>
          {secondary && <ButtonLink href={secondary.href} variant="outline-on-ink">{secondary.label}</ButtonLink>}
        </div>
      </div>
    </div>
  );
}
