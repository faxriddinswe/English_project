import { PublicLink as Link } from "@/components/ui/PublicLink";
import { publicFetch, text, type Site } from "@/lib/api/public";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Maxfiylik xabari",
  alternates: { canonical: "/privacy" },
};
export default async function Privacy() {
  const site = await publicFetch<Site>("/site").catch(() => ({
    brand: "Sherzod English",
    content: [],
  }));
  const item = site.content.find((x) => x.kind === "privacy");
  return (
    <main className="container prose-page">
      <Link href="/">← Sherzod English</Link>
      <h1>{item?.title ?? "Maxfiylik xabari"}</h1>
      <p>
        {text(
          item,
          "body",
          "Arizada bergan ismingiz, telefoningiz, tanlangan kurs va izohingiz siz bilan bog‘lanish hamda murojaatni boshqarish uchun saqlanadi. Ma’lumotlaringizni ustoz ko‘radi. Bildirishnoma integratsiyasi yoqilgan bo‘lsa, murojaat ustozning Telegram chatiga ham yuboriladi. O‘quvchi ma’lumotlari shaxsiy kabinet orqali himoyalangan holda ishlatiladi.",
        )}
      </p>
    </main>
  );
}
