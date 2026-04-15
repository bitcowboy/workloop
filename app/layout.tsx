import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workloop",
  description: "AI-powered personal focus dashboard for pomodoro sessions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
