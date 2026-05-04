import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/auth";
import SignOutButton from "@/components/SignOutButton";

export const metadata: Metadata = {
  title: "ServiceBeat",
  description: "API Health Monitor",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-lg font-semibold tracking-tight text-white">
            ServiceBeat
          </a>
          {session?.user && (
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">{session.user.email}</span>
              <SignOutButton />
            </div>
          )}
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
