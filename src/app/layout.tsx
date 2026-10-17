import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aishwi Technologies — Certificate Automation & Verification Platform",
  description: "Official certificate automation, bulk generation, and credential verification portal for Aishwi Technologies.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased text-slate-900">
        {children}
      </body>
    </html>
  );
}
