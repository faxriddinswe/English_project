import Link from "next/link";
export default function NotFound() {
  return (
    <main className="container prose-page">
      <h1>Sahifa topilmadi</h1>
      <Link className="button" href="/">
        Bosh sahifa
      </Link>
    </main>
  );
}
