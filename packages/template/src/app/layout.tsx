import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import Providers from "@/components/Providers";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

// FEATURE_INJECT: layout_imports

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "{{PROJECT_NAME_TITLE}}",
  applicationName: "{{PROJECT_NAME_TITLE}}",
  description: "A progressive web app built with create-pwa-kit",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "{{PROJECT_NAME_TITLE}}",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0e0c" },
  ],
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${lora.variable} font-sans bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50`}>
        <Providers>
          <ServiceWorkerRegistrar />
          {children}
          {/* FEATURE_INJECT: layout_bottom_nav */}
        </Providers>
      </body>
    </html>
  );
}
