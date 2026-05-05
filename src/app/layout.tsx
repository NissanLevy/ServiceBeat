import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import UserMenu from "@/components/UserMenu";
import SwRegister from "@/components/SwRegister";

export const metadata: Metadata = {
  title: "ServiceBeat",
  description: "API Health Monitor",
  manifest: "/manifest.json",
  icons: {
    icon: "/servicebeat-favicon.svg",
    apple: "/servicebeat-apple-touch-icon.png",
  },
  openGraph: {
    title: "ServiceBeat",
    description: "API Health Monitor",
    images: [{ url: "/servicebeat-og-image.png", width: 1200, height: 630 }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/servicebeat-logo.svg" alt="ServiceBeat" width={120} height={28} className="h-7 w-auto" />
            </Link>
            {session?.user && (
              <>
                <Link href="/services" className="text-sm text-gray-400 hover:text-white">
                  Services
                </Link>
                <Link href="/status" className="text-sm text-gray-400 hover:text-white">
                  Status
                </Link>
                {session.user.role === "admin" && (
                  <Link href="/admin/users" className="text-sm text-gray-400 hover:text-white">
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>
          {session?.user && (
            <UserMenu email={session.user.email!} role={session.user.role ?? "member"} />
          )}
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
        <SwRegister />
      </body>
    </html>
  );
}
