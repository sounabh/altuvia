import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";
import { Toaster } from "sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"], // light to extrabold
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata = {
  title: "Admissions Made Effortless | Your Education Journey",
  description: "Centralize all your MBA & college applications for a stress-free experience",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}