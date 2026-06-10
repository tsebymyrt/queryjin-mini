import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACME Corp - 업무 포털",
  description: "ACME Corporation 내부 업무 포털 시스템 v2.4.1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-100">{children}</body>
    </html>
  );
}
