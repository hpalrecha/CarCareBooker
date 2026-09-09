import { Fragment, type ReactNode } from "react";
import { Link } from "wouter";

/**
 * Renders the tiny inline vocabulary used in blog copy: `**bold**` and
 * `[label](/internal-path)`.
 *
 * Deliberately NOT a markdown library and deliberately not dangerouslySetInnerHTML. The
 * content is ours, but blog copy is the kind of thing that gets pasted in later by
 * someone else, and a renderer that cannot emit raw HTML cannot be turned into an XSS
 * hole by a careless paste. Anything it does not recognise is rendered as literal text.
 *
 * Only root-relative links are turned into <Link>: an href starting with "/" stays inside
 * the SPA and keeps client-side routing. External URLs are rendered as plain text on
 * purpose — if a post ever needs one, add an explicit case rather than letting arbitrary
 * schemes through.
 */

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\(\/[^)]*\))/g;

export function RichText({ text }: { text: string }): ReactNode {
  const parts = text.split(TOKEN).filter((p) => p !== "");

  return (
    <>
      {parts.map((part, i) => {
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        if (bold) return <strong key={i}>{bold[1]}</strong>;

        const link = part.match(/^\[([^\]]+)\]\((\/[^)]*)\)$/);
        if (link) {
          return (
            <Link key={i} href={link[2]}>
              {link[1]}
            </Link>
          );
        }

        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

export default RichText;
