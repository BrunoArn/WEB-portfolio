import type { Metadata } from "next";
import { getIndexingMetadata } from "@/seo/international";
import { siteLinks } from "@/config/site";
import { notFound } from "next/navigation";
import { Geist, Inter } from "next/font/google";
import { isLocale, locales } from "@/i18n/config";
import { Navbar } from "@/components/layout/Navbar";
import { NavbarMobile } from "@/components/layout/NavbarMobile";
import { getDictionary } from "@/i18n/get-dictionary";
import { Footer } from "@/components/layout/Footer";

import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const interBlack = Inter({
  variable: "--font-inter-black",
  subsets: ["latin"],
  weight: "900",
  display: "swap",
});

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dictionary = await getDictionary(lang);
  return {
    title: {
      default: dictionary.site.name,
      template: "%s | " + dictionary.site.name,
    },
    ...getIndexingMetadata(),
    description: dictionary.site.description,
  };
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const dictionary = await getDictionary(lang);

  return (
    <html lang={lang}>
      <body className={`${geistSans.variable} ${interBlack.variable}`}>
        <Navbar
          currentLocale={lang}
          labels={dictionary.navigation}
        />

        <NavbarMobile
          openMenuLabel={dictionary.navigation.openMenu}
          closeMenuLabel={dictionary.navigation.closeMenu}
          labels={dictionary.navigation}
          professionalLinks={siteLinks}
          currentLocale={lang}
        />

        {/* Reserve the fixed header footprint; the desktop Atlas compensates this space locally. */}
        <div
          data-app-shell-content
          className="flex min-h-dvh flex-col pt-(--shell-header-offset)"
        >
          <div className="flex-1">
            {children}
          </div>

          <Footer
            name={dictionary.site.name}
            professionalLinks={siteLinks}
          />
        </div>
      </body>
    </html>
  );
}
