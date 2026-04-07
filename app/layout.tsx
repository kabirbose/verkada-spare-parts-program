import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spare Parts Program",
  description: "By Kabir Bose for Verkada TSE Team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      {/* Apply the generated className directly to the body */}
      <body className={`${geistSans.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}