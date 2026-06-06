import { createFileRoute } from "@tanstack/react-router";
import { Github, Volume2, Eye, BadgeCheck } from "lucide-react";
import bg from "@/assets/sunset-bg.jpg";
import avatar from "@/assets/avatar.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "osamason [@osa]" },
      { name: "description", content: "good gorilla tag dev — ires, fays, ryn, mp5, s4eepy" },
    ],
  }),
  component: Index,
});

type Stat = { label: string; value: number };
const stats: Stat[] = [
  { label: "unity", value: 92 },
  { label: "c#", value: 88 },
  { label: "javascript", value: 74 },
  { label: "blender", value: 61 },
  { label: "photon", value: 80 },
];

function Index() {
  return (
    <main
      className="relative min-h-screen w-full overflow-hidden bg-cover bg-center font-mono"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="relative flex w-full max-w-2xl">
          {/* Card */}
          <div className="flex-1 rounded-2xl border border-white/10 bg-black/55 p-7 backdrop-blur-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
            {/* Header */}
            <div className="flex items-center gap-4">
              <img
                src={avatar}
                alt="osamason avatar"
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover ring-1 ring-white/15"
              />
              <div className="min-w-0">
                <h1 className="flex items-center gap-2 text-2xl tracking-wide text-white">
                  osamason <span className="text-white/60">[@osa]</span>
                  <BadgeCheck className="h-4 w-4 text-white/70" aria-label="verified" />
                </h1>
                <p className="mt-1 text-xs text-white/40">uid: 730921184</p>
              </div>
            </div>

            {/* Bio */}
            <p className="mt-6 text-sm leading-relaxed text-white/80">
              good gorilla tag dev<br />
              ires, fays, ryn, mp5, s4eepy
            </p>

            {/* Stats grid */}
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-xs text-white/60">{s.label}</div>
                  <div className="mt-1 h-px w-full bg-white/15">
                    <div
                      className="h-px bg-white/80"
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-white/60">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  defaultValue={25}
                  className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
                  aria-label="volume"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Eye className="h-4 w-4" />
                <span>5,418</span>
              </div>
            </div>
          </div>

          {/* Side icons */}
          <div className="ml-3 hidden flex-col justify-center gap-4 rounded-2xl border border-white/10 bg-black/55 px-3 py-6 backdrop-blur-md sm:flex">
            <a
              href="#"
              className="text-white/70 transition hover:text-white"
              aria-label="github"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-white/70 transition hover:text-white"
              aria-label="spotify"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.5 17.3a.75.75 0 0 1-1 .25c-2.75-1.7-6.2-2-10.3-1a.75.75 0 1 1-.35-1.45c4.45-1.05 8.3-.7 11.4 1.2.35.2.45.7.25 1Zm1.5-3.3a.94.94 0 0 1-1.3.3c-3.15-1.9-7.9-2.5-11.6-1.35a.94.94 0 1 1-.55-1.8c4.2-1.3 9.45-.65 13.1 1.55.45.25.6.85.35 1.3Zm.15-3.45c-3.75-2.2-9.95-2.4-13.55-1.3a1.12 1.12 0 1 1-.65-2.15c4.15-1.25 11-1.05 15.3 1.5a1.12 1.12 0 0 1-1.1 1.95Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
