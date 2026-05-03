import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServiceBeat",
  description: "API Health Monitor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <nav className="border-b border-gray-800 px-6 py-4">
          <a href="/" className="text-lg font-semibold tracking-tight text-white">
            ServiceBeat
          </a>
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
