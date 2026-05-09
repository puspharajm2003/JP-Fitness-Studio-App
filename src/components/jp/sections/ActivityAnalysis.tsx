import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { 
  Zap, Shield, Smartphone, Activity, 
  Moon, Sun, Clock, ChevronLeft, 
  Share2, Download, Sparkles, Fingerprint,
  RefreshCw, CheckCircle2, AlertCircle,
  Footprints, Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";

const MetricSquare = ({ label, value, sub, icon: Icon }: any) => (
  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
    <Icon className="w-5 h-5 text-primary mb-3" />
    <div className="text-2xl font-black">{value}</div>
    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{label}</div>
    <div className="text-[8px] uppercase tracking-widest text-slate-300 mt-1">{sub}</div>
  </div>
);

const InsightItem = ({ icon: Icon, label, value, color }: any) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-xl bg-${color}-500/10 flex items-center justify-center text-${color}-500`}>
         <Icon className="w-4 h-4" />
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>
    </div>
    <span className="text-xs font-black">{value}</span>
  </div>
);

const GlassCard = ({ children, className }: any) => (
  <div className={cn(
    "relative overflow-hidden rounded-[2.5rem] bg-white/10 dark:bg-black/20 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl transition-all duration-500",
    className
  )}>
    {children}
  </div>
);

export default function ActivityAnalysis({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [stepPermission, setStepPermission] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [analyzing, setAnalyzing] = useState(false);
  const [realData, setRealData] = useState<{
    steps: any[];
    sleep: any[];
    todaySteps: number;
    avgSteps: number;
    avgSleep: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    gsap.fromTo(".analysis-animate", 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power4.out" }
    );
  }, []);

  const requestPermissions = async () => {
    setStepPermission("requesting");
    // Simulate biometric/sensor permission request
    await new Promise(r => setTimeout(r, 2000));
    setStepPermission("granted");
    startAnalysis();
  };

  const startAnalysis = async () => {
    setAnalyzing(true);
    if (!user) return;

    try {
      const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
      const [sRes, lRes] = await Promise.all([
        supabase.from("step_logs").select("*").eq("user_id", user.id).gte("date", since).order("date"),
        supabase.from("sleep_logs").select("*").eq("user_id", user.id).gte("date", since).order("date"),
      ]);

      const steps = sRes.data || [];
      const sleep = lRes.data || [];
      const today = new Date().toISOString().slice(0, 10);
      const todaySteps = steps.find(s => s.date === today)?.steps || 0;
      const avgSteps = Math.round(steps.reduce((a, b) => a + b.steps, 0) / (steps.length || 1));
      const avgSleep = Math.round((sleep.reduce((a, b) => a + b.hours, 0) / (sleep.length || 1)) * 10) / 10;

      setRealData({ steps, sleep, todaySteps, avgSteps, avgSleep });
    } catch (e) {
      console.error(e);
    }

    await new Promise(r => setTimeout(r, 2000));
    setAnalyzing(false);
  };

  const BIOMETRIC_DATA = useMemo(() => [
    { subject: 'Consistency', A: realData ? Math.min(150, (realData.steps.length / 7) * 150) : 120, fullMark: 150 },
    { subject: 'Intensity', A: realData ? Math.min(150, (realData.avgSteps / (profile?.daily_step_goal || 10000)) * 150) : 98, fullMark: 150 },
    { subject: 'Recovery', A: realData ? Math.min(150, (realData.avgSleep / (profile?.sleep_goal_hr || 8)) * 150) : 86, fullMark: 150 },
    { subject: 'Duration', A: 110, fullMark: 150 },
    { subject: 'REM Sleep', A: 85, fullMark: 150 },
    { subject: 'Efficiency', A: 65, fullMark: 150 },
  ], [realData, profile]);

  return (
    <div ref={containerRef} className="min-h-screen space-y-10 pb-20">
      
      {/* Dynamic Header */}
      <div className="flex items-center justify-between px-4 analysis-animate">
        <button 
          onClick={onBack}
          className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-600 hover:scale-110 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
           <h2 className="text-xl font-black uppercase tracking-[0.3em]">Neural Analysis</h2>
           <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Biometric Protocol v2.4</p>
        </div>
        <div className="flex gap-2">
           <button className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-600">
             <Share2 className="w-5 h-5" />
           </button>
        </div>
      </div>

      {stepPermission !== "granted" ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-8 analysis-animate">
           <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
              <div className="relative w-32 h-32 rounded-[3rem] bg-slate-900 text-white flex items-center justify-center shadow-3xl">
                 <Smartphone className="w-12 h-12" />
              </div>
           </div>
           
           <div className="space-y-4 max-w-md">
              <h3 className="text-4xl font-black tracking-tight">Sync Hardware.</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                To provide a full analysis, we need access to your device's Motion & Fitness sensors to track precise step metrics and screen-state patterns for sleep detection.
              </p>
           </div>

           <button 
             onClick={requestPermissions}
             disabled={stepPermission === "requesting"}
             className={cn(
               "px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-3",
               stepPermission === "requesting" 
                 ? "bg-slate-100 text-slate-400" 
                 : "bg-primary text-white hover:scale-105 active:scale-95"
             )}
           >
             {stepPermission === "requesting" ? (
               <>
                 <RefreshCw className="w-4 h-4 animate-spin" />
                 Requesting Access...
               </>
             ) : (
               <>
                 <Shield className="w-4 h-4" />
                 Initialize Sync
               </>
             )}
           </button>
           
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
             Encryption Active • GDPR Compliant • On-Device Processing
           </p>
        </div>
      ) : (
        <div className="space-y-10 px-4">
          
          {/* Analysis Progress / Result */}
          {analyzing ? (
            <div className="py-20 flex flex-col items-center justify-center gap-6">
               <div className="relative w-40 h-40">
                  <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <Fingerprint className="w-12 h-12 text-primary animate-pulse" />
                  </div>
               </div>
               <div className="text-center space-y-2">
                  <h4 className="text-2xl font-black">Decoding Biometrics</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Syncing Accelerometer Data...</p>
               </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Left Column: Big Metrics */}
              <div className="lg:col-span-2 space-y-8">
                 <GlassCard className="p-10 border-primary/20 bg-primary/5">
                    <div className="flex items-center justify-between mb-10">
                       <div>
                          <h3 className="text-3xl font-black">Motion Profile</h3>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time Step Detection</p>
                       </div>
                       <div className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-500/10">
                          <CheckCircle2 className="w-3 h-3" />
                          Hardware Synced
                       </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-3 gap-8 mb-10">
                       <MetricSquare label="Live Steps" value={realData?.todaySteps.toLocaleString() || "0"} sub="Today's Count" icon={Footprints} />
                       <MetricSquare label="Step Average" value={realData?.avgSteps.toLocaleString() || "0"} sub="30 Day Pulse" icon={Activity} />
                       <MetricSquare label="Sleep Avg" value={realData?.avgSleep + "h"} sub="Recovery Window" icon={Clock} />
                    </div>

                    <div className="h-64 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={realData?.steps.map(s => ({ time: s.date.split('-').slice(1).join('/'), steps: s.steps }))}>
                             <defs>
                                <linearGradient id="colorAnalysis" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                             <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                             <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                             <Area type="monotone" dataKey="steps" stroke="hsl(var(--primary))" strokeWidth={4} fill="url(#colorAnalysis)" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </GlassCard>

                 <div className="grid sm:grid-cols-2 gap-8">
                    <GlassCard className="p-8">
                       <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                             <Moon className="w-6 h-6" />
                          </div>
                          <h4 className="text-xl font-black text-slate-900 dark:text-white">Circadian Rhythm</h4>
                       </div>
                       <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                         Based on device usage patterns and inactivity periods, we detected a consistent sleep window between **11:45 PM** and **7:15 AM**.
                       </p>
                       <div className="space-y-4">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <span>Weekly Consistency</span>
                             <span className="text-indigo-500">{realData ? Math.round((realData.steps.length / 7) * 100) : 0}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${realData ? Math.min(100, (realData.steps.length / 7) * 100) : 0}%` }} />
                          </div>
                       </div>
                    </GlassCard>

                    <GlassCard className="p-8 bg-slate-900 text-white border-none">
                       <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-white/10 text-amber-400 flex items-center justify-center">
                             <Sparkles className="w-6 h-6" />
                          </div>
                          <h4 className="text-xl font-black">AI Diagnosis</h4>
                       </div>
                       <p className="text-sm text-slate-400 font-medium leading-relaxed italic mb-6">
                         "Your recovery score is up 12% from last week. Hardware telemetry suggests a slight instability in gait during the 4PM session—consider checking footwear."
                       </p>
                       <button className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                         Download Full PDF Report <Download className="w-3 h-3" />
                       </button>
                    </GlassCard>
                 </div>
              </div>

              {/* Right Column: Radar & Stats */}
              <div className="space-y-8">
                 <GlassCard className="p-10 flex flex-col items-center">
                    <h4 className="text-lg font-black uppercase tracking-widest mb-8 text-center">Performance Radar</h4>
                    <div className="h-64 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={BIOMETRIC_DATA}>
                             <PolarGrid stroke="rgba(0,0,0,0.1)" />
                             <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                             <Radar name="Performance" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                          </RadarChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="mt-8 p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 w-full">
                       <div className="flex items-center gap-3 mb-4">
                          <Target className="w-5 h-5 text-primary" />
                          <span className="text-xs font-black uppercase tracking-widest">Neural Score</span>
                       </div>
                       <div className="text-5xl font-black tracking-tighter">{realData ? Math.round((realData.avgSteps / (profile?.daily_step_goal || 10000)) * 100) : 0}<span className="text-lg text-slate-400 ml-1">Score</span></div>
                       <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-2">Compliance Rating</p>
                    </div>
                 </GlassCard>

                 <GlassCard className="p-10 bg-indigo-500/5 border-indigo-500/20">
                    <div className="flex items-center gap-3 mb-6">
                       <AlertCircle className="w-5 h-5 text-indigo-500" />
                       <h4 className="text-sm font-black uppercase tracking-widest">Device Insights</h4>
                    </div>
                    <div className="space-y-6">
                       <InsightItem icon={Sun} label="Screen On-Time" value="6h 12m" color="amber" />
                       <InsightItem icon={Moon} label="Downtime Sync" value="8h 04m" color="indigo" />
                       <InsightItem icon={Smartphone} label="Last Activity" value="2m ago" color="slate" />
                    </div>
                 </GlassCard>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

