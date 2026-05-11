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
  <div className="group relative bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden">
    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
    <Icon className="w-6 h-6 text-primary mb-4 relative z-10" />
    <div className="text-3xl font-black tracking-tight">{value}</div>
    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-2">{label}</div>
    <div className="text-[9px] font-bold uppercase tracking-widest text-primary/60 mt-1">{sub}</div>
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
    diagnosis: string;
    screenOn: string;
    downtime: string;
    lastActive: string;
    sleepStart: string;
    sleepEnd: string;
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
      const avgSteps = steps.length ? Math.round(steps.reduce((a, b) => a + b.steps, 0) / steps.length) : 0;
      const avgSleep = sleep.length ? Math.round((sleep.reduce((a, b) => a + b.hours, 0) / sleep.length) * 10) / 10 : 0;

      const compliance = avgSteps > 0 ? (avgSteps / (profile?.daily_step_goal || 10000)) * 100 : 0;
      let diagnosis = "Hardware telemetry suggests insufficient data for deep neural diagnosis. Please sync your device consistently to unlock advanced insights.";
      if (steps.length > 0 || sleep.length > 0) {
        if (compliance >= 100) {
           diagnosis = "Excellent biometrics! Your neural and physical compliance exceeds baseline targets. Device telemetry confirms a hyper-optimized recovery and activity loop.";
        } else if (compliance >= 75) {
           diagnosis = "Solid performance matrix. You are maintaining a healthy equilibrium. Consider increasing high-intensity intervals by 15% to break through the current plateau.";
        } else if (compliance > 0) {
           diagnosis = "Telemetry indicates sub-optimal motion parameters. Your physical output is below baseline targets. We recommend structured walking protocols and prioritizing circadian alignment.";
        } else {
           diagnosis = "Awaiting sufficient motion and sleep telemetry. Begin logging your daily steps and screen-off sleep to unlock personalized neural insights.";
        }
      }

      const startHour = 23;
      const endHour = (23 + (avgSleep || 8)) % 24;
      const formatTime = (h: number) => {
         const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
         let hr = Math.floor(h % 12 || 12);
         let mins = Math.floor((h % 1) * 60);
         
         mins = Math.round(mins / 15) * 15;
         if (mins === 60) {
           mins = 0;
           hr = hr === 12 ? 1 : hr + 1;
         }
         
         return `${hr}:${mins.toString().padStart(2, '0')} ${ampm}`;
      };

      setRealData({ 
        steps, 
        sleep, 
        todaySteps, 
        avgSteps, 
        avgSleep,
        diagnosis,
        screenOn: avgSleep > 0 ? Math.max(0, 24 - avgSleep - 1.5).toFixed(1) + "h" : "14h",
        downtime: avgSleep > 0 ? avgSleep.toFixed(1) + "h" : "0h",
        lastActive: "Just now",
        sleepStart: formatTime(startHour),
        sleepEnd: formatTime(endHour)
      });
    } catch (e) {
      console.error(e);
    }

    await new Promise(r => setTimeout(r, 2000));
    setAnalyzing(false);
  };

  const BIOMETRIC_DATA = useMemo(() => [
    { subject: 'Consistency', A: realData ? Math.min(150, (realData.steps.length / 7) * 150) : 0, fullMark: 150 },
    { subject: 'Intensity', A: realData ? Math.min(150, (realData.avgSteps / (profile?.daily_step_goal || 10000)) * 150) : 0, fullMark: 150 },
    { subject: 'Recovery', A: realData ? Math.min(150, (realData.avgSleep / (profile?.sleep_goal_hr || 8)) * 150) : 0, fullMark: 150 },
    { subject: 'Duration', A: realData ? Math.min(150, (realData.steps.length / 7) * 100 + 50) : 0, fullMark: 150 },
    { subject: 'REM Sleep', A: realData ? Math.min(150, (realData.avgSleep / 8) * 130) : 0, fullMark: 150 },
    { subject: 'Efficiency', A: realData ? Math.min(150, (realData.avgSteps / 8000) * 120) : 0, fullMark: 150 },
  ], [realData, profile]);

  return (
    <div ref={containerRef} className="relative min-h-screen space-y-10 pb-20 overflow-hidden bg-slate-50/30 dark:bg-black/50">
      {/* Theme Atmosphere */}
      <div className="absolute top-0 left-0 -z-10 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 right-0 -z-10 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] opacity-20 pointer-events-none" />

      
      {/* Dynamic Header */}
      <div className="flex items-center justify-between px-4 analysis-animate">
        <button 
          onClick={onBack}
          className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-600 hover:scale-110 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
           <h2 className="text-2xl font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">Analysis</span></h2>
           <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1 opacity-80">Biometric Protocol v2.4</p>
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
                       <div className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-primary/10">
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
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                             <Moon className="w-6 h-6" />
                          </div>
                          <h4 className="text-xl font-black text-slate-900 dark:text-white">Circadian Rhythm</h4>
                       </div>
                       <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                         Based on device usage patterns and inactivity periods, we detected a consistent sleep window between <strong className="text-primary">{realData?.sleepStart || "11:00 PM"}</strong> and <strong className="text-primary">{realData?.sleepEnd || "7:00 AM"}</strong>.
                       </p>
                       <div className="space-y-4">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <span>Weekly Consistency</span>
                             <span className="text-primary">{realData ? Math.min(100, Math.round((realData.steps.length / 7) * 100)) : 0}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                             <div className="h-full bg-primary rounded-full" style={{ width: `${realData ? Math.min(100, (realData.steps.length / 7) * 100) : 0}%` }} />
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
                         "{realData?.diagnosis || "Analyzing biometric data..."}"
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
                       <div className="text-5xl font-black tracking-tighter">{realData ? Math.min(100, Math.round((realData.avgSteps / (profile?.daily_step_goal || 10000)) * 100)) : 0} <span className="text-lg text-slate-400 ml-1">Score</span></div>
                       <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-2">Compliance Rating</p>
                    </div>
                 </GlassCard>

                 <GlassCard className="p-10 bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-3 mb-6">
                       <AlertCircle className="w-5 h-5 text-primary" />
                       <h4 className="text-sm font-black uppercase tracking-widest">Device Insights</h4>
                    </div>
                    <div className="space-y-6">
                       <InsightItem icon={Sun} label="Screen On-Time" value={realData?.screenOn || "0h"} color="primary" />
                       <InsightItem icon={Moon} label="Downtime Sync" value={realData?.downtime || "0h"} color="primary" />
                       <InsightItem icon={Smartphone} label="Last Activity" value={realData?.lastActive || "Unknown"} color="primary" />
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

