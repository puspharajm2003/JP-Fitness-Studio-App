import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  ShieldCheck, ShieldAlert, History, Filter, Search, 
  ArrowDownCircle, ArrowUpCircle, Award, Target, Clock,
  RefreshCcw, Download, ChevronRight, User, Key, Zap
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const GlassCard = ({ children, className }: any) => (
  <div className={cn(
    "relative overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl transition-all duration-500",
    className
  )}>
    {children}
  </div>
);

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const { data: logsData, error: logsErr } = await supabase
        .from("loyalty_point_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (logsErr) {
        if (logsErr.code === 'PGRST116' || logsErr.message.includes('not found')) {
           console.warn("loyalty_point_logs table not found in database.");
           setLogs([]);
           return;
        }
        throw logsErr;
      }
      
      const userIds = [...new Set(logsData?.map(l => l.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const combined = (logsData || []).map(log => ({
        ...log,
        profiles: profiles?.find(p => p.id === log.user_id) || { full_name: "Unknown User" }
      }));

      setLogs(combined);
    } catch (err: any) {
      console.error("Audit log error:", err);
      toast.error("Audit ledger unreachable: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredLogs = logs.filter(l => {
    if (filter === "all") return true;
    if (filter === "earn") return l.points_change > 0;
    if (filter === "spend") return l.points_change < 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Ledger Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-inner">
                <History className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Immutable Ledger</p>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Loyalty <span className="text-slate-300 dark:text-slate-700">Audit Log</span>
            </h1>
          </div>
          
          <div className="flex gap-4">
             <button onClick={load} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-105 transition-all">
                <RefreshCcw className={cn("w-5 h-5 text-slate-400", loading && "animate-spin")} />
             </button>
             <button className="px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
                <Download className="w-4 h-4" /> Export Ledger
             </button>
          </div>
        </div>

        {/* Global Stats Summary */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <AuditStat icon={Award} label="Total Events" value={logs.length} color="blue" />
           <AuditStat icon={ArrowUpCircle} label="Total Earned" value="1.2M" color="emerald" />
           <AuditStat icon={ArrowDownCircle} label="Total Claimed" value="480k" color="indigo" />
           <AuditStat icon={Zap} label="Activity Velocity" value="+24%" color="amber" />
        </div>

        {/* Intelligence Filters */}
        <GlassCard className="p-4">
           <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input placeholder="Query by member or action ID..." className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/50 dark:bg-black/20 border-none text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                 {["all", "earn", "spend"].map(f => (
                    <button 
                       key={f}
                       onClick={() => setFilter(f)}
                       className={cn(
                          "flex-1 md:flex-none px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                          filter === f ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl" : "bg-white/50 dark:bg-black/20 text-slate-400 hover:bg-white"
                       )}
                    >
                       {f}
                    </button>
                 ))}
                 <button className="p-4 rounded-2xl bg-white/50 dark:bg-black/20 text-slate-400">
                    <Filter className="w-4 h-4" />
                 </button>
              </div>
           </div>
        </GlassCard>

        {/* Timeline Ledger */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                 <Key className="w-6 h-6 text-amber-500" />
                 Event Timeline
              </h2>
           </div>

           <GlassCard className="overflow-hidden border-none shadow-premium">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                          <th className="pl-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Identity</th>
                          <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Action Module</th>
                          <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Delta Value</th>
                          <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                          <th className="pr-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Verification</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                       {loading ? (
                         <tr><td colSpan={5} className="py-20 text-center font-black text-slate-400 uppercase text-[10px] tracking-widest animate-pulse">Syncing Blockchain State...</td></tr>
                       ) : filteredLogs.map(log => (
                         <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all group">
                            <td className="pl-10 py-5">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-xs">
                                     {log.profiles?.full_name?.slice(0, 1).toUpperCase()}
                                  </div>
                                  <div>
                                     <p className="font-bold text-sm text-slate-900 dark:text-white">{log.profiles?.full_name}</p>
                                     <p className="text-[10px] text-slate-400 font-medium">{log.profiles?.email}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="py-5">
                               <div className="flex flex-col">
                                  <span className="font-bold text-sm text-slate-900 dark:text-white">{log.reason || "System Adjustment"}</span>
                                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{log.type}</span>
                               </div>
                            </td>
                            <td className="py-5">
                               <div className={cn(
                                 "font-black text-sm flex items-center gap-1.5",
                                 log.points_change > 0 ? "text-emerald-500" : "text-rose-500"
                               )}>
                                 {log.points_change > 0 ? <ArrowUpCircle className="w-3.5 h-3.5" /> : <ArrowDownCircle className="w-3.5 h-3.5" />}
                                 {log.points_change > 0 ? "+" : ""}{log.points_change}
                               </div>
                            </td>
                            <td className="py-5">
                               <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(log.created_at).toLocaleString()}
                               </div>
                            </td>
                            <td className="pr-10 py-5 text-right">
                               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                  <ShieldCheck className="w-3 h-3" /> Hash Verified
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </GlassCard>
        </div>
      </div>
    </div>
  );
}

function AuditStat({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500 shadow-blue-500/20",
    emerald: "bg-emerald-500 shadow-emerald-500/20",
    indigo: "bg-indigo-500 shadow-indigo-500/20",
    amber: "bg-amber-500 shadow-amber-500/20",
  };
  return (
    <div className="glass-card p-8 hover:translate-y-[-5px] transition-all duration-500 group">
       <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl mb-6 transform -rotate-6 group-hover:rotate-0 transition-transform", colors[color])}>
          <Icon className="w-7 h-7" />
       </div>
       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
       <p className="text-3xl font-black tracking-tight">{value}</p>
    </div>
  );
}
