"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";

interface Props {
  email: string;
  role: string;
}

export default function UserMenu({ email, role }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const initial = email[0].toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white text-sm font-semibold transition-colors"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-sm text-white font-medium truncate">{email}</p>
            <span className={`mt-1.5 inline-block text-xs font-medium px-2 py-0.5 rounded border ${
              role === "admin"
                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                : "bg-gray-800 text-gray-400 border-gray-700"
            }`}>
              {role}
            </span>
          </div>
          <div className="py-1">
            <a
              href="/account/tokens"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              API Tokens
            </a>
            <a
              href="/account/password"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Change password
            </a>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
