import Link from "next/link";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="wrap py-24">
      <h1 className="m-0 text-5xl font-extrabold">This page is not here</h1>
      <p className="mt-4 text-text-2">It may have moved. Try <Link href="/services">all services</Link> or <Link href="/">the home page</Link>.</p>
    </main>
  );
}
