import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { ArrowLeft, Users, Activity, DollarSign, Calendar, BarChart3, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Role = "member" | "coach" | "admin" | "super_admin";

export default function CrmPanel() {
  const { isAdmin, isSuperAdmin, loading } = useIsAdmin();
  const [members, setMembers] = useState<any[]>([]);
  const [pkgs, setPkgs] = useState<any[]>([]);
  const [att, setAtt] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string,Role>>({});
  const [busy, setBusy] = useState<string|null>(null);

  const refresh = async () => {
    const monthAgo = new Date(Date.now()-30*864e5).toISOString().slice(0,10);
    const [m, p, a, r] = await Promise.all([
      supabase.from("profiles").select("id,full_name,phone,created_at,loyalty_points,goal,coach_id,coach_name").order("created_at",{ascending:false}),
      supabase.from("packages").select("user_id,name,price,status,end_date").eq("status","active"),
      supabase.from("attendance").select("user_id,date").gte("date", monthAgo),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setMembers(m.data||[]); setPkgs(p.data||[]); setAtt(a.data||[]);
    const map: Record<string,Role> = {};
    (r.data||[]).forEach((x:any) => { map[x.user_id] = x.role; });
    setRoles(map);
  };

  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return (
    <div className="max-w-md mx-auto p-8 text-center glass-card rounded-2xl mt-10">
      <h2 className="font-display font-bold text-xl mb-2">Admins only</h2>
      <p className="text-sm text-muted-foreground mb-4">Ask an existing admin to grant you the admin or coach role.</p>
      <Link to="/profile" className="px-4 py-2 rounded-xl bg-gradient-brand text-primary-foreground inline-block">Back</Link>
    </div>
  );

  const today = new Date().toISOString().slice(0,10);
  const todayCheckins = att.filter(a => a.date === today).length;
  const monthlyRevenue = pkgs.reduce((s,p)=>s+(parseFloat(p.price)||0),0);
  const lastByUser: Record<string,string> = {};
  att.forEach(a => { if (!lastByUser[a.user_id] || a.date > lastByUser[a.user_id]) lastByUser[a.user_id] = a.date; });
  const pkgByUser: Record<string,any> = {}; pkgs.forEach(p => pkgByUser[p.user_id]=p);
  const activeMembers = Object.keys(pkgByUser).length;

  const setRole = async (userId: string, role: Role) => {
    setBusy(userId);
    const { error } = await supabase.rpc("set_user_role", { _target: userId, _role: role });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Role updated to ${role.replace("_"," ")}`);
    refresh();
  };

  const updatePoints = async (userId: string, current: number) => {
    if (!isSuperAdmin) return toast.error("Only super-admin can update loyalty points");
    const value = prompt("Set loyalty points for this member", String(current));
    if (value === null) return;
    const points = parseInt(value);
    if (Number.isNaN(points)) return toast.error("Enter a valid points value");
    setBusy(userId);
    const { error } = await supabase.from("profiles").update({ loyalty_points: points }).eq("id", userId);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Loyalty points updated");
    refresh();
  };

  const clearPoints = async (userId: string, name: string) => {
    if (!isSuperAdmin) return toast.error("Only super-admin can clear loyalty points");
    if (!confirm(`Reset loyalty points for ${name}?`)) return;
    setBusy(userId);
    const { error } = await supabase.from("profiles").update({ loyalty_points: 0 }).eq("id", userId);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Loyalty points reset to zero");
    refresh();
  };

  const remove = async (userId: string, name: string) => {
    if (!isSuperAdmin) return toast.error("Only super-admin can remove members");
    if (!confirm(`Permanently remove ${name}? Their data stays in the database but the profile row will be deleted.`)) return;
    setBusy(userId);
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Member removed");
    refresh();
  };

  const coachCounts: Record<string, number> = {};
  members.forEach((member) => {
    if (member.coach_id) coachCounts[member.coach_id] = (coachCounts[member.coach_id] || 0) + 1;
  });

  const coachRoster = members
    .filter((member) => ["coach", "admin", "super_admin"].includes(roles[member.id] || "member"))
    .map((member) => ({
      id: member.id,
      name: member.full_name || "Coach",
      phone: member.phone || "—",
      assigned: coachCounts[member.id] || 0,
      role: roles[member.id] || "coach",
    }))
    .sort((a, b) => b.assigned - a.assigned || a.name.localeCompare(b.name));

  const coachCount = coachRoster.length;
  const assignedMembers = Object.values(coachCounts).reduce((sum, value) => sum + value, 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(236,72,153,0.16),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.12),_transparent_30%),linear-gradient(180deg,#04080f,#07111f)] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="space-y-3">
            <Link to="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
              <ArrowLeft className="w-4 h-4"/>Back to App
            </Link>
            <div className="space-y-1">
              <p className="uppercase tracking-[0.25em] text-[11px] text-pink-300/90 font-semibold">CRM Premium</p>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">Luxury CRM & Coach Panel</h1>
              <p className="max-w-2xl text-sm text-slate-400">A mobile-first, modern CRM experience with premium coach management, advanced metrics and luxury styling for high-end fitness studios.</p>
            </div>
          </div>
          <div className="inline-flex rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 shadow-lg shadow-slate-950/20 backdrop-blur">
            <BarChart3 className="w-4 h-4 text-emerald-300"/>
            <span>{isSuperAdmin ? "Super-Admin" : "Admin / Coach"} · CRM Pro</span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr] mb-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-[0_40px_80px_rgba(0,0,0,0.30)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Executive dashboard</p>
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-emerald-200">Premium Mobile CRM</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">Luxury design</span>
                </div>
              </div>
              <div className="rounded-3xl bg-slate-900/70 border border-white/10 p-4 text-right">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Role</p>
                <p className="mt-2 text-lg font-semibold text-white">{isSuperAdmin ? "Super-Admin" : "Admin / Coach"}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/90 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Monthly Revenue</p>
                <p className="mt-4 text-3xl font-display font-extrabold text-emerald-300">₹{monthlyRevenue.toLocaleString()}</p>
                <p className="mt-2 text-sm text-slate-400">Active premium packages and recurring revenue</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/90 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Today’s Check-ins</p>
                <p className="mt-4 text-3xl font-display font-extrabold text-cyan-300">{todayCheckins}</p>
                <p className="mt-2 text-sm text-slate-400">Members logged in today</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            <Stat label="Total Members" value={members.length} icon={Users}/>
            <Stat label="Active coaches" value={coachCount} icon={Shield}/>
            <Stat label="Assigned members" value={assignedMembers} icon={Activity}/>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr] mb-6">
          <div className="glass-card rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.25)]">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <h3 className="font-display text-2xl font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-300"/>Members & Roles</h3>
                <p className="text-sm text-slate-400">High-end member tracking with role control and loyalty point management.</p>
              </div>
              <div className="rounded-3xl bg-white/5 border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-slate-300">Luxury CRM</div>
            </div>
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/80">
              <table className="w-full min-w-[840px] text-sm text-left">
                <thead className="bg-slate-900/90 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <tr>
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Coach</th>
                    <th className="py-3 px-3">Package</th>
                    <th className="py-3 px-3">Joined</th>
                    <th className="py-3 px-3">Last Check-in</th>
                    <th className="py-3 px-3 text-right">Points</th>
                    <th className="py-3 px-3 text-center">Role</th>
                    {isSuperAdmin && <th className="py-3 px-3"/>}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const r = roles[m.id] || "member";
                    return (
                      <tr key={m.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="py-3 px-3 font-semibold text-slate-100">{m.full_name || "—"}</td>
                        <td className="py-3 px-3 text-slate-300">{m.phone || "—"}</td>
                        <td className="py-3 px-3 text-xs text-slate-400">{m.coach_name || <span className="text-slate-500">Unassigned</span>}</td>
                        <td className="py-3 px-3 text-slate-300">{pkgByUser[m.id]?.name || <span className="text-slate-500">No active</span>}</td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-300">{m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}</td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-300">{lastByUser[m.id] ? new Date(lastByUser[m.id]).toLocaleDateString() : <span className="text-slate-500">—</span>}</td>
                        <td className="py-3 px-3 text-right font-semibold text-emerald-300">{m.loyalty_points || 0}</td>
                        <td className="py-3 px-3 text-center">
                          {isSuperAdmin || (r !== "admin" && r !== "super_admin") ? (
                            <select value={r} disabled={busy===m.id} onChange={(e)=>setRole(m.id, e.target.value as Role)}
                              className="w-full rounded-xl bg-slate-950 border border-white/10 px-2 py-1 text-[11px] text-slate-200 capitalize">
                              <option value="member">member</option>
                              <option value="coach">coach</option>
                              {isSuperAdmin && <option value="admin">admin</option>}
                              {isSuperAdmin && <option value="super_admin">super admin</option>}
                            </select>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-900 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">{r.replace("_"," ")}</span>
                          )}
                        </td>
                        {isSuperAdmin && (
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button disabled={busy===m.id} onClick={()=>updatePoints(m.id, m.loyalty_points||0)}
                                className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-2 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/10 transition">Edit</button>
                              <button disabled={busy===m.id} onClick={()=>clearPoints(m.id, m.full_name||"member")}
                                className="rounded-xl border border-pink-400/20 bg-pink-500/5 px-2 py-1 text-[11px] font-semibold text-pink-200 hover:bg-pink-500/10 transition">Reset</button>
                              <button disabled={busy===m.id} onClick={()=>remove(m.id, m.full_name||"member")}
                                className="rounded-xl bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-200 hover:bg-white/10 transition">Delete</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={isSuperAdmin ? 9 : 8} className="py-6 text-center text-slate-400">No members visible.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              {isSuperAdmin
                ? "As Super-Admin you can promote any member to coach, admin or super-admin and remove members."
                : "As Admin you can promote members to coach. Only Super-Admin can manage admin roles."}
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.25)]">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Coach Lounge</p>
              <h2 className="font-display text-2xl font-bold text-white mt-3">Advanced coach panel</h2>
              <p className="text-sm text-slate-400 mt-2">Track your coach team, call details and member assignments at a glance.</p>
            </div>
            <div className="space-y-4">
              {coachRoster.length > 0 ? coachRoster.map((coach) => (
                <div key={coach.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-300 font-semibold">{coach.name}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-[0.25em]">{coach.role.replace("_", " ")}</p>
                    </div>
                    <span className="rounded-full bg-slate-800/80 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300">Assigned {coach.assigned}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                    <span className="rounded-2xl bg-white/5 px-3 py-2">{coach.phone}</span>
                    <span className="rounded-2xl bg-white/5 px-3 py-2">{coach.assigned} members</span>
                  </div>
                </div>
              )) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-slate-900/80 p-5 text-center text-slate-400">
                  No coach team found yet. Assign member roles to enable the luxury coach panel.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.25)]">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Premium analytics</p>
            <h3 className="mt-3 text-xl font-bold text-white">Member trends</h3>
            <p className="mt-2 text-sm text-slate-400">See revenue, package activation and loyalty progress in one premium card.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-900/80 p-4 text-slate-300">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Packages</p>
                <p className="mt-3 text-2xl font-bold text-emerald-300">{activeMembers}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-4 text-slate-300">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Assigned</p>
                <p className="mt-3 text-2xl font-bold text-cyan-300">{assignedMembers}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-4 text-slate-300">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Coaches</p>
                <p className="mt-3 text-2xl font-bold text-amber-300">{coachCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.25)]">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Luxury tips</p>
            <h3 className="mt-3 text-xl font-bold text-white">CRM mobile experience</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="rounded-2xl bg-slate-900/80 p-4">Mobile-ready cards and touch-friendly controls for on-the-go admin work.</li>
              <li className="rounded-2xl bg-slate-900/80 p-4">Auto-fill support for coach names with phone lookup in the profile editor.</li>
              <li className="rounded-2xl bg-slate-900/80 p-4">Premium panel styling with deep gradients, glass surfaces and refined typography.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({label,value,icon:Icon}:any){
  return <div className="glass-card rounded-2xl p-4">
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="w-9 h-9 rounded-xl bg-gradient-brand text-primary-foreground flex items-center justify-center"><Icon className="w-4 h-4"/></div>
    </div>
    <p className="font-display text-2xl font-extrabold mt-2">{value}</p>
  </div>;
}
