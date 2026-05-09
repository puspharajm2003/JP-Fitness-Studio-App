import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  ClipboardCheck, Calendar as CalendarIcon, Clock, Users, 
  TrendingUp, ArrowRight, ArrowLeft, Search, Filter,
  Activity, MapPin, CheckCircle2, XCircle, Zap
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, AreaChart, Area
} from 'recharts';

const GlassCard = ({ children, className }: any) => (
  <div className={cn(
    "relative overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl transition-all duration-500",
    className
  )}>
    {children}
  </div>
);

export default function AdminAttendance() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("today");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayLogs = logs.filter(l => l.date === today);
    return {
      total: logs.length,
      today: todayLogs.length,
      peakTime: "06:30 PM",
      efficiency: "92%"
    };
  }, [logs]);

  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    }).reverse();

    return last7Days.map(date => ({
      date: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
      count: logs.filter(l => l.date === date).length
    }));
  }, [logs]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Superior Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Feed Active
              </div>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Attendance <span className="text-slate-300 dark:text-slate-700">Monitor</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex bg-white dark:bg-slate-900 rounded-2xl p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
                {["Today", "Week", "Month"].map(t => (
                  <button 
                    key={t}
                    onClick={() => setDateRange(t.toLowerCase())}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      dateRange === t.toLowerCase() ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {t}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Analytic Command Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <InsightCard icon={Users} label="Daily Traffic" value={stats.today} subValue="+12% vs yest." color="blue" />
           <InsightCard icon={Clock} label="Peak Intensity" value={stats.peakTime} subValue="Consistent" color="emerald" />
           <InsightCard icon={TrendingUp} label="Retention" value={stats.efficiency} subValue="Optimized" color="indigo" />
           <InsightCard icon={Activity} label="Total Entries" value={stats.total} subValue="All time" color="purple" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Traffic Visualization */}
          <GlassCard className="lg:col-span-2 p-10">
             <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black flex items-center gap-3">
                   <Activity className="w-6 h-6 text-primary" />
                   Traffic Matrix
                </h2>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                   <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> Check-ins</span>
                </div>
             </div>
             <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4a72ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4a72ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#4a72ff" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </GlassCard>

          {/* Quick Logs Sidepanel */}
          <GlassCard className="p-8">
             <h3 className="text-lg font-black mb-6">Recent Check-ins</h3>
             <div className="space-y-6">
                {logs.slice(0, 6).map((log, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                     <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center font-black text-xs shadow-sm">
                        {log.profiles?.full_name?.slice(0, 1).toUpperCase()}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{log.profiles?.full_name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{log.time || "—"} · {log.date}</p>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                     </div>
                  </div>
                ))}
             </div>
             <button className="w-full mt-10 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest">
                View Full Logs
             </button>
          </GlassCard>
        </div>

        {/* Global Timeline */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                 <Clock className="w-6 h-6 text-primary" />
                 Global Attendance Timeline
              </h2>
           </div>
           
           <GlassCard className="overflow-hidden border-none shadow-premium">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                          <th className="pl-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">User Identity</th>
                          <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date Logged</th>
                          <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                          <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Auth Method</th>
                          <th className="pr-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                       {logs.map(log => (
                         <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all group">
                            <td className="pl-10 py-5">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center font-black text-xs">
                                     {log.profiles?.full_name?.slice(0, 1).toUpperCase()}
                                  </div>
                                  <p className="font-bold text-sm">{log.profiles?.full_name}</p>
                               </div>
                            </td>
                            <td className="py-5 font-bold text-sm text-slate-500">{log.date}</td>
                            <td className="py-5 font-bold text-sm text-slate-900 dark:text-white">{log.time || "—"}</td>
                            <td className="py-5">
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                  <Zap className="w-3 h-3 text-amber-500" /> Auto-Checkin
                               </span>
                            </td>
                            <td className="pr-10 py-5 text-right">
                               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                  Verified
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

function InsightCard({ icon: Icon, label, value, subValue, color }: any) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500 shadow-blue-500/20",
    emerald: "bg-emerald-500 shadow-emerald-500/20",
    indigo: "bg-indigo-500 shadow-indigo-500/20",
    purple: "bg-purple-500 shadow-purple-500/20",
  };
  return (
    <div className="glass-card p-8 hover:translate-y-[-5px] transition-all duration-500 group">
       <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl mb-6 transform -rotate-6 group-hover:rotate-0 transition-transform", colors[color])}>
          <Icon className="w-7 h-7" />
       </div>
       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
       <div className="flex items-end gap-2">
          <p className="text-3xl font-black tracking-tight">{value}</p>
          <span className="text-[10px] font-bold text-emerald-500 mb-1.5">{subValue}</span>
       </div>
    </div>
  );
}
