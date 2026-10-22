import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QaCredit } from "@/components/qa-credit";
import { getEnv } from "@/lib/env";
import "./globals.css";

const title = "Hexmote";
const description =
  "A realtime collaborative hex canvas: paint one cell at a time to recreate an emoji together.";
const shareImage = {
  url: "/og-image-v1.jpg",
  type: "image/jpeg",
  width: 1200,
  height: 630,
  alt: "A grinning face emoji made of hexes, half painted, beside the words Hexmote, realtime collaborative canvas",
};

export const generateMetadata = async () => {
  const { WEB_ORIGIN: webOrigin } = await getEnv();
  const metadata: Metadata = {
    metadataBase: new URL(webOrigin),
    title,
    description,
    icons: {
      icon: [
        { url: "/favicon.ico", type: "image/x-icon", sizes: "16x16 32x32 48x48" },
        { url: "/icon.png", type: "image/png", sizes: "192x192" },
      ],
      apple: { url: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    },
    openGraph: {
      type: "website",
      url: "/",
      siteName: title,
      title,
      description,
      locale: "en_US",
      images: shareImage,
    },
    twitter: { card: "summary_large_image" },
  };

  return metadata;
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        {children}
        <footer className="mt-auto text-center text-xs text-muted-foreground">
          <QaCredit />
        </footer>
      </body>
    </html>
  );
}
