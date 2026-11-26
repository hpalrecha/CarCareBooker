export function TrustStrip({ items }: { items: { strong: string; sub: string; href?: string }[] }) {
  return (
    <section aria-label="Why owners trust P91" className="bg-ink pb-10 pt-8 text-white">
      <ul className="wrap m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-7 gap-y-4">
        {items.map((it) => (
          <li key={it.strong} className="flex flex-col">
            {it.href
              ? <a href={it.href} className="flex flex-col text-white no-underline hover:text-on-ink"><strong className="text-[22px]">{it.strong}</strong><span className="text-sm text-white/75 underline">{it.sub}</span></a>
              : <><strong className="text-[22px]">{it.strong}</strong><span className="text-sm text-white/75">{it.sub}</span></>}
          </li>
        ))}
      </ul>
    </section>
  );
}
