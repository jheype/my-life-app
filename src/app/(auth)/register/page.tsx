"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const r = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMsg(data.error || "Erro");
      } else {
        r.push("/login?registered=1");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="card p-6">
        <h2 className="mb-4 text-2xl font-semibold">Join Now</h2>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <label className="block">
            <div className="label">Name</div>
            <input className="input" value={name} onChange={(e)=>setName(e.target.value)} />
          </label>
          <label className="block">
            <div className="label">E-mail</div>
            <input className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          </label>
          <label className="block">
            <div className="label">Password</div>
            <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </label>

          {msg && <p className="text-sm text-red-600">{msg}</p>}

          <button className="btn btn-primary" disabled={loading} type="submit">
            {loading ? "Loading..." : "Join Now"}
          </button>
        </form>
      </div>
    </div>
  );
}
