import type { Metadata, Viewport } from "next";
import { Figtree, Noto_Sans_Devanagari, Source_Serif_4 } from "next/font/google";
import { Toaster } from "sonner";
import { getDict } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/client";
import "./globals.css";

const sans = Figtree({ subsets: ["latin"], variable: "--font-sans-display", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif-display", display: "swap" });
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return {
    title: { default: t.meta.title, template: `%s · ${t.brand.name}` },
    description: t.meta.description,
    metadataBase: new URL(process.env.BETTER_AUTH_URL ?? "https://digitsnepal.com"),
    icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
    openGraph: { siteName: "DigitsNepal AI", type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#0d2338", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getDict();
  return (
    <html lang={locale} className={`${sans.variable} ${serif.variable} ${devanagari.variable}`}>
      <body className="min-h-dvh antialiased">
        <I18nProvider value={{ locale, t }}>
          {children}
          <Toaster position="top-center" closeButton />
        </I18nProvider>
      </body>
    </html>
  );
}
