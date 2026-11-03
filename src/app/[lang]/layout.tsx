import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono, Inter } from "next/font/google";
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

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const interBlack = Inter({
  variable: "--font-inter-black",
  subsets: ["latin"],
  weight: "900",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bruno Arnaud",
    template: "%s | Bruno Arnaud",
  },
  description: "Designer / Developer — Game Developer",
};

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
      <body className={`${geistSans.variable} ${geistMono.variable} ${interBlack.variable}`}>
        <Navbar
          currentLocale={lang}
          labels={dictionary.navigation}
        />

        <NavbarMobile
          openMenuLabel={dictionary.navigation.openMenu}
          closeMenuLabel={dictionary.navigation.closeMenu}
          labels={dictionary.navigation}
          professionalLinks={{
            github: "https://github.com/BrunoArn",
            linkedin: "https://www.linkedin.com/in/bruno-arnaud-2bb586164/",
          }}
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
            name="Bruno Arnaud"
            professionalLinks={{
              github: "https://github.com/BrunoArn",
              linkedin: "https://www.linkedin.com/in/bruno-arnaud-2bb586164/",
            }}
          />
        </div>
      </body>
    </html>
  );
}
