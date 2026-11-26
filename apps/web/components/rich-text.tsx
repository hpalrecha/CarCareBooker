import Link from "next/link";
import { Fragment } from "react";

const TOKEN = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * Renders the two inline marks copy may carry: **bold** and [label](/path). Internal paths go
 * through next/link; anything else is plain text. No HTML is ever injected.
 */
export function RichText({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    if (m[1] !== undefined) out.push(<strong key={i++} className="text-inherit">{m[1]}</strong>);
    else {
      const href = m[3];
      out.push(
        href.startsWith("/")
          ? <Link key={i++} href={href} className="font-bold">{m[2]}</Link>
          : <a key={i++} href={href} className="font-bold">{m[2]}</a>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return <>{out}</>;
}
