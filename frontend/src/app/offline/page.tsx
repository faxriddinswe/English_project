import Link from "next/link";
export const metadata = {
  title: "Internet mavjud emas",
  robots: { index: false, follow: false },
};
export default function Offline() {
  return (
    <main className="auth-page">
      <section className="auth-card panel">
        <h1>Internet bilan aloqa yo‘q</h1>
        <p>
          Ulanishni tekshiring va sahifani qayta oching. To‘lov, davomat va
          boshqa o‘zgarishlar oflayn saqlanmaydi.
        </p>
        <Link href="/" className="button">
          Qayta ochish
        </Link>
      </section>
    </main>
  );
}
