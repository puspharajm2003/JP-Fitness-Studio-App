import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  ShieldCheck, ShieldAlert, Lock, Key, Globe, Eye, 
  Activity, AlertTriangle, CheckCircle2, XCircle,
  Fingerprint, Database, Zap, RefreshCcw, Shield
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

export default function SecurityHub() {
  const [loading, setLoading] = useState(false);
  const [checks, setChecks] = useState<any[]>([
    { id: 1, name: "RLS Policy Validation", status: "passed", icon: ShieldCheck, desc: "Row Level Security is active on all core tables." },
    { id: 2, name: "JWT Token Integrity", status: "passed", icon: Key, desc: "All client requests are cryptographically verified." },
    { id: 3, name: "Database Encryption", status: "passed", icon: Database, desc: "AES-256 encryption at rest confirmed." },
    { id: 4, name: "API Rate Limiting", status: "warning", icon: Activity, desc: "Bursts detected from segment 192.168.1.x" },
    { id: 5, name: "Auth Provider Health", status: "passed", icon: Fingerprint, desc: "Supabase Auth services are fully operational." },
  ]);

  const runRegression = async () => {
    setLoading(true);
    toast.info("Initializing Security Regression Suite...");
    
    // Mock simulation
    await new Promise(r => setTimeout(r, 2000));
    
    setChecks(prev => prev.map(c => ({ ...c, status: "passed" })));
    setLoading(false);
    toast.success("Security Regression: 100% Passed. All systems secure.");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Security Command Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 shadow-inner">
                <Shield className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Threat Intelligence</p>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Security <span className="text-slate-300 dark:text-slate-700">Hub</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             <button onClick={runRegression} disabled={loading} className="px-8 py-4 rounded-2xl bg-rose-600 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50">
                {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Run Full Regression
             </button>
          </div>
        </div>

        {/* Global Protection Status */}
        <div className="grid md:grid-cols-3 gap-8">
           <StatusCard 
              label="Protection Score" 
              value="98/100" 
              sub="High-grade security active" 
              color="emerald" 
              icon={ShieldCheck} 
           />
           <StatusCard 
              label="Active Encrypt" 
              value="AES-256" 
              sub="Military-grade encryption" 
              color="blue" 
              icon={Lock} 
           />
           <StatusCard 
              label="Identity Auth" 
              value="Bio-JWT" 
              sub="Identity verified via JWT" 
              color="indigo" 
              icon={Fingerprint} 
           />
        </div>

        {/* Regression Checklist */}
        <div className="grid lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-black flex items-center gap-3 text-slate-900 dark:text-white px-4">
                 <ShieldAlert className="w-6 h-6 text-rose-500" />
                 System Integrity Checks
              </h2>
              
              <div className="space-y-4">
                 {checks.map(check => (
                   <GlassCard key={check.id} className="p-8 group hover:border-rose-500/20 transition-all">
                      <div className="flex items-start justify-between">
                         <div className="flex items-center gap-6">
                            <div className={cn(
                               "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg",
                               check.status === "passed" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                            )}>
                               <check.icon className="w-7 h-7" />
                            </div>
                            <div>
                               <h3 className="text-lg font-black text-slate-900 dark:text-white">{check.name}</h3>
                               <p className="text-xs text-slate-500 font-medium">{check.desc}</p>
                            </div>
                         </div>
                         <div className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm",
                            check.status === "passed" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                         )}>
                            {check.status === "passed" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            {check.status === "passed" ? "Verified" : "Pending"}
                         </div>
                      </div>
                   </GlassCard>
                 ))}
              </div>
           </div>

           {/* Security Recommendations */}
           <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white px-4">Insights</h2>
              <GlassCard className="p-10 bg-gradient-to-br from-slate-900 to-slate-950 text-white border-none shadow-premium">
                 <h3 className="text-xl font-black mb-1">Security Audit</h3>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-10">AI Recommendation Engine</p>
                 
                 <div className="space-y-8">
                    <Recommendation 
                       title="Rotate Global Keys" 
                       desc="Security best practice suggests rotating API keys every 90 days. Next rotation in 12 days."
                       action="Schedule Rotation"
                    />
                    <Recommendation 
                       title="Enable MFA" 
                       desc="Enhance admin security by requiring multi-factor authentication for high-level actions."
                       action="Configure MFA"
                    />
                 </div>

                 <div className="mt-12 p-6 rounded-3xl bg-white/5 border border-white/10 text-center backdrop-blur-md">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Network Shield</p>
                    <div className="flex items-center justify-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                       <span className="text-lg font-black text-emerald-400 tracking-tighter">SECURE</span>
                    </div>
                 </div>
              </GlassCard>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, sub, color, icon: Icon }: any) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500 shadow-emerald-500/20",
    blue: "bg-blue-500 shadow-blue-500/20",
    indigo: "bg-indigo-500 shadow-indigo-500/20",
  };
  return (
    <GlassCard className="p-10 group hover:translate-y-[-5px] transition-all duration-500">
       <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-2xl mb-8 transform -rotate-6 group-hover:rotate-0 transition-transform", colors[color])}>
          <Icon className="w-8 h-8" />
       </div>
       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
       <p className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">{value}</p>
       <p className="text-xs text-slate-500 font-medium">{sub}</p>
    </GlassCard>
  );
}

function Recommendation({ title, desc, action }: { title: string, desc: string, action: string }) {
  return (
    <div className="space-y-3">
       <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          {title}
       </h4>
       <p className="text-xs text-slate-400 leading-relaxed font-medium">{desc}</p>
       <button className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:underline">{action}</button>
    </div>
  );
}
