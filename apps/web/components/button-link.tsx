import Link from "next/link";

const STYLES = {
  primary: "bg-action text-white hover:bg-action-dark hover:text-white",
  secondary: "border-[1.5px] border-[#D5DDD9] bg-white text-ink hover:border-action",
  "on-ink": "bg-brand text-ink hover:bg-[#5fcf59] hover:text-ink",
  "outline-on-ink": "border-[1.5px] border-white/55 text-white hover:border-white hover:text-white",
} as const;

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: keyof typeof STYLES }) {
  const external = /^(https?:|tel:)/.test(href);
  const cls = `inline-flex min-h-[52px] items-center justify-center rounded-[12px] px-6 text-base font-bold no-underline transition-colors ${STYLES[variant]}`;
  return external ? <a href={href} className={cls}>{children}</a> : <Link href={href} className={cls}>{children}</Link>;
}
