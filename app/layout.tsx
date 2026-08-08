import type { Metadata } from "next";
import AppShell from "@/components/app/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Multi-Rate Pricing Calculator",
  description: "Create draft documents, calculate line-item pricing, finalize documents, and report totals."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
