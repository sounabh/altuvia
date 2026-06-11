// globals/layout.tsx
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";
import { Toaster } from "sonner";
import SmoothScroll from "@/lib/utils/Smoothscrollprovider";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL('https://applykit-beta.vercel.app'),

  title: {
    default: "All-in-One AI Platform for University Applications",
    template: "%s | ApplyKit"
  },

  description:
    "Manage university and MBA applications, write essays, build CVs, plan timelines, track progress, and never miss deadlines.",

  keywords: [
    "MBA admissions",
    "college applications",
    "AI essay editor",
    "CV builder",
    "university applications",
    "ApplyKit"
  ],

  authors: [{ name: "ApplyKit" }],
  creator: "ApplyKit",
  publisher: "ApplyKit",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://applykit-beta.vercel.app",
    siteName: "ApplyKit",
    title: "Admissions Made Effortless | ApplyKit",
    description:
      "Centralize all your MBA and university applications in one place.",
    images: [
      {
        url: "/logo_emblem.png",
        width: 1200,
        height: 630,
        alt: "ApplyKit",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Admissions Made Effortless | ApplyKit",
    description:
      "Centralize all your MBA and university applications in one place.",
    creator: "@applykit",
    images: ["/logo_emblem.png"],
  },

  other: {
    "og:image": "/logo_emblem.png",
    "og:image:width": "1200",
    "og:image:height": "630",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} antialiased`}>
        <SmoothScroll>
          <Providers>{children}</Providers>
        </SmoothScroll>
        <Toaster />
      </body>
    </html>
  );
}