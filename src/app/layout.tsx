import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CertFlow — Certificate Automation & Verification Platform",
  description: "Enterprise bulk certificate automation, generation, and public ID verification platform",
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
