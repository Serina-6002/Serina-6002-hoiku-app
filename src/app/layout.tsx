import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "保育メモ",
  description: "保育士のための30秒記録メモアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-bg">{children}</body>
    </html>
  );
}
