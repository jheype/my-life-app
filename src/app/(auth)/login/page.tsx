"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto mt-10 max-w-md">
          <div className="card p-6">
            <p className="text-sm text-zinc-600">Loading…</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const q = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q?.get("registered")) setMsg("Account created! Please log in.");
  }, [q]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setMsg("Invalid credentials. Please try again.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="card p-6">
        <h2 className="mb-4 text-2xl font-semibold">Log in</h2>

        <form className="grid gap-4" onSubmit={onSubmit}>
          <label className="block">
            <div className="label">Email</div>
            <input
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <div className="label">Password</div>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {msg && (
            <p className="text-sm text-red-600" role="alert" aria-live="polite">
              {msg}
            </p>
          )}

          <button className="btn btn-primary" disabled={loading} type="submit">
            {loading ? "Signing in…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
