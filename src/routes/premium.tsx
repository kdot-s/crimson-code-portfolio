import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Crown } from "lucide-react";
import bg from "@/assets/sunset-bg.jpg";

export const Route = createFileRoute("/premium")({
  head: () => ({ meta: [{ title: "premium — gurt.lol" }] }),
  component: Premium,
});

const tiers = [
  { name: "weekly", price: "$5", period: "/week" },
  { name: "monthly", price: "$10", period: "/month", featured: true },
  { name: "yearly", price: "$45", period: "/year" },
];

const perks = [
  "custom badges",
  "high-res backgrounds & avatars",
  "custom accent color",
  "unlock all effects",
  "premium badge on your profile",
  "priority support",
];

export default function Premium() {
  return (
    <main className="relative min-h-screen bg-cover bg-center font-mono text-white" style={{ backgroundImage: `url(${bg})` }}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-16">
        <Link to="/" className="text-sm text-white/60 hover:text-white">← back</Link>
        <div className="mt-8 text-center">
          <Crown className="mx-auto h-10 w-10 text-yellow-300" />
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">gurt.lol premium</h1>
          <p className="mt-3 text-white/60">unlock everything. flex harder.</p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {tiers.map((t) => (
            <div key={t.name} className={`rounded-2xl border p-6 backdrop-blur ${t.featured ? "border-yellow-300/50 bg-yellow-300/5" : "border-white/10 bg-black/40"}`}>
              <div className="text-sm uppercase tracking-wider text-white/60">{t.name}</div>
              <div className="mt-2 text-4xl font-bold">{t.price}<span className="text-base font-normal text-white/50">{t.period}</span></div>
              <a href="https://discord.gg/swzbwvBjYc" target="_blank" rel="noopener noreferrer"
                className={`mt-6 block rounded-lg py-2.5 text-center text-sm font-semibold ${t.featured ? "bg-yellow-300 text-black hover:bg-yellow-200" : "bg-white text-black hover:bg-white/90"}`}>
                get {t.name}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold">what you get</h2>
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-white/80">
                <Check className="h-4 w-4 text-green-400" /> {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-center text-xs text-white/50">
          payments handled in our discord. join & DM staff to purchase.
        </p>
      </div>
    </main>
  );
}
