import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { 
  Users, UserPlus, ClipboardCheck, DollarSign, TrendingUp, 
  AlertTriangle, Calendar, Activity, ArrowRight, Zap, Sparkles,
  Search, Filter, LayoutDashboard, Settings, RefreshCcw
} from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Member {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "member" | "coach" | "admin";
  loyalty_points: number;
  package_status?: string;
  package_end?: string;
}

const SYNC_INTERVAL = 15000; // 15s polling for main CRM view

export default function AdminCRM() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiring: 0,
    revenue: 0,
  });

  const load = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setIsSyncing(true);
    try {
      // Fetch all users with their profiles and roles
      const [profilesRes, rolesRes, packagesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("packages").select("*").order("end_date", { ascending: false })
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const roleMap = new Map(rolesRes.data?.map(r => [r.user_id, r.role]) || []);
      
      // Group packages by user_id and take the latest one
      const pkgMap = new Map();
      (packagesRes.data || []).forEach(pkg => {
        if (!pkgMap.has(pkg.user_id)) {
          pkgMap.set(pkg.user_id, pkg);
        }
      });

      const now = new Date();
      const sevenDays = new Date(now.getTime() + 7 * 864e5);

      const memberList = (profilesRes.data || []).map(p => {
        const pkg = pkgMap.get(p.id);
        return {
          id: p.id,
          email: (p as any).email || "",
          full_name: p.full_name || "Unknown",
          phone: p.phone || "",
          role: (roleMap.get(p.id) as "member" | "coach" | "admin") || "member",
          loyalty_points: p.loyalty_points || 0,
          package_status: pkg?.status || "none",
          package_end: pkg?.end_date,
        };
      });

      const active = memberList.filter(m => m.package_status === "active").length;
      const expiring = memberList.filter(m => {
        if (m.package_status !== "active" || !m.package_end) return false;
        const end = new Date(m.package_end);
        return end <= sevenDays && end >= now;
      }).length;
      const revenue = (packagesRes.data || [])
        .filter(p => p.status === "active")
        .reduce((sum, p) => sum + (p.price || 0), 0);

      setMembers(memberList);
      setStats({ total: memberList.length, active, expiring, revenue });
      setLastSync(new Date());
    } catch (err: any) {
      console.error("CRM Main Sync Error:", err);
      toast.error("Live sync failed: " + err.message);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => { 
    load(true);
    const id = setInterval(() => load(false), SYNC_INTERVAL);
    return () => clearInterval(id);
  }, [load]);

  const assignRole = async (userId: string, role: "member" | "coach" | "admin") => {
    try {
      await supabase.from("user_roles").upsert({ user_id: userId, role });
      toast.success(`Role updated to ${role}`);
      load(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Header with Live Status */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Live CRM Interface</span>
             {isSyncing && <RefreshCcw className="w-3 h-3 text-primary animate-spin" />}
           </div>
           <h2 className="font-display text-4xl lg:text-5xl font-black tracking-tight">CRM <span className="text-muted-foreground/30 font-normal">Command</span></h2>
           <p className="text-xs text-muted-foreground font-medium mt-1">Last data refresh: {lastSync.toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => load(true)} className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-all">
            <RefreshCcw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
          </button>
          <Link to="/admin/crm" className="px-5 py-2.5 rounded-xl bg-gradient-brand text-primary-foreground font-bold text-sm shadow-brand flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" /> Advanced Dashboard
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardUltra icon={Users} label="Total Members" value={stats.total} color="blue" trend="+12.5%" />
        <StatCardUltra icon={Activity} label="Active Members" value={stats.active} color="emerald" trend="+5.2%" />
        <StatCardUltra icon={AlertTriangle} label="Expiring Soon" value={stats.expiring} color="amber" trend="-3" />
        <StatCardUltra icon={DollarSign} label="Active Revenue" value={`$${stats.revenue}`} color="indigo" trend="+8.1%" />
      </div>

      {/* Quick Actions & Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-card rounded-[32px] p-8 border-none shadow-premium relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
          <h3 className="font-display font-black text-2xl mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" /> Management Modules
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <AdminModuleLink to="/admin/members" icon={UserPlus} label="Add Member" color="blue" />
            <AdminModuleLink to="/admin/attendance" icon={ClipboardCheck} label="Attendance" color="emerald" />
            <AdminModuleLink to="/admin/payments" icon={DollarSign} label="Payments" color="indigo" />
            <AdminModuleLink to="/admin/analytics" icon={TrendingUp} label="Analytics" color="purple" />
            <AdminModuleLink to="/admin/setup" icon={Settings} label="System Setup" color="slate" />
            <AdminModuleLink to="/admin/crm" icon={Sparkles} label="Ultra Panel" color="amber" />
          </div>
        </div>

        <div className="glass-card rounded-[32px] p-8 border-none shadow-premium bg-gradient-to-br from-slate-900 to-slate-950 text-white">
          <h3 className="font-display font-black text-2xl mb-2">Member Health</h3>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-8">Performance Insights</p>
          
          <div className="space-y-6">
            <HealthMetric label="Attendance" value={78} color="bg-blue-400" />
            <HealthMetric label="Retention" value={92} color="bg-emerald-400" />
            <HealthMetric label="Renewals" value={64} color="bg-amber-400" />
          </div>

          <div className="mt-10 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Global Status</p>
            <p className="text-lg font-display font-black text-emerald-400">OPTIMIZED</p>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="glass-card rounded-[32px] p-8 border-none shadow-premium bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="font-display font-black text-2xl">Member Directory</h3>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Database Real-time View</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input placeholder="Search directory..." className="pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-xs font-bold w-48 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <button className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <Filter className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="w-12 h-12 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
             <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Directory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="pl-8 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Name & Identity</th>
                  <th className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Role Authority</th>
                  <th className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Loyalty</th>
                  <th className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Plan Status</th>
                  <th className="pr-8 text-right text-[10px] font-black uppercase text-muted-foreground tracking-widest">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {members.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="pl-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-soft flex items-center justify-center font-black text-primary text-xs shadow-sm">
                          {m.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm leading-none mb-1">{m.full_name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={m.role}
                        onChange={(e) => assignRole(m.id, e.target.value as "member" | "coach" | "admin")}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-[11px] font-bold outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="member">Member</option>
                        <option value="coach">Coach</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 font-bold text-sm">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {m.loyalty_points}
                      </div>
                    </td>
                    <td>
                      <Badge className={cn(
                        "rounded-lg px-2.5 py-1 text-[9px] font-black border-none uppercase tracking-wider",
                        m.package_status === "active" ? "bg-emerald-500/10 text-emerald-600" :
                        m.package_status === "expired" ? "bg-rose-500/10 text-rose-600" :
                        "bg-slate-100 text-slate-500"
                      )}>
                        {m.package_status}
                      </Badge>
                    </td>
                    <td className="pr-8 text-right">
                      <Link to={`/admin/members/${m.id}`} className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 inline-block transition-all">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCardUltra({ icon: Icon, label, value, color, trend }: any) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    indigo: "bg-indigo-500",
  };
  return (
    <div className="glass-card rounded-[32px] p-6 border-none shadow-premium group hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform duration-500", colors[color])}>
          <Icon className="w-7 h-7" />
        </div>
        <div className={cn(
          "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
          trend.includes("+") ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
        )}>
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">{label}</p>
      <p className="font-display text-4xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function AdminModuleLink({ to, icon: Icon, label, color }: any) {
  const colors: any = {
    blue: "text-blue-500 bg-blue-500/5 hover:bg-blue-500 hover:text-white",
    emerald: "text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white",
    indigo: "text-indigo-500 bg-indigo-500/5 hover:bg-indigo-500 hover:text-white",
    purple: "text-purple-500 bg-purple-500/5 hover:bg-purple-500 hover:text-white",
    slate: "text-slate-500 bg-slate-500/5 hover:bg-slate-500 hover:text-white",
    amber: "text-amber-500 bg-amber-500/5 hover:bg-amber-500 hover:text-white",
  };
  return (
    <Link to={to} className={cn("flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 gap-2 border border-slate-50 dark:border-slate-800/50", colors[color])}>
      <Icon className="w-6 h-6" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </Link>
  );
}

function HealthMetric({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
