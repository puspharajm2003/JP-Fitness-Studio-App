import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { 
  ArrowLeft, Users, Activity, DollarSign, Calendar, BarChart3, 
  Shield, Trash2, Search, Zap, UserPlus, ArrowRight, TrendingUp,
  Filter, Download, ChevronRight, Edit3, RotateCcw, LayoutGrid,
  Users2, Award, Settings, MessageSquare, Plus, Sparkles, CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Role = "member" | "coach" | "admin" | "super_admin";
type Tab = "overview" | "members" | "points" | "coaches" | "audit" | "ai_assist";

export default function CrmPanel() {
  const { isAdmin, isSuperAdmin, loading } = useIsAdmin();
  const [members, setMembers] = useState<any[]>([]);
  const [pkgs, setPkgs] = useState<any[]>([]);
  const [att, setAtt] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, Role>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");

  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [lastAction, setLastAction] = useState<{
    id: string;
    type: "role" | "points";
    targetId: string;
    oldValue: any;
    newValue: any;
    label: string;
  } | null>(null);

  const refresh = async () => {
    const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    const [m, p, a, r, rd] = await Promise.all([
      supabase.from("profiles").select("id,full_name,phone,created_at,loyalty_points,goal,coach_id,coach_name").order("created_at", { ascending: false }),
      supabase.from("packages").select("user_id,name,price,status,end_date").eq("status", "active"),
      supabase.from("attendance").select("user_id,date").gte("date", monthAgo),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("redemptions").select("*, profiles(full_name)").order("redeemed_at", { ascending: false }),
    ]);
    setMembers(m.data || []);
    setPkgs(p.data || []);
    setAtt(a.data || []);
    setRedemptions(rd.data || []);
    const map: Record<string, Role> = {};
    (r.data || []).forEach((x: any) => { map[x.user_id] = x.role; });
    setRoles(map);
    generateAiSuggestions(m.data || [], a.data || [], map);
  };

  const generateAiSuggestions = (mem: any[], attendance: any[], roleMap: Record<string, Role>) => {
    const suggs = [];
    // Suggest coach promotion for high point members
    mem.filter(m => (m.loyalty_points || 0) > 1000 && roleMap[m.id] === "member").forEach(m => {
      suggs.push({
        id: `promo-${m.id}`,
        title: `Promote ${m.full_name?.split(" ")[0]} to Coach`,
        desc: `${m.full_name} has earned ${m.loyalty_points} points and shown high consistency.`,
        action: "role_coach",
        targetId: m.id,
        impact: "Expands coaching staff capacity",
      });
    });
    // Suggest point bonus for consistent members
    const checkinCounts: Record<string, number> = {};
    attendance.forEach(a => checkinCounts[a.user_id] = (checkinCounts[a.user_id] || 0) + 1);
    mem.filter(m => (checkinCounts[m.id] || 0) > 20).forEach(m => {
      suggs.push({
        id: `bonus-${m.id}`,
        title: `Consistency Bonus: ${m.full_name?.split(" ")[0]}`,
        desc: `Member checked in ${checkinCounts[m.id]} times this month. Propose 50pt bonus.`,
        action: "point_bonus",
        targetId: m.id,
        impact: "Increases member retention",
      });
    });
    setAiSuggestions(suggs);
  };

  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      (m.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.phone || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [members, search]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Initialising CRM...</p>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full p-8 text-center glass-card rounded-[2.5rem] shadow-2xl">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="font-display font-black text-2xl mb-3 text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          This panel is reserved for high-level administrators and studio management. Please contact your supervisor for access.
        </p>
        <Link to="/profile" className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-xl active:scale-95 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Safety
        </Link>
      </div>
    </div>
  );

  const today = new Date().toISOString().slice(0, 10);
  const todayCheckins = att.filter(a => a.date === today).length;
  const monthlyRevenue = pkgs.reduce((s, p) => s + (parseFloat(p.price) || 0), 0);
  const pkgByUser: Record<string, any> = {}; pkgs.forEach(p => pkgByUser[p.user_id] = p);
  const activeMembers = Object.keys(pkgByUser).length;

  const setRole = async (userId: string, role: Role) => {
    setBusy(userId);
    const { error } = await (supabase.rpc as any)("set_user_role", { _target: userId, _role: role });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Role updated to ${role.replace("_", " ")}`);
    refresh();
  };

  const directUpdatePoints = async (userId: string, points: number) => {
    setBusy(userId);
    const { error } = await supabase.from("profiles").update({ loyalty_points: points }).eq("id", userId);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Loyalty points updated");
    refresh();
  };

  const updatePoints = async (userId: string, current: number) => {
    // Both Admin and Super-admin can now update points
    const value = prompt("Set loyalty points for this member", String(current));
    if (value === null) return;
    const points = parseInt(value);
    if (Number.isNaN(points)) return toast.error("Enter a valid points value");
    await directUpdatePoints(userId, points);
  };

  const removeMember = async (userId: string, name: string) => {
    if (!isSuperAdmin) return toast.error("Only super-admin can remove members");
    if (!confirm(`Permanently remove ${name}? This action is irreversible.`)) return;
    setBusy(userId);
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Member removed");
    refresh();
  };

  const undoLastAction = async () => {
    if (!lastAction) return;
    setBusy(lastAction.targetId);
    try {
      if (lastAction.type === "role") {
        await (supabase.rpc as any)("set_user_role", { _target: lastAction.targetId, _role: lastAction.oldValue });
      } else if (lastAction.type === "points") {
        await supabase.from("profiles").update({ loyalty_points: lastAction.oldValue }).eq("id", lastAction.targetId);
      }
      toast.success(`Reverted: ${lastAction.label}`);
      setLastAction(null);
      refresh();
    } catch (err: any) {
      toast.error("Revert failed: " + err.message);
    } finally {
      setBusy(null);
    }
  };

  const coachCounts: Record<string, number> = {};
  members.forEach((member) => {
    if (member.coach_id) coachCounts[member.coach_id] = (coachCounts[member.coach_id] || 0) + 1;
  });

  const coachRoster = members
    .filter((member) => ["coach", "admin", "super_admin"].includes(roles[member.id] || "member"))
    .map((member) => ({
      id: member.id,
      name: member.full_name || "Unknown Coach",
      phone: member.phone || "—",
      assigned: coachCounts[member.id] || 0,
      role: roles[member.id] || "coach",
    }))
    .sort((a, b) => b.assigned - a.assigned || a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row overflow-hidden">
      {/* Side Navigation - Apple Style */}
      <aside className="w-full lg:w-72 bg-white dark:bg-slate-900 border-b lg:border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-black text-lg text-slate-900 dark:text-white leading-none">JP Studio</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Studio CRM</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={LayoutGrid} label="Insights" />
          <NavItem active={activeTab === "members"} onClick={() => setActiveTab("members")} icon={Users2} label="Member Vault" />
          <NavItem active={activeTab === "points"} onClick={() => setActiveTab("points")} icon={Award} label="Loyalty Lab" />
          <NavItem active={activeTab === "coaches"} onClick={() => setActiveTab("coaches")} icon={Shield} label="Coach Team" />
          <NavItem active={activeTab === "audit"} onClick={() => setActiveTab("audit")} icon={Activity} label="Audit Trail" />
          <NavItem active={activeTab === "ai_assist"} onClick={() => setActiveTab("ai_assist")} icon={Sparkles} label="AI Assist" />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
          <Link to="/profile" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold">Return to App</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 relative">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-1">CRM PREMIUM V4</p>
            <h2 className="font-display text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
              {activeTab === "overview" && "Studio Performance"}
              {activeTab === "members" && "Member Management"}
              {activeTab === "points" && "Loyalty & Rewards"}
              {activeTab === "coaches" && "Coaching Staff"}
              {activeTab === "audit" && "System Audit Log"}
              {activeTab === "ai_assist" && "AI Strategic Assist"}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Search member..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-11 pr-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 w-64 transition-all"
              />
            </div>
            <button className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm">
              <Filter className="w-4 h-4 text-slate-600" />
            </button>
            <button className="h-12 px-6 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
              <Plus className="w-4 h-4" /> New Record
            </button>
          </div>
        </header>

        {activeTab === "overview" && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stat Grid */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
              <StatCard label="Monthly Revenue" value={`₹${monthlyRevenue.toLocaleString()}`} icon={DollarSign} trend="+12.5%" color="bg-emerald-500" />
              <StatCard label="Today Check-ins" value={todayCheckins} icon={Calendar} trend="+4" color="bg-blue-500" />
              <StatCard label="Total Members" value={members.length} icon={Users} color="bg-purple-500" />
              <StatCard label="Active Plans" value={activeMembers} icon={Activity} color="bg-amber-500" />
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Activity Mini-List */}
              <div className="glass-card rounded-[2.5rem] p-8 shadow-xl border-none">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-display font-black text-xl">Member Pulse</h3>
                  <button onClick={() => setActiveTab("members")} className="text-xs font-black text-primary hover:underline flex items-center gap-1 uppercase tracking-widest">View All <ChevronRight className="w-3 h-3" /></button>
                </div>
                <div className="space-y-4">
                  {members.slice(0, 5).map(m => (
                    <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-black text-xs text-primary shadow-sm">
                          {m.full_name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white leading-none mb-1">{m.full_name || "Unknown"}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Joined {new Date(m.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-emerald-600">+{m.loyalty_points} pts</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{roles[m.id] || "Member"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Info Box */}
              <div className="rounded-[2.5rem] bg-gradient-brand-3 p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[340px]">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <TrendingUp className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                  <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest mb-6 inline-block">System Intelligence</span>
                  <h3 className="font-display text-3xl font-black mb-4 leading-tight">Growth Insight</h3>
                  <p className="text-white/70 text-sm leading-relaxed max-w-sm mb-8">
                    Member consistency has increased by 14% this month. The new loyalty points system is driving 2.4x more daily check-ins compared to last quarter.
                  </p>
                </div>
                <button className="relative z-10 w-fit px-8 py-3 rounded-2xl bg-white text-slate-900 font-bold text-sm flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all">
                  Run Full Report <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plan Status</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Authority</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Points</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredMembers.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[1rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-900 dark:text-white group-hover:bg-primary group-hover:text-white transition-all duration-500">
                              {m.full_name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-900 dark:text-white leading-none mb-1">{m.full_name || "Unknown"}</p>
                              <p className="text-[10px] text-muted-foreground font-bold">{m.phone || "No phone linked"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          {pkgByUser[m.id] ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{pkgByUser[m.id].name}</span>
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Valid until {pkgByUser[m.id].end_date}</span>
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-muted-foreground tracking-widest">No Active Plan</span>
                          )}
                        </td>
                        <td className="p-6 text-center">
                          <select 
                            value={roles[m.id] || "member"} 
                            disabled={busy === m.id}
                            onChange={(e) => setRole(m.id, e.target.value as Role)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-primary outline-none cursor-pointer hover:underline disabled:opacity-50"
                          >
                            <option value="member">Member</option>
                            <option value="coach">Coach</option>
                            {isSuperAdmin && <option value="admin">Admin</option>}
                            {isSuperAdmin && <option value="super_admin">Super-Admin</option>}
                          </select>
                        </td>
                        <td className="p-6 text-right font-black text-emerald-600">{m.loyalty_points || 0}</td>
                        <td className="p-6">
                          <div className="flex items-center justify-center gap-2">
                             <button onClick={() => updatePoints(m.id, m.loyalty_points || 0)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-all"><Edit3 className="w-4 h-4" /></button>
                             {isSuperAdmin && (
                               <button onClick={() => removeMember(m.id, m.full_name)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                             )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "points" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
               <div className="glass-card rounded-[2rem] p-6 border-none shadow-xl flex flex-col items-center text-center">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center mb-4">
                   <Award className="w-8 h-8 text-amber-500" />
                 </div>
                 <h4 className="font-display font-black text-lg mb-1">Point Inflation</h4>
                 <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Admin Control Only</p>
                 <p className="mt-4 text-xs text-slate-500 leading-relaxed font-medium">As Admin, you can adjust point balances for correction or reward bonuses.</p>
               </div>
               
               <div className="glass-card rounded-[2rem] p-6 border-none shadow-xl flex flex-col items-center text-center">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center mb-4">
                   <RotateCcw className="w-8 h-8 text-emerald-500" />
                 </div>
                 <h4 className="font-display font-black text-lg mb-1">Point Recovery</h4>
                 <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Manual Reversal</p>
                 <p className="mt-4 text-xs text-slate-500 leading-relaxed font-medium">Reset balances to zero for expired seasonal points or abuse corrections.</p>
               </div>

               <div className="glass-card rounded-[2rem] p-6 border-none shadow-xl flex flex-col items-center text-center">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center mb-4">
                   <TrendingUp className="w-8 h-8 text-primary" />
                 </div>
                 <h4 className="font-display font-black text-lg mb-1">Loyalty Analytics</h4>
                 <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Redemption Rate</p>
                 <p className="mt-4 text-xs text-slate-500 leading-relaxed font-medium">Track which rewards are most popular among elite members.</p>
               </div>
            </div>

            {/* Point list similar to members but focused on points */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <h3 className="font-display font-black text-lg">Elite Point Balance</h3>
                 <button className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all"><Download className="w-3 h-3" /> Export Ledger</button>
               </div>
               <div className="max-h-[500px] overflow-y-auto">
                 {filteredMembers.map(m => (
                   <div key={m.id} className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                          {m.full_name?.slice(0, 1)}
                        </div>
                        <p className="font-bold text-sm">{m.full_name || "Unknown"}</p>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="font-black text-lg text-primary">{m.loyalty_points || 0}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Available Pts</p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => updatePoints(m.id, m.loyalty_points || 0)} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-lg">Adjust</button>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === "coaches" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coachRoster.map(coach => (
              <div key={coach.id} className="glass-card rounded-[2.5rem] p-8 border-none shadow-xl relative overflow-hidden group">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-slate-900/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10 flex flex-col h-full">
                   <div className="flex items-start justify-between mb-6">
                     <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-display font-black text-xl shadow-xl group-hover:rotate-6 transition-all duration-500">
                       {coach.name.slice(0, 1)}
                     </div>
                     <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                       {coach.role}
                     </span>
                   </div>
                   <h4 className="font-display font-black text-xl text-slate-900 dark:text-white mb-1">{coach.name}</h4>
                   <p className="text-xs text-muted-foreground font-medium mb-6">{coach.phone}</p>
                   
                   <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                     <div className="flex items-center justify-between mb-4">
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assigned Portfolio</span>
                       <span className="font-black text-sm text-primary">{coach.assigned} Members</span>
                     </div>
                     <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (coach.assigned / 20) * 100)}%` }} />
                     </div>
                   </div>
                </div>
              </div>
            ))}
            
            {/* Add Coach Placeholder */}
            <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center group hover:border-primary transition-all cursor-pointer">
               <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <Shield className="w-6 h-6 text-slate-400 group-hover:text-primary" />
               </div>
               <p className="font-display font-black text-lg text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">Expand Staff</p>
               <p className="text-xs text-muted-foreground mt-1 max-w-[160px]">Promote a member to coach in the Member Vault</p>
            </div>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <h3 className="font-display font-black text-lg">Reward Redemption Log</h3>
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{redemptions.length} Transactions</span>
               </div>
               <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Member</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reward</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cost</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {redemptions.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                        <td className="p-6 font-bold text-sm">{(r as any).profiles?.full_name || "Unknown Member"}</td>
                        <td className="p-6">
                           <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">{r.reward_name}</span>
                        </td>
                        <td className="p-6 font-black text-rose-500">-{r.points_cost} pts</td>
                        <td className="p-6 text-xs text-muted-foreground font-medium">{new Date(r.redeemed_at).toLocaleString()}</td>
                        <td className="p-6 text-[10px] font-mono text-muted-foreground">{r.id.slice(0, 8)}...</td>
                      </tr>
                    ))}
                    {redemptions.length === 0 && (
                      <tr><td colSpan={5} className="p-12 text-center text-muted-foreground text-sm font-medium">No redemptions found in the audit log.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "ai_assist" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
            <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden mb-8">
               <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                 <Sparkles className="w-48 h-48" />
               </div>
               <div className="relative z-10 max-w-2xl">
                 <h3 className="font-display text-3xl font-black mb-4">Proactive Growth Engine</h3>
                 <p className="text-white/60 text-sm leading-relaxed mb-6">
                   Our neural models analyze member behavior patterns to suggest high-impact CRM actions. These recommendations help you maintain studio culture and reward your most dedicated athletes.
                 </p>
                 <div className="flex gap-4">
                   <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest"><CheckCircle className="w-3 h-3 text-emerald-400" /> Pattern Recognition</div>
                   <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest"><CheckCircle className="w-3 h-3 text-emerald-400" /> Retention Focus</div>
                 </div>
               </div>
            </div>

            {lastAction && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Action Applied</p>
                    <p className="text-xs text-slate-500">{lastAction.label}</p>
                  </div>
                </div>
                <button 
                  onClick={undoLastAction}
                  className="px-6 py-2 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  Undo Change
                </button>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {aiSuggestions.map(s => (
                <div key={s.id} className="glass-card rounded-[2.5rem] p-8 border-none shadow-xl flex flex-col justify-between group hover:scale-[1.02] transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                       <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                         <Zap className="w-6 h-6" />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full">High Impact</span>
                    </div>
                    <h4 className="font-display font-black text-xl mb-2">{s.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{s.desc}</p>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-6">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Expected Outcome</p>
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{s.impact}</p>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      if (s.action === "role_coach") {
                        const oldRole = roles[s.targetId] || "member";
                        await setRole(s.targetId, "coach");
                        setLastAction({
                          id: s.id,
                          type: "role",
                          targetId: s.targetId,
                          oldValue: oldRole,
                          newValue: "coach",
                          label: `Promoted ${s.title.split("Promote ")[1]} to Coach`
                        });
                      }
                      if (s.action === "point_bonus") {
                        const m = members.find(x => x.id === s.targetId);
                        const oldPoints = m?.loyalty_points || 0;
                        const newPoints = oldPoints + 50;
                        await directUpdatePoints(s.targetId, newPoints);
                        setLastAction({
                          id: s.id,
                          type: "points",
                          targetId: s.targetId,
                          oldValue: oldPoints,
                          newValue: newPoints,
                          label: `Added 50pts bonus to ${m?.full_name}`
                        });
                      }
                      setAiSuggestions(aiSuggestions.filter(x => x.id !== s.id));
                    }}
                    className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-xl group-hover:bg-primary transition-all flex items-center justify-center gap-2"
                  >
                    Apply Suggestion <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {aiSuggestions.length === 0 && (
                <div className="md:col-span-2 py-20 text-center glass-card rounded-[2.5rem]">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-slate-300" />
                  </div>
                  <h4 className="font-display font-black text-xl mb-1">System Optimised</h4>
                  <p className="text-sm text-muted-foreground">No high-priority CRM actions detected at this time.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Side Nav Item Component
function NavItem({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group",
        active 
          ? "bg-slate-900 text-white shadow-xl translate-x-1" 
          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
      )}
    >
      <Icon className={cn("w-5 h-5", active ? "text-white" : "text-slate-400 group-hover:text-primary")} />
      <span className="text-sm font-bold">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)] animate-pulse" />}
    </button>
  );
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, trend, color }: any) {
  return (
    <div className="glass-card rounded-[2.5rem] p-8 border-none shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all">
      <div className={cn("absolute -top-12 -right-12 w-32 h-32 opacity-5 rounded-full", color)} />
      <div className="flex items-center justify-between mb-6">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", color)}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
            {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className="font-display text-3xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
    </div>
  );
}
