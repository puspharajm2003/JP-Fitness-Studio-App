import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, CreditCard, TrendingUp, Users, 
  ArrowUpRight, ArrowDownRight, Search, Filter,
  Calendar, Download, CheckCircle2, AlertCircle,
  PieChart as PieChartIcon, BarChart3, Briefcase, Wallet
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';

const GlassCard = ({ children, className }: any) => (
  <div className={cn(
    "relative overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl transition-all duration-500",
    className
  )}>
    {children}
  </div>
);

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [packagesRes, profilesRes] = await Promise.all([
        supabase.from("packages").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name")
      ]);

      if (packagesRes.error) throw packagesRes.error;

      const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
      const merged = (packagesRes.data || []).map(pkg => ({
        ...pkg,
        profiles: profileMap.get(pkg.user_id)
      }));

      setPayments(merged);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalRevenue = useMemo(() => 
    payments.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0)
  , [payments]);

  const activeSubscriptions = useMemo(() => 
    payments.filter(p => p.status === "active").length
  , [payments]);

  const chartData = useMemo(() => [
    { name: "Mon", rev: 1200 },
    { name: "Tue", rev: 2100 },
    { name: "Wed", rev: 1800 },
    { name: "Thu", rev: 2400 },
    { name: "Fri", rev: 3200 },
    { name: "Sat", rev: 2800 },
    { name: "Sun", rev: 3500 },
  ], []);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Revenue Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-inner">
                <Wallet className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Financial Ecosystem</p>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Revenue <span className="text-slate-300 dark:text-slate-700">Tracking</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             <button className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-105 transition-all">
                <Download className="w-5 h-5 text-slate-400" />
             </button>
             <button className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                <CreditCard className="w-4 h-4" /> New Transaction
             </button>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <MetricCard icon={DollarSign} label="Total Volume" value={`$${totalRevenue.toLocaleString()}`} trend="+14.2%" positive color="indigo" />
           <MetricCard icon={Users} label="Active Subs" value={activeSubscriptions} trend="+5.1%" positive color="emerald" />
           <MetricCard icon={TrendingUp} label="Avg. Order" value="$84.20" trend="-2.4%" positive={false} color="blue" />
           <MetricCard icon={Briefcase} label="LTV Forecast" value="$12.4k" trend="+8.9%" positive color="purple" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Revenue Velocity Chart */}
          <GlassCard className="lg:col-span-2 p-10">
             <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black flex items-center gap-3">
                   <BarChart3 className="w-6 h-6 text-indigo-500" />
                   Revenue Velocity
                </h2>
                <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest">
                   Current Month
                </div>
             </div>
             <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="rev" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </GlassCard>

          {/* Subscription Mix */}
          <GlassCard className="p-10 flex flex-col items-center justify-center text-center">
             <h3 className="text-xl font-black mb-2">Portfolio Mix</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Package Distribution</p>
             <div className="w-full h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Elite', value: 400, color: '#6366f1' },
                        { name: 'Standard', value: 300, color: '#3b82f6' },
                        { name: 'Basic', value: 300, color: '#10b981' },
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[0, 1, 2].map((_, i) => (
                        <Cell key={i} fill={['#6366f1', '#3b82f6', '#10b981'][i]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <p className="text-2xl font-black">74%</p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase">Retention</p>
                </div>
             </div>
             <div className="mt-8 flex gap-4 w-full justify-center">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500" /> <span className="text-[9px] font-black uppercase">Elite</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> <span className="text-[9px] font-black uppercase">Std</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-[9px] font-black uppercase">Bas</span></div>
             </div>
          </GlassCard>
        </div>

        {/* Transaction Ledger */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-4">
              <h2 className="text-2xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
                 <CreditCard className="w-6 h-6 text-indigo-500" />
                 Transaction Ledger
              </h2>
           </div>

           <GlassCard className="overflow-hidden border-none shadow-premium">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                          <th className="pl-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Merchant identity</th>
                          <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Service Plan</th>
                          <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Volume</th>
                          <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Auth Date</th>
                          <th className="pr-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                       {payments.map(p => (
                         <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all group">
                            <td className="pl-10 py-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center font-black text-xs">
                                     {p.profiles?.full_name?.slice(0, 1).toUpperCase()}
                                  </div>
                                  <div>
                                     <p className="font-bold text-sm text-slate-900 dark:text-white">{p.profiles?.full_name}</p>
                                     <p className="text-[10px] text-slate-400 font-medium">{p.profiles?.email}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="py-6 font-bold text-sm text-slate-700 dark:text-slate-300">{p.name || "Default Package"}</td>
                            <td className="py-6 font-black text-sm text-slate-900 dark:text-white">${p.price || "0.00"}</td>
                            <td className="py-6 text-xs font-bold text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                            <td className="pr-10 py-6 text-right">
                               <div className={cn(
                                 "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                 p.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                               )}>
                                 {p.status === "active" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                 {p.status}
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

function MetricCard({ icon: Icon, label, value, trend, positive, color }: any) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-500 shadow-indigo-500/20",
    emerald: "bg-emerald-500 shadow-emerald-500/20",
    blue: "bg-blue-500 shadow-blue-500/20",
    purple: "bg-purple-500 shadow-purple-500/20",
  };
  return (
    <div className="glass-card p-8 hover:translate-y-[-5px] transition-all duration-500 group">
       <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl mb-6 transform -rotate-6 group-hover:rotate-0 transition-transform", colors[color])}>
          <Icon className="w-7 h-7" />
       </div>
       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
       <div className="flex items-end gap-3">
          <p className="text-3xl font-black tracking-tight">{value}</p>
          <div className={cn(
            "px-2 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-1 mb-1.5",
            positive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
          )}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
       </div>
    </div>
  );
}
