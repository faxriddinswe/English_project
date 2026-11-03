"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container prose-page">
      <h1>Ma’lumotlar yuklanmadi</h1>
      <p>Server bilan aloqa vaqtincha mavjud emas.</p>
      <button className="button" onClick={reset}>
        Qayta urinish
      </button>
      <Link href="/">Bosh sahifa</Link>
    </main>
  );
}
