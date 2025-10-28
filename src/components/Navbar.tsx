"use client";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleSignOut() {
    setLoggingOut(true);
    try {
      await signOut({ callbackUrl: "/" }); 
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-base-bg/80 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-app items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Image
            src="/logo.png"
            alt="LifeHub Logo"
            width={34}
            height={34}
            className="rounded-md object-contain"
          />
          <span>MyLife</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {status === "loading" && (
            <div className="h-8 w-28 animate-pulse rounded-lg bg-zinc-200" />
          )}

          {status === "unauthenticated" && (
            <>
              <Link href="/login" className="btn btn-ghost">Sign in</Link>
              <Link href="/register" className="btn btn-primary">Create account</Link>
            </>
          )}

          {status === "authenticated" && (
            <>
              <Link href="/dashboard" className="btn btn-ghost">Dashboard</Link>
              <span className="hidden sm:inline text-sm text-zinc-700">
                {session.user?.name ?? "User"}
              </span>
              <button
                className="btn btn-red cursor-pointer"
                onClick={handleSignOut}
                disabled={loggingOut}
                aria-busy={loggingOut}
              >
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
