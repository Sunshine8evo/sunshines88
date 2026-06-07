import type { Metadata, Viewport } from "next";

import { dmSans } from "@/lib/fonts";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sunshine Booking System",
    template: "%s | Sunshine Booking",
  },
  description: "The All-in-One Online Booking System for Service Businesses",
  metadataBase: new URL("https://www.sunshines88.com"),
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon-32.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Sunshine Booking System",
    description: "The All-in-One Online Booking System for Service Businesses",
    url: "https://www.sunshines88.com",
    siteName: "Sunshine Booking",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sunshine Booking System",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e87baa" },
    { media: "(prefers-color-scheme: dark)", color: "#7c5aad" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSans.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
