import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Shield, Zap, Users } from "lucide-react";
import bg from "@/assets/sunset-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gurt.lol — claim your profile" },
      { name: "description", content: "The smoothest profile platform. Claim your username, customize your card, and flex your badges." },
      { property: "og:title", content: "Gurt.lol" },
      { property: "og:description", content: "Claim your username. Customize everything." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    supabase.from("profiles").select("*", { count: "exact", head: true })
      .then(({ count }) => setCount(count ?? 0));
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-cover bg-center font-mono text-white"
      style={{ backgroundImage: `url(${bg})` }}>
      <div className="absolute inset-0 bg-black/60" />

      <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/" className="text-2xl font-bold tracking-tight">gurt<span className="text-white/50">.lol</span></Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/premium" className="text-white/70 hover:text-white">premium</Link>
          <a href="https://discord.gg/swzbwvBjYc" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white">discord</a>
          {user ? (
            <Link to="/dashboard" className="rounded-full bg-white px-4 py-1.5 text-black hover:bg-white/90">dashboard</Link>
          ) : (
            <Link to="/auth" className="rounded-full bg-white px-4 py-1.5 text-black hover:bg-white/90">sign in</Link>
          )}
        </div>
      </nav>

      <section className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pb-20 pt-16 text-center md:pt-28">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
          <Sparkles className="h-3 w-3" /> {count.toLocaleString()} profiles claimed
        </div>
        <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
          the smoothest<br />profile on the internet
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/70">
          Claim your <span className="text-white">gurt.lol/u/username</span>. Pick your song, your background, your badges. Flex.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Link to="/dashboard" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90">
              go to your dashboard →
            </Link>
          ) : (
            <Link to="/auth" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90">
              claim your username →
            </Link>
          )}
          <Link to="/premium" className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/10">
            view premium
          </Link>
        </div>

        <div className="mt-20 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: Zap, title: "instant claim", body: "sign up in 10 seconds, your link is live" },
            { icon: Shield, title: "verified badges", body: "earn verified, buyer, premium & more" },
            { icon: Users, title: "premium perks", body: "custom badges, higher-res assets, priority support" },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-black/40 p-5 text-left backdrop-blur">
              <f.icon className="mb-2 h-5 w-5" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-white/60">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
