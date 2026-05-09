import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, Users, Activity, Target, 
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Calendar, Zap, Sparkles, ArrowUpRight, ArrowDownRight,
  MousePointer2, UserCheck, Heart, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, AreaChart, Area, LineChart, Line, ScatterChart, Scatter
} from 'recharts';

const GlassCard = ({ children, className }: any) => (
  <div className={cn(
    "relative overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl transition-all duration-500",
    className
  )}>
    {children}
  </div>
);

export default function AdminAnalytics() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const growthData = useMemo(() => [
    { name: 'Jan', members: 45, rev: 1200 },
    { name: 'Feb', members: 52, rev: 1500 },
    { name: 'Mar', members: 61, rev: 2100 },
    { name: 'Apr', members: 58, rev: 1800 },
    { name: 'May', members: 72, rev: 2800 },
    { name: 'Jun', members: 85, rev: 3500 },
    { name: 'Jul', members: 94, rev: 4200 },
  ], []);

  const demographicData = useMemo(() => [
    { name: 'Male', value: 45, color: '#4a72ff' },
    { name: 'Female', value: 55, color: '#ec4899' },
  ], []);

  const retentionData = useMemo(() => [
    { day: 1, rate: 100 },
    { day: 7, rate: 85 },
    { day: 14, rate: 72 },
    { day: 30, rate: 65 },
    { day: 60, rate: 58 },
    { day: 90, rate: 52 },
  ], []);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Analytics Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 shadow-inner">
                <BarChart3 className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Core Intelligence</p>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Analytics <span className="text-slate-300 dark:text-slate-700">Core</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex bg-white dark:bg-slate-900 rounded-2xl p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
                <button className="px-6 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-lg transition-all">Real-time</button>
                <button className="px-6 py-2.5 rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-all">Historical</button>
             </div>
             <button className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-105 transition-all">
                <Calendar className="w-5 h-5 text-slate-400" />
             </button>
          </div>
        </div>

        {/* Vital KPIs */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <KPIBadge icon={Users} label="Total Reach" value="2.4k" trend="+18%" positive color="purple" />
           <KPIBadge icon={MousePointer2} label="Conversion" value="3.8%" trend="+0.5%" positive color="blue" />
           <KPIBadge icon={UserCheck} label="Active Ratio" value="74%" trend="-2.1%" positive={false} color="emerald" />
           <KPIBadge icon={Flame} label="Churn Rate" value="4.2%" trend="-0.8%" positive color="rose" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
           {/* Growth Velocity */}
           <GlassCard className="lg:col-span-2 p-10">
              <div className="flex items-center justify-between mb-10">
                 <h2 className="text-2xl font-black flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-purple-500" />
                    Growth Velocity
                 </h2>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" /> <span className="text-[9px] font-black text-slate-400 uppercase">Members</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> <span className="text-[9px] font-black text-slate-400 uppercase">Revenue</span></div>
                 </div>
              </div>
              <div className="h-80">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={growthData}>
                     <defs>
                       <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                         <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                     <Tooltip 
                       contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                       itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                     />
                     <Area type="monotone" dataKey="members" stroke="#a855f7" strokeWidth={4} fillOpacity={1} fill="url(#colorMembers)" />
                     <Area type="monotone" dataKey="rev" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                   </AreaChart>
                 </ResponsiveContainer>
              </div>
           </GlassCard>

           {/* Retention Curve */}
           <GlassCard className="p-10 flex flex-col items-center justify-center text-center">
              <h3 className="text-xl font-black mb-2">Retention Curve</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10">User Lifecycle Decay</p>
              <div className="w-full h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={retentionData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                       <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                       <Tooltip 
                          contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                       />
                       <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 8 }} />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
              <div className="mt-8 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
                 High Stability Zone: Days 30-90
              </div>
           </GlassCard>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
           {/* Demographics */}
           <GlassCard className="p-10">
              <h3 className="text-xl font-black mb-10 flex items-center gap-3">
                 <PieChartIcon className="w-6 h-6 text-indigo-500" />
                 Demographics
              </h3>
              <div className="flex items-center justify-between gap-6">
                 <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {demographicData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="space-y-4 flex-1">
                    {demographicData.map(d => (
                       <div key={d.name} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                             <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} /> {d.name}</span>
                             <span>{d.value}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                             <div className="h-full rounded-full" style={{ width: `${d.value}%`, backgroundColor: d.color }} />
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </GlassCard>

           {/* Engagement Clusters */}
           <GlassCard className="lg:col-span-2 p-10">
              <h3 className="text-xl font-black mb-10 flex items-center gap-3">
                 <Sparkles className="w-6 h-6 text-amber-500" />
                 Engagement Clusters
              </h3>
              <div className="h-64 flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                       <XAxis type="number" dataKey="x" name="Visits" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                       <YAxis type="number" dataKey="y" name="Loyalty" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                       <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '20px' }} />
                       <Scatter 
                          name="Users" 
                          data={[
                             { x: 2, y: 100 }, { x: 5, y: 240 }, { x: 8, y: 350 }, { x: 12, y: 480 },
                             { x: 15, y: 520 }, { x: 18, y: 610 }, { x: 22, y: 750 }, { x: 25, y: 890 },
                             { x: 3, y: 80 }, { x: 7, y: 150 }, { x: 10, y: 300 }, { x: 14, y: 420 },
                          ]} 
                          fill="#4a72ff" 
                       />
                    </ScatterChart>
                 </ResponsiveContainer>
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center mt-6">Frequency vs Loyalty Correlation</p>
           </GlassCard>
        </div>
      </div>
    </div>
  );
}

function KPIBadge({ icon: Icon, label, value, trend, positive, color }: any) {
  const colors: Record<string, string> = {
    purple: "bg-purple-500 shadow-purple-500/20",
    blue: "bg-blue-500 shadow-blue-500/20",
    emerald: "bg-emerald-500 shadow-emerald-500/20",
    rose: "bg-rose-500 shadow-rose-500/20",
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
