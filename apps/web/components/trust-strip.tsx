export function TrustStrip({ items }: { items: { strong: string; sub: string }[] }) {
  return (
    <section aria-label="Why owners trust P91" className="bg-ink pb-10 pt-8 text-white">
      <ul className="wrap m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-7 gap-y-4">
        {items.map((it) => <li key={it.strong} className="flex flex-col"><strong className="text-[22px]">{it.strong}</strong><span className="text-sm text-white/75">{it.sub}</span></li>)}
      </ul>
    </section>
  );
}
