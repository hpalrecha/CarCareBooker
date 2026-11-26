import Link from "next/link";
import { breadcrumbSchema } from "@web/lib/schema";
import { JsonLd } from "./json-ld";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-7 text-[15px] text-muted">
      <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
        {items.map((it, i) => (
          <li key={it.path}>
            {i < items.length - 1 ? <><Link href={it.path} className="text-muted">{it.name}</Link> /</> : <span aria-current="page" className="text-ink">{it.name}</span>}
          </li>
        ))}
      </ol>
      <JsonLd data={breadcrumbSchema(items)} />
    </nav>
  );
}
