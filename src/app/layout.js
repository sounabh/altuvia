import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";
import { Toaster } from "sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL('https://altuvia-beta.vercel.app'),
  title: {
    default: "All-in-One AI Platform for University Applications",
    template: "%s | AI University Applications"
  },
  description: "Manage university Mba applications with universities key infos, write essays, build CVs, plan timelines, track progress, and never miss deadlines.",
  keywords: ["MBA admissions", "college applications", "Essay editor with ai", "CV Builder"],
  authors: [{ name: "Altuvia" }],
  creator: "Altuvia",
  publisher: "Altuvia",
  
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://altuvia-beta.vercel.app",
    siteName: "Altuvia - The way of path",
    title: "Admissions Made Effortless | Your Education Journey",
    description: "Centralize all your MBA & college applications for a stress-free experience",
    images: [
      {
        url: "/logo_emblem.png",
        width: 1200,
        height: 630,
        alt: "Your Education Journey"
      }
    ]
  },
  
  twitter: {
    card: "summary_large_image",
    title: "Admissions Made Effortless | Your Education Journey",
    description: "Centralize all your MBA & college applications for a stress-free experience",
    creator: "@altuvia",
    images: ["/logo_emblem.png"],
  },
  
  // Discord and other social platforms use Open Graph, but we can add specific overrides
  other: {
    'og:image': '/discord.png', // Discord-specific image
    'og:image:width': '1200',
    'og:image:height': '630',
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} antialiased`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}