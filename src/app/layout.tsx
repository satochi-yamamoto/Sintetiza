import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Document Summarizer",
  description: "Upload your documents and get intelligent summaries in seconds. Supports PDF, DOCX, and TXT files.",
  keywords: ["AI", "Document Summarizer", "PDF", "DOCX", "TXT", "Next.js", "TypeScript"],
  authors: [{ name: "AI Document Summarizer Team" }],
  openGraph: {
    title: "AI Document Summarizer",
    description: "Upload your documents and get intelligent summaries in seconds",
    url: "https://your-domain.com",
    siteName: "AI Document Summarizer",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Document Summarizer",
    description: "Upload your documents and get intelligent summaries in seconds",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
