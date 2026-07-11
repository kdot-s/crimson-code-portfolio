import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import bg from "@/assets/sunset-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "sign in — gurt.lol" }] }),
  component: Auth,
});

function Auth() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [user, loading, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const clean = username.trim().toLowerCase();
        if (!/^[a-zA-Z0-9_-]{2,32}$/.test(clean)) throw new Error("username: 2-32 chars, letters/numbers/_/-");
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: clean, display_name: clean },
          },
        });
        if (error) throw error;
        toast.success("account created — you're in");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "auth failed");
    } finally { setBusy(false); }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message ?? "google sign-in failed");
  }

  return (
    <main className="relative min-h-screen bg-cover bg-center font-mono text-white" style={{ backgroundImage: `url(${bg})` }}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/60 p-7 backdrop-blur">
          <h1 className="text-2xl font-bold">{mode === "in" ? "welcome back" : "claim your username"}</h1>
          <p className="mt-1 text-sm text-white/60">gurt.lol</p>

          <button onClick={google} className="mt-6 w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-black hover:bg-white/90">
            continue with google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-white/40">
            <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "up" && (
              <input value={username} onChange={(e) => setUsername(e.target.value)} required
                placeholder="username" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30" />
            )}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="email" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              placeholder="password" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30" />
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-white/90 py-2.5 text-sm font-semibold text-black hover:bg-white disabled:opacity-50">
              {busy ? "..." : mode === "in" ? "sign in" : "create account"}
            </button>
          </form>

          <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-center text-xs text-white/50 hover:text-white">
            {mode === "in" ? "need an account? sign up" : "already have one? sign in"}
          </button>
        </div>
      </div>
    </main>
  );
}
