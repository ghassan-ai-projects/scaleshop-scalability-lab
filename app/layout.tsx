import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScaleShop Scalability Lab",
  description: "An evidence-driven interactive scalability workshop for engineering teams.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "ScaleShop Scalability Lab",
    description: "Inspect evidence, diagnose the bottleneck, and choose the smallest sufficient change.",
    type: "website",
    images: [{ url: "/scaleshop-social-v2.png", width: 1200, height: 630, alt: "ScaleShop Scalability Lab with an abstract system topology" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScaleShop Scalability Lab",
    description: "Learn to scale from evidence.",
    images: ["/scaleshop-social-v2.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
