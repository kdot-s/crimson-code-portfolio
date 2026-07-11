import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Github, Volume2, Eye } from "lucide-react";
import defaultBg from "@/assets/sunset-bg.jpg";
import defaultAvatar from "@/assets/avatar.jpg";
import defaultSong from "@/assets/whotfisu.mp3.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { BadgeIcon } from "@/components/BadgeIcon";

type ProfileFull = {
  id: string; username: string; display_name: string | null; bio: string | null;
  description: string | null; avatar_url: string | null; background_url: string | null;
  song_url: string | null; accent_color: string | null; card_opacity: number | null;
  is_premium: boolean; views: number;
  user_badges: { badge: { id: string; name: string; icon: string; color: string } }[];
};

export const Route = createFileRoute("/u/$username")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, user_badges(badge:badges(id, name, icon, color))")
      .eq("username", params.username)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { profile: data as unknown as ProfileFull };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.profile.display_name ?? loaderData.profile.username} [@${loaderData.profile.username}] — gurt.lol` },
      { name: "description", content: loaderData.profile.bio ?? "gurt.lol profile" },
      { property: "og:title", content: `@${loaderData.profile.username}` },
      { property: "og:description", content: loaderData.profile.bio ?? "gurt.lol" },
    ] : [{ title: "profile — gurt.lol" }],
  }),
  errorComponent: () => <ProfileError />,
  notFoundComponent: () => <ProfileNotFound />,
  component: ProfilePage,
});

function ProfileNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white font-mono">
      <div className="text-center">
        <div className="text-6xl font-bold">404</div>
        <p className="mt-2 text-white/60">username not claimed</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-white px-4 py-2 text-sm text-black">claim it →</Link>
      </div>
    </main>
  );
}
function ProfileError() {
  return <main className="flex min-h-screen items-center justify-center bg-black text-white">something broke</main>;
}

function useTypewriter(lines: string[], speed = 45, lineDelay = 400) {
  const [typed, setTyped] = useState<string[]>([]);
  const [line, setLine] = useState(0);
  const [ch, setCh] = useState(0);
  useEffect(() => {
    setTyped([]); setLine(0); setCh(0);
  }, [lines.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (line >= lines.length) return;
    const cur = lines[line];
    if (ch < cur.length) {
      const t = setTimeout(() => {
        setTyped((p) => { const n = [...p]; n[line] = cur.slice(0, ch + 1); return n; });
        setCh(ch + 1);
      }, speed);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setLine(line + 1); setCh(0); }, lineDelay);
    return () => clearTimeout(t);
  }, [ch, line, lines, speed, lineDelay]);
  return typed;
}

function ProfilePage() {
  const { profile } = Route.useLoaderData();
  const bg = profile.background_url || defaultBg;
  const avatar = profile.avatar_url || defaultAvatar;
  const song = profile.song_url || defaultSong.url;
  const accent = profile.accent_color || "#ffffff";
  const opacity = (profile.card_opacity ?? 55) / 100;

  const lines = (profile.description ?? profile.bio ?? "").split("\n").filter(Boolean);
  const typed = useTypewriter(lines);

  const [views, setViews] = useState(profile.views);
  const bumped = useRef(false);
  useEffect(() => {
    if (bumped.current) return;
    bumped.current = true;
    supabase.rpc("increment_profile_views", { _username: profile.username })
      .then(({ data }) => { if (typeof data === "number") setViews(data); });
  }, [profile.username]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(25);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; }, [volume]);
  useEffect(() => {
    const start = () => audioRef.current?.play().catch(() => {});
    audioRef.current?.play().catch(() => {
      window.addEventListener("click", start, { once: true });
      window.addEventListener("keydown", start, { once: true });
    });
    return () => window.removeEventListener("click", start);
  }, []);

  // Tilt on hover
  const cardRef = useRef<HTMLDivElement | null>(null);
  function onMove(e: React.MouseEvent) {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.02)`;
  }
  function onLeave() {
    if (cardRef.current) cardRef.current.style.transform = "";
  }

  const badges: ProfileFull["user_badges"] = profile.user_badges ?? [];

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-cover bg-center font-mono"
      style={{ backgroundImage: `url(${bg})` }}>
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="relative flex w-full max-w-2xl">
          <div
            ref={cardRef}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            className="flex-1 rounded-2xl border border-white/10 p-7 backdrop-blur-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] transition-transform duration-150 ease-out will-change-transform"
            style={{ backgroundColor: `rgba(0,0,0,${opacity})` }}
          >
            <div className="flex items-center gap-4">
              <img src={avatar} alt={profile.username} width={64} height={64}
                className="h-16 w-16 rounded-full object-cover ring-1 ring-white/15" />
              <div className="min-w-0">
                <h1 className="flex flex-wrap items-center gap-2 text-2xl tracking-wide text-white">
                  {profile.display_name ?? profile.username}
                  <span className="text-white/60">[@{profile.username}]</span>
                  {badges.map((ub) => (
                    <BadgeIcon key={ub.badge.id} icon={ub.badge.icon} color={ub.badge.color} />
                  ))}
                </h1>
                <p className="mt-1 text-xs text-white/40">uid: {profile.id.slice(0, 8)}</p>
              </div>
            </div>

            <div className="mt-6 min-h-[3rem] text-sm leading-relaxed text-white/80">
              {typed.map((l, i) => (
                <div key={i}>
                  {l}{i === typed.length - 1 && i < lines.length && <span className="animate-pulse">|</span>}
                </div>
              ))}
            </div>

            {badges.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {badges.map((ub) => (
                  <div key={ub.badge.id} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs">
                    <BadgeIcon icon={ub.badge.icon} color={ub.badge.color} className="h-3 w-3" />
                    <span style={{ color: ub.badge.color }}>{ub.badge.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-white/60">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" style={{ color: accent }} />
                <input type="range" min={0} max={100} value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/20 accent-white" />
                <audio ref={audioRef} src={song} loop preload="auto" />
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Eye className="h-4 w-4" />
                <span>{views.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="ml-3 hidden flex-col justify-center gap-4 rounded-2xl border border-white/10 bg-black/55 px-3 py-6 backdrop-blur-md sm:flex">
            <Link to="/" aria-label="gurt.lol" className="text-white/70 transition hover:text-white text-xs font-bold">
              gurt
            </Link>
            <a href="https://discord.gg/swzbwvBjYc" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white" aria-label="discord">
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
