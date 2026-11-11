import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "GlobalGig AI — From your next gig to your next payment", template: "%s · GlobalGig AI" },
  description:
    "Turn freelance opportunities into professional proposals, smarter project prices and PayPal milestone payments.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full`}>
      <body className="min-h-full font-sans text-[15px] leading-relaxed">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
