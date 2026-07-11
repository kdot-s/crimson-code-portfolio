import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, Shield, ExternalLink, Save } from "lucide-react";
import bg from "@/assets/sunset-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { BadgeIcon } from "@/components/BadgeIcon";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "dashboard — gurt.lol" }] }),
  component: Dashboard,
});

type Profile = {
  id: string; username: string; display_name: string | null; bio: string | null;
  description: string | null; avatar_url: string | null; background_url: string | null;
  song_url: string | null; accent_color: string | null; card_opacity: number | null;
  is_premium: boolean; views: number;
};

type Badge = { id: string; slug: string; name: string; icon: string; color: string };

function Dashboard() {
  const nav = useNavigate();
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
    supabase.from("user_badges").select("badge:badges(*)").eq("user_id", user.id)
      .then(({ data }) => setBadges((data ?? []).map((r: { badge: Badge }) => r.badge)));
  }, [user]);

  async function save() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: profile.display_name, bio: profile.bio, description: profile.description,
      avatar_url: profile.avatar_url, background_url: profile.background_url,
      song_url: profile.song_url, accent_color: profile.accent_color, card_opacity: profile.card_opacity,
    }).eq("id", profile.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("saved");
  }

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/" });
  }

  if (!profile) return <div className="min-h-screen bg-black p-8 text-white">loading...</div>;

  return (
    <main className="relative min-h-screen bg-cover bg-center font-mono text-white" style={{ backgroundImage: `url(${bg})` }}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">gurt<span className="text-white/50">.lol</span></Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/30">
                <Shield className="h-3 w-3" /> admin
              </Link>
            )}
            <button onClick={signOut} className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20">
              <LogOut className="h-3 w-3" /> sign out
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/50">your link</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg">gurt.lol/u/{profile.username}</span>
                <Link to="/u/$username" params={{ username: profile.username }} className="text-white/60 hover:text-white">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="text-right text-xs text-white/50">
              <div>{profile.views.toLocaleString()} views</div>
              {profile.is_premium && <div className="text-yellow-300">premium</div>}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold">customize</h2>
          <Field label="display name">
            <input value={profile.display_name ?? ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30" />
          </Field>
          <Field label="bio (short tagline)">
            <input value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} maxLength={100}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30" />
          </Field>
          <Field label="description (typewriter, one line per newline)">
            <textarea value={profile.description ?? ""} onChange={(e) => setProfile({ ...profile, description: e.target.value })} rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30" />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="avatar url"><UrlInput v={profile.avatar_url} on={(v) => setProfile({ ...profile, avatar_url: v })} /></Field>
            <Field label="background url"><UrlInput v={profile.background_url} on={(v) => setProfile({ ...profile, background_url: v })} /></Field>
            <Field label="song url (mp3)"><UrlInput v={profile.song_url} on={(v) => setProfile({ ...profile, song_url: v })} /></Field>
            <Field label="accent color">
              <input type="color" value={profile.accent_color ?? "#ffffff"} onChange={(e) => setProfile({ ...profile, accent_color: e.target.value })}
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5" />
            </Field>
          </div>
          <Field label={`card opacity: ${profile.card_opacity ?? 55}%`}>
            <input type="range" min={20} max={90} value={profile.card_opacity ?? 55}
              onChange={(e) => setProfile({ ...profile, card_opacity: Number(e.target.value) })}
              className="w-full accent-white" />
          </Field>

          <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? "saving..." : "save changes"}
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold">your badges</h2>
          {badges.length === 0 ? (
            <p className="mt-2 text-sm text-white/50">no badges yet. <Link to="/premium" className="text-yellow-300 hover:underline">get premium</Link> or reach out on discord.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.map((b) => (
                <div key={b.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
                  <BadgeIcon icon={b.icon} color={b.color} />
                  <span>{b.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1.5 text-xs text-white/60">{label}</div>{children}</label>;
}
function UrlInput({ v, on }: { v: string | null; on: (v: string) => void }) {
  return <input value={v ?? ""} onChange={(e) => on(e.target.value)} placeholder="https://..."
    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30" />;
}
