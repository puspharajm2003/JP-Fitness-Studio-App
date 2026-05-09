import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { 
  Users, UserPlus, ClipboardCheck, DollarSign, TrendingUp, 
  AlertTriangle, Calendar, Activity, ArrowRight, Zap, Sparkles,
  Search, Filter, LayoutDashboard, Settings, RefreshCcw, ShieldCheck, 
  Lock, PieChart, BarChart3, Clock, Globe, Fingerprint
} from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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

const GlassCard = ({ children, className }: any) => (
  <div className={cn(
    "relative overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl transition-all duration-500",
    className
  )}>
    {children}
  </div>
);

export default function AdminCRM() {
  const { user } = useAuth();
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
      const [profilesRes, rolesRes, packagesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("packages").select("*").order("end_date", { ascending: false })
      ]);

      if (profilesRes.error) throw profilesRes.error;
      const roleMap = new Map(rolesRes.data?.map(r => [r.user_id, r.role]) || []);
      const pkgMap = new Map();
      (packagesRes.data || []).forEach(pkg => {
        if (!pkgMap.has(pkg.user_id)) pkgMap.set(pkg.user_id, pkg);
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
          role: (roleMap.get(p.id) as any) || "member",
          loyalty_points: p.loyalty_points || 0,
          package_status: pkg?.status || "none",
          package_end: pkg?.end_date,
        };
      });

      setMembers(memberList);
      setStats({
        total: memberList.length,
        active: memberList.filter(m => m.package_status === "active").length,
        expiring: memberList.filter(m => {
          if (m.package_status !== "active" || !m.package_end) return false;
          const end = new Date(m.package_end);
          return end <= sevenDays && end >= now;
        }).length,
        revenue: (packagesRes.data || []).filter(p => p.status === "active").reduce((sum, p) => sum + (p.price || 0), 0)
      });
      setLastSync(new Date());
    } catch (err: any) {
      toast.error("Sync error: " + err.message);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => { load(true); }, [load]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Superior Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live System Active
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Last Sync: {lastSync.toLocaleTimeString()}
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              CRM <span className="text-slate-300 dark:text-slate-700">Command</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             <button onClick={() => load(true)} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-105 transition-all">
               <RefreshCcw className={cn("w-5 h-5 text-slate-400", isSyncing && "animate-spin")} />
             </button>
             <Link to="/admin/setup" className="px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:translate-y-[-2px] active:translate-y-0 transition-all">
               <Settings className="w-4 h-4" /> Global Config
             </Link>
          </div>
        </div>

        {/* Intelligence Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <IntelligenceCard icon={Users} label="Total Assets" value={stats.total} color="blue" />
          <IntelligenceCard icon={Activity} label="Active Users" value={stats.active} color="emerald" />
          <IntelligenceCard icon={Clock} label="Renewal Risk" value={stats.expiring} color="amber" />
          <IntelligenceCard icon={DollarSign} label="Liquidity" value={`$${stats.revenue.toLocaleString()}`} color="indigo" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Module Command Center */}
          <GlassCard className="lg:col-span-2 p-10">
             <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <LayoutDashboard className="w-6 h-6 text-primary" />
                  Command Modules
                </h2>
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
               <CommandModule to="/admin/members" icon={UserPlus} label="Member Vault" color="blue" />
               <CommandModule to="/admin/attendance" icon={ClipboardCheck} label="Attendance" color="emerald" />
               <CommandModule to="/admin/payments" icon={DollarSign} label="Revenue" color="indigo" />
               <CommandModule to="/admin/analytics" icon={TrendingUp} label="Analytics" color="purple" />
               <CommandModule to="/admin/audit-logs" icon={ShieldCheck} label="Audit Trail" color="amber" />
               <CommandModule to="/admin/security" icon={Lock} label="Security" color="slate" />
               <CommandModule to="/admin/crm" icon={Globe} label="Geo Stats" color="sky" />
               <CommandModule to="/admin/setup" icon={Fingerprint} label="Bio-Auth" color="rose" />
             </div>
          </GlassCard>

          {/* Performance Summary */}
          <GlassCard className="p-10 bg-gradient-to-br from-slate-900 to-slate-950 text-white border-none">
             <h3 className="text-xl font-black mb-1">Growth Matrix</h3>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-10">Studio KPI Efficiency</p>
             
             <div className="space-y-8">
               <PerformanceMetric label="User Retention" value={94} color="bg-emerald-400" />
               <PerformanceMetric label="Revenue Flow" value={82} color="bg-blue-400" />
               <PerformanceMetric label="Active Engagement" value={67} color="bg-indigo-400" />
             </div>

             <div className="mt-12 p-6 rounded-3xl bg-white/5 border border-white/10 text-center backdrop-blur-md">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Network Health</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                  <span className="text-lg font-black text-emerald-400 tracking-tighter">ULTRA-STABLE</span>
                </div>
             </div>
          </GlassCard>
        </div>

        {/* Directory View */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
             <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
               <Users className="w-6 h-6 text-primary" />
               Live Directory
             </h2>
             <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input placeholder="Identify member..." className="pl-12 pr-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold w-64 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
             </div>
          </div>

          <GlassCard className="overflow-hidden border-none shadow-premium">
             {loading ? (
               <div className="py-24 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Decrypting Database...</p>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                       <th className="pl-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Identity</th>
                       <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Authority</th>
                       <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Loyalty Index</th>
                       <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Subscription Status</th>
                       <th className="pr-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Protocol</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {members.map(m => (
                       <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all group">
                         <td className="pl-10 py-6">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-slate-600 dark:text-slate-400 shadow-sm group-hover:scale-110 transition-all">
                               {m.full_name.slice(0, 1).toUpperCase()}
                             </div>
                             <div>
                               <p className="font-black text-slate-900 dark:text-white text-sm">{m.full_name}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{m.email}</p>
                             </div>
                           </div>
                         </td>
                         <td>
                           <div className={cn(
                             "inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                             m.role === "admin" ? "bg-rose-500/10 text-rose-600" :
                             m.role === "coach" ? "bg-indigo-500/10 text-indigo-600" :
                             "bg-slate-100 dark:bg-slate-800 text-slate-500"
                           )}>
                             {m.role}
                           </div>
                         </td>
                         <td>
                           <div className="flex items-center gap-2 font-black text-slate-700 dark:text-slate-300">
                             <Zap className="w-3.5 h-3.5 text-amber-500" />
                             {m.loyalty_points}
                           </div>
                         </td>
                         <td>
                           <div className={cn(
                             "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                             m.package_status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                           )}>
                             <div className={cn("w-1.5 h-1.5 rounded-full", m.package_status === "active" ? "bg-emerald-500" : "bg-slate-400")} />
                             {m.package_status}
                           </div>
                         </td>
                         <td className="pr-10 text-right">
                           <Link to={`/admin/members/${m.id}`} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white transition-all inline-block">
                             <ArrowRight className="w-4 h-4" />
                           </Link>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function IntelligenceCard({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    blue: "from-blue-500 to-indigo-600 shadow-blue-500/20",
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/20",
    amber: "from-amber-500 to-orange-600 shadow-amber-500/20",
    indigo: "from-indigo-600 to-purple-700 shadow-indigo-500/20",
  };
  return (
    <div className="glass-card p-8 group hover:translate-y-[-5px] transition-all duration-500">
       <div className={cn("w-16 h-16 rounded-[1.5rem] bg-gradient-to-br flex items-center justify-center text-white shadow-2xl mb-6 transform -rotate-3 group-hover:rotate-0 transition-transform", colors[color])}>
         <Icon className="w-8 h-8" />
       </div>
       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
       <p className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function CommandModule({ to, icon: Icon, label, color }: any) {
  const colors: any = {
    blue: "text-blue-500 bg-blue-500/5 hover:bg-blue-500 hover:text-white",
    emerald: "text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white",
    indigo: "text-indigo-500 bg-indigo-500/5 hover:bg-indigo-500 hover:text-white",
    purple: "text-purple-500 bg-purple-500/5 hover:bg-purple-500 hover:text-white",
    slate: "text-slate-500 bg-slate-500/5 hover:bg-slate-500 hover:text-white",
    amber: "text-amber-500 bg-amber-500/5 hover:bg-amber-500 hover:text-white",
    sky: "text-sky-500 bg-sky-500/5 hover:bg-sky-500 hover:text-white",
    rose: "text-rose-500 bg-rose-500/5 hover:bg-rose-500 hover:text-white",
  };
  return (
    <Link to={to} className={cn("flex flex-col items-center justify-center p-6 rounded-3xl transition-all duration-500 gap-3 border border-slate-100 dark:border-slate-800 shadow-sm", colors[color])}>
      <Icon className="w-7 h-7" />
      <span className="text-[9px] font-black uppercase tracking-widest text-center">{label}</span>
    </Link>
  );
}

function PerformanceMetric({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
        <span>{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
        <div className={cn("h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-1000", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
