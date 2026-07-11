import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Plus, UserPlus, UserMinus } from "lucide-react";
import bg from "@/assets/sunset-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { BadgeIcon } from "@/components/BadgeIcon";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "admin — gurt.lol" }] }),
  component: Admin,
});

type Profile = { id: string; username: string; display_name: string | null; is_premium: boolean };
type Badge = { id: string; slug: string; name: string; icon: string; color: string; is_custom: boolean };

function Admin() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userBadgeIds, setUserBadgeIds] = useState<Set<string>>(new Set());
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  const [newBadge, setNewBadge] = useState({ slug: "", name: "", description: "", icon: "Star", color: "#ffffff" });

  const load = useCallback(async () => {
    const [p, b] = await Promise.all([
      supabase.from("profiles").select("id, username, display_name, is_premium").order("created_at", { ascending: false }).limit(200),
      supabase.from("badges").select("*").order("created_at"),
    ]);
    setProfiles((p.data ?? []) as Profile[]);
    setBadges((b.data ?? []) as Badge[]);
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      const t = setTimeout(() => {
        if (!isAdmin) { toast.error("admins only"); nav({ to: "/dashboard" }); }
      }, 500);
      return () => clearTimeout(t);
    }
  }, [loading, user, isAdmin, nav]);

  async function selectUser(p: Profile) {
    setSelectedUser(p);
    const [{ data: ub }, { data: ur }] = await Promise.all([
      supabase.from("user_badges").select("badge_id").eq("user_id", p.id),
      supabase.from("user_roles").select("role").eq("user_id", p.id).eq("role", "admin"),
    ]);
    setUserBadgeIds(new Set((ub ?? []).map((x: { badge_id: string }) => x.badge_id)));
    setUserIsAdmin((ur ?? []).length > 0);
  }

  async function toggleBadge(badgeId: string) {
    if (!selectedUser) return;
    const has = userBadgeIds.has(badgeId);
    const fn = has ? "admin_revoke_badge" : "admin_grant_badge";
    const { error } = await supabase.rpc(fn, { _target_user: selectedUser.id, _badge_id: badgeId });
    if (error) return toast.error(error.message);
    const next = new Set(userBadgeIds);
    if (has) next.delete(badgeId); else next.add(badgeId);
    setUserBadgeIds(next);
    toast.success(has ? "revoked" : "granted");
  }

  async function toggleAdmin() {
    if (!selectedUser) return;
    const fn = userIsAdmin ? "admin_revoke_role" : "admin_grant_role";
    const { error } = await supabase.rpc(fn, { _target_user: selectedUser.id, _role: "admin" });
    if (error) return toast.error(error.message);
    setUserIsAdmin(!userIsAdmin);
    toast.success("updated");
  }

  async function createBadge() {
    if (!newBadge.slug || !newBadge.name) return toast.error("slug + name required");
    const { error } = await supabase.rpc("admin_create_badge", {
      _slug: newBadge.slug, _name: newBadge.name, _description: newBadge.description,
      _icon: newBadge.icon, _color: newBadge.color,
    });
    if (error) return toast.error(error.message);
    toast.success("badge created");
    setNewBadge({ slug: "", name: "", description: "", icon: "Star", color: "#ffffff" });
    load();
  }

  async function deleteBadge(id: string) {
    const { error } = await supabase.rpc("admin_delete_badge", { _badge_id: id });
    if (error) return toast.error(error.message);
    toast.success("deleted");
    load();
  }

  const filtered = profiles.filter((p) =>
    !search || p.username.toLowerCase().includes(search.toLowerCase()) ||
    (p.display_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) return <div className="min-h-screen bg-black p-8 text-white">checking permissions...</div>;

  return (
    <main className="relative min-h-screen bg-cover bg-center font-mono text-white" style={{ backgroundImage: `url(${bg})` }}>
      <div className="absolute inset-0 bg-black/75" />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> back
        </Link>
        <h1 className="mt-4 text-3xl font-bold">admin panel</h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Users */}
          <div className="rounded-2xl border border-white/10 bg-black/50 p-5 backdrop-blur">
            <h2 className="text-lg font-semibold">users ({profiles.length})</h2>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search..."
              className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
            <div className="mt-3 max-h-96 space-y-1 overflow-y-auto">
              {filtered.map((p) => (
                <button key={p.id} onClick={() => selectUser(p)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 ${selectedUser?.id === p.id ? "bg-white/15" : ""}`}>
                  <span>@{p.username}</span>
                  {p.is_premium && <span className="text-xs text-yellow-300">premium</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Manage selected user */}
          <div className="rounded-2xl border border-white/10 bg-black/50 p-5 backdrop-blur">
            <h2 className="text-lg font-semibold">manage user</h2>
            {!selectedUser ? (
              <p className="mt-3 text-sm text-white/50">select a user →</p>
            ) : (
              <div className="mt-3 space-y-4">
                <div>
                  <div className="text-white/60 text-xs">selected</div>
                  <div className="text-lg">@{selectedUser.username}</div>
                </div>
                <button onClick={toggleAdmin}
                  className="flex items-center gap-2 rounded-lg bg-red-500/20 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/30">
                  {userIsAdmin ? <><UserMinus className="h-4 w-4" /> revoke admin</> : <><UserPlus className="h-4 w-4" /> make admin</>}
                </button>
                <div>
                  <div className="mb-2 text-xs text-white/60">badges (click to toggle)</div>
                  <div className="flex flex-wrap gap-2">
                    {badges.map((b) => {
                      const has = userBadgeIds.has(b.id);
                      return (
                        <button key={b.id} onClick={() => toggleBadge(b.id)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ${has ? "border-white/40 bg-white/15" : "border-white/10 bg-white/5 opacity-60 hover:opacity-100"}`}>
                          <BadgeIcon icon={b.icon} color={b.color} />
                          {b.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="rounded-2xl border border-white/10 bg-black/50 p-5 backdrop-blur lg:col-span-2">
            <h2 className="text-lg font-semibold">badges catalog</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.map((b) => (
                <div key={b.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
                  <BadgeIcon icon={b.icon} color={b.color} />
                  <span>{b.name}</span>
                  <span className="text-xs text-white/40">/{b.slug}</span>
                  {b.is_custom && (
                    <button onClick={() => deleteBadge(b.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="mb-3 text-sm font-semibold">create custom badge</div>
              <div className="grid gap-2 md:grid-cols-2">
                <input placeholder="slug (unique)" value={newBadge.slug} onChange={(e) => setNewBadge({ ...newBadge, slug: e.target.value })}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
                <input placeholder="name" value={newBadge.name} onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
                <input placeholder="description" value={newBadge.description} onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none md:col-span-2" />
                <input placeholder="lucide icon name (e.g. Star, Crown, Heart)" value={newBadge.icon} onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
                <input type="color" value={newBadge.color} onChange={(e) => setNewBadge({ ...newBadge, color: e.target.value })}
                  className="h-10 rounded-lg border border-white/10 bg-white/5" />
              </div>
              <button onClick={createBadge} className="mt-3 flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-black hover:bg-white/90">
                <Plus className="h-4 w-4" /> create
              </button>
              <p className="mt-2 text-xs text-white/40">icons: any name from lucide.dev (PascalCase)</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
