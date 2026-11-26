import { formatRange, type Range } from "@p91/domain/price-ranges";

export function PriceRangeTable({ rows, caption }: { rows: { label: string; examples: string; range: Range | null; moves: string }[]; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-[16px] border border-line bg-white">
      <table className="w-full min-w-[560px] border-collapse tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-left text-[15px] text-muted">
            <th scope="col" className="px-6 py-4 font-semibold">Body type</th>
            <th scope="col" className="px-6 py-4 font-semibold">Price range</th>
            <th scope="col" className="px-6 py-4 font-semibold">What moves it within the range</th>
          </tr>
        </thead>
        <tbody>
          {rows.filter((r) => r.range).map((r) => (
            <tr key={r.label} className="border-t border-line">
              <th scope="row" className="px-6 py-4 text-left text-lg font-bold">{r.label}<span className="block text-sm font-medium text-muted">{r.examples}</span></th>
              <td className="px-6 py-4 text-[22px] font-extrabold">{formatRange(r.range!)}</td>
              <td className="px-6 py-4 text-[15px] text-text-2">{r.moves}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
