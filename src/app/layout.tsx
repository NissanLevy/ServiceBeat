import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/auth";
import UserMenu from "@/components/UserMenu";

export const metadata: Metadata = {
  title: "ServiceBeat",
  description: "API Health Monitor",
  icons: { icon: "/servicebeat-favicon.svg" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2">
              <img src="/servicebeat-logo.svg" alt="ServiceBeat" className="h-7 w-auto" />
            </a>
            {session?.user && (
              <>
                <a href="/services" className="text-sm text-gray-400 hover:text-white">
                  Services
                </a>
                <a href="/status" className="text-sm text-gray-400 hover:text-white">
                  Status
                </a>
                {session.user.role === "admin" && (
                  <a href="/admin/users" className="text-sm text-gray-400 hover:text-white">
                    Admin
                  </a>
                )}
              </>
            )}
          </div>
          {session?.user && (
            <UserMenu email={session.user.email!} role={session.user.role ?? "member"} />
          )}
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
