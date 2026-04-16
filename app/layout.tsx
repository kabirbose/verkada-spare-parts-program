import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Spare Parts Program",
  description: "By Kabir Bose for Verkada TSE Team",
};

// ── Root layout ────────────────────────────────────────────────────────────
// ClerkProvider wraps the entire tree so authentication state is available
// everywhere. The proxy.ts file enforces that all routes require sign-in.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full antialiased">
        <body className={`${geistSans.className} min-h-full flex flex-col`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}