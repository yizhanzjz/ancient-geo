import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "古代地名查询 - 古今地理对照",
  description: "输入中国古代地名，查看对应的现代地理位置并在地图上标注",
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
