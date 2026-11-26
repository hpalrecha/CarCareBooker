import { faqSchema } from "@web/lib/schema";
import { JsonLd } from "./json-ld";
import { RichText } from "./rich-text";

export function FaqList({ items, withSchema = true }: { items: { q: string; a: string }[]; withSchema?: boolean }) {
  return (
    <>
      <dl className="m-0">
        {items.map((it, i) => (
          <div key={it.q} className={`border-t border-line py-5 ${i === items.length - 1 ? "border-b" : ""}`}>
            <dt className="mb-1.5 text-[19px] font-bold">{it.q}</dt>
            <dd className="m-0 text-text-2"><RichText text={it.a} /></dd>
          </div>
        ))}
      </dl>
      {withSchema && <JsonLd data={faqSchema(items)} />}
    </>
  );
}
