import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRTCMS — Petroleum Refinery Task & Certificate Management",
  description: "Role-based task and certificate management system for petroleum refinery operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
