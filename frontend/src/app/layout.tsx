import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { Notifications } from "@/components/Notifications";
import { PWA } from "@/components/PWA";

export const metadata: Metadata = {
  title: {
    default: "Sherzod English — Ingliz tili kurslari",
    template: "%s | Sherzod English",
  },
  description:
    "Grammatikadan mustahkam poydevor. IELTS va CEFR sari aniq yo'l — Sherzod ustoz bilan.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    siteName: "Sherzod English",
    locale: "uz_UZ",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1C0D23" },
    { media: "(prefers-color-scheme: light)", color: "#F5F3FA" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body>
        {children}
        <PWA />
        <Notifications />
      </body>
    </html>
  );
}
