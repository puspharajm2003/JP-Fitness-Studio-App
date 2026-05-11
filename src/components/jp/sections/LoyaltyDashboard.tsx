import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { 
  Award, Trophy, TrendingUp, TrendingDown, Zap, Info, 
  Footprints, Dumbbell, Droplets, Utensils,
  ChevronRight, Sparkles, Star, Target,
  CheckCircle2, Clock, Gift, Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from "recharts";
import { toast } from "sonner";

const REWARDS = [
  { name: "10% Gym Membership Discount", cost: 500, icon: Gift, color: "text-blue-500" },
  { name: "1 Personal Trainer Session", cost: 1200, icon: Star, color: "text-amber-500" },
  { name: "Free Diet Consultation", cost: 800, icon: Utensils, color: "text-emerald-500" },
  { name: "Premium Plan Month", cost: 2500, icon: Crown, color: "text-indigo-500" },
];

const GlassCard = ({ children, className }: any) => (
  <div className={cn(
    "relative overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl transition-all duration-500",
    className
  )}>
    {children}
  </div>
);

export default function LoyaltyDashboard() {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [pointLogs, setPointLogs] = useState<any[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);
  const points = profile?.loyalty_points || 0;

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("loyalty_point_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });
        
        if (error) {
          // Silent fail for missing table (404) or specific PGRST errors
          if (error.code === 'PGRST116' || error.message.includes('not found') || (error as any).status === 404) {
            console.warn("Loyalty ledger offline or not yet initialized.");
            setPointLogs([]);
            return;
          }
          throw error;
        }
        setPointLogs(data || []);
      } catch (err: any) {
        // Only log if it's not a expected 404/missing table issue
        if (err.status !== 404) {
          console.error("Loyalty system sync error:", err);
        }
      }
    };
    load();
  }, [user]);

  const claim = async (r: any) => {
    if (points < r.cost) { toast.error("Not enough points"); return; }
    if (!confirm(`Redeem "${r.name}" for ${r.cost} points?`)) return;
    setClaiming(r.name);
    try {
      const { data: redeemId, error } = await supabase.rpc("redeem_reward", { _reward_name: r.name, _points_cost: r.cost });
      if (error) throw error;
      
      await supabase.from("loyalty_point_logs").insert({
        user_id: user!.id,
        points_change: -r.cost,
        reason: `redemption: ${r.name}`,
        related_id: redeemId,
      });
      toast.success("🎉 Redeemed! Show this to your coach to claim.");
      refresh();
      // Reload logs to update chart
      const { data } = await supabase
        .from("loyalty_point_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      setPointLogs(data || []);
    } catch (err: any) {
      toast.error(err.message);
    }
    setClaiming(null);
  };

  const nextReward = [...REWARDS].sort((a,b) => a.cost - b.cost).find(r => r.cost > points);
  const prevRewardCost = [...REWARDS].sort((a,b) => a.cost - b.cost).filter(r => r.cost <= points).pop()?.cost || 0;
  const progress = nextReward ? Math.min(100, ((points - prevRewardCost) / (nextReward.cost - prevRewardCost)) * 100) : 100;

  const chartData = pointLogs.map((l, i) => {
    let balance = 0;
    for (let j = 0; j <= i; j++) balance += pointLogs[j].points_change;
    return {
      date: new Date(l.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      points: balance
    };
  }).slice(-10); // Last 10 entries

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-10 md:p-16 text-white shadow-3xl">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-primary/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-white/10">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Elite Consistency Rewards
            </div>
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-[0.9]">
              Your <span className="text-primary">Impact</span> Score.
            </h1>
            <p className="text-lg text-slate-400 font-medium max-w-md leading-relaxed">
              Every habit you log translates into real-world value. Track your progress toward premium studio perks.
            </p>
            
            <div className="flex items-center gap-8 pt-4">
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Balance</p>
                  <p className="text-5xl font-black tracking-tighter">{points.toLocaleString()}<span className="text-lg text-slate-600 ml-1">pts</span></p>
               </div>
               <div className="h-12 w-px bg-white/10" />
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tier Status</p>
                  <p className="text-2xl font-black flex items-center gap-2">
                    <Crown className="w-6 h-6 text-amber-500" />
                    {points > 2000 ? "Diamond" : points > 1000 ? "Gold" : "Silver"}
                  </p>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            {nextReward ? (
              <GlassCard className="p-8 bg-white/5 border-white/10">
                <div className="flex justify-between items-center mb-6">
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Next Milestone</p>
                      <h3 className="text-xl font-bold">{nextReward.name}</h3>
                   </div>
                   <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                      <nextReward.icon className="w-6 h-6" />
                   </div>
                </div>
                
                <div className="space-y-3">
                   <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                      <span className="text-slate-400">{points} pts</span>
                      <span className="text-primary">{nextReward.cost} pts</span>
                   </div>
                   <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000" 
                        style={{ width: `${progress}%` }}
                      />
                   </div>
                   <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest pt-1">
                     Only {nextReward.cost - points} points until unlock
                   </p>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="p-8 bg-white/5 border-white/10 text-center">
                 <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                 <h3 className="text-2xl font-black">Elite Level Reached</h3>
                 <p className="text-slate-400 text-sm mt-2">You've unlocked every available reward. Check back soon for new exclusive perks!</p>
              </GlassCard>
            )}
          </div>
        </div>
      </div>

      {/* Point Earning Engine */}
      <div className="grid lg:grid-cols-3 gap-8 px-4">
        <GlassCard className="lg:col-span-2 p-10">
          <div className="flex items-center justify-between mb-10">
             <div>
                <h2 className="text-2xl font-black flex items-center gap-3">
                   <Zap className="w-6 h-6 text-amber-500" />
                   Earning Engine
                </h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Proof of Consistency</p>
             </div>
             <Info className="w-5 h-5 text-slate-300" />
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <EarningChannel 
              icon={Footprints} 
              label="Daily Steps" 
              points="+10" 
              rule="Per 10,000 steps reached"
              color="emerald"
            />
            <EarningChannel 
              icon={Dumbbell} 
              label="Workout Sessions" 
              points="+50" 
              rule="Per verified studio session"
              color="blue"
            />
            <EarningChannel 
              icon={Droplets} 
              label="Hydration Goal" 
              points="+5" 
              rule="Per 250ml logged daily"
              color="sky"
            />
            <EarningChannel 
              icon={Utensils} 
              label="Nutritional Logs" 
              points="+10" 
              rule="Per full meal photo scan"
              color="orange"
            />
          </div>
        </GlassCard>

        <GlassCard className="p-10 bg-primary/5 border-primary/20 flex flex-col justify-between">
           <div className="space-y-6">
              <div className="w-14 h-14 rounded-3xl bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/40">
                 <Star className="w-7 h-7" />
              </div>
              <div>
                 <h3 className="text-xl font-black">Multiplier Status</h3>
                 <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                   Maintain a 7-day streak to unlock a **1.5x points multiplier** on all activity logs.
                 </p>
              </div>
           </div>
           
           <div className="pt-8 mt-8 border-t border-primary/10">
              <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest">
                 <span className="text-slate-400">Current Streak</span>
                 <span className="text-primary">4 / 7 Days</span>
              </div>
              <div className="flex gap-1.5">
                 {[1,1,1,1,0,0,0].map((on, i) => (
                   <div key={i} className={cn(
                     "h-2 flex-1 rounded-full",
                     on ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
                   )} />
                 ))}
              </div>
           </div>
        </GlassCard>
      </div>

      {/* Analytics & History */}
      <div className="grid lg:grid-cols-2 gap-8 px-4">
        <GlassCard className="p-10">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black flex items-center gap-3">
                 <TrendingUp className="w-5 h-5 text-primary" />
                 Growth Curve
              </h3>
              <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Last 10 Days
              </div>
           </div>
           
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                       <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8' }} 
                    />
                    <YAxis hide />
                    <Tooltip 
                       contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="points" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorPoints)" 
                    />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </GlassCard>

        <GlassCard className="p-10">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black flex items-center gap-3">
                 <Clock className="w-5 h-5 text-indigo-500" />
                 Recent Ledger
              </h3>
              <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">View All</button>
           </div>
           
           <div className="space-y-4">
              {pointLogs.slice(-4).reverse().map((log, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                   <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        log.points_change > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                      )}>
                        {log.points_change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{log.reason || "Habit Sync"}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{new Date(log.created_at).toLocaleDateString()}</p>
                      </div>
                   </div>
                   <p className={cn(
                     "font-black text-sm",
                     log.points_change > 0 ? "text-emerald-500" : "text-rose-500"
                   )}>
                     {log.points_change > 0 ? "+" : ""}{log.points_change}
                   </p>
                </div>
              ))}
           </div>
        </GlassCard>
      </div>

      {/* Claimable Rewards Grid */}
      <div className="px-4 space-y-8">
         <div className="flex items-center justify-between">
            <div>
               <h2 className="text-3xl font-black text-slate-900 dark:text-white">Redeemable <span className="text-primary">Perks</span></h2>
               <p className="text-sm text-slate-500 font-medium">Exclusive rewards for your hard work.</p>
            </div>
            <Gift className="w-8 h-8 text-slate-200" />
         </div>

         <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {REWARDS.map(r => {
              const can = points >= r.cost;
              return (
                <GlassCard key={r.name} className={cn(
                  "p-8 flex flex-col group transition-all duration-500",
                  can ? "border-emerald-500/20 bg-emerald-500/5" : "opacity-70"
                )}>
                   <div className="flex justify-between items-start mb-6">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 shadow-lg",
                        can ? "bg-primary text-white" : "bg-slate-200 text-slate-400"
                      )}>
                        <r.icon className="w-6 h-6" />
                      </div>
                      {can && (
                        <div className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest">
                          Unlocked
                        </div>
                      )}
                   </div>
                   
                   <h4 className="font-bold text-lg mb-2 leading-tight">{r.name}</h4>
                   <p className="text-2xl font-black text-primary mb-6">{r.cost} <span className="text-xs font-bold text-slate-400">pts</span></p>
                   
                   <button 
                     disabled={!can || claiming === r.name}
                     onClick={() => claim(r)}
                     className={cn(
                       "w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                       can 
                         ? "bg-slate-900 text-white hover:scale-105 active:scale-95 shadow-xl" 
                         : "bg-slate-100 text-slate-400 cursor-not-allowed"
                     )}
                   >
                     {claiming === r.name ? "Processing..." : can ? "Redeem Now" : `Need ${r.cost - points} more`}
                   </button>
                </GlassCard>
              );
            })}
         </div>
      </div>
    </div>
  );
}

function EarningChannel({ icon: Icon, label, points, rule, color }: any) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    sky: "bg-sky-400",
    orange: "bg-orange-500",
  };
  
  return (
    <div className="flex items-start gap-5 group">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 group-hover:scale-110 transition-transform duration-500",
        colors[color]
      )}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
           <h4 className="font-bold text-slate-800 dark:text-white">{label}</h4>
           <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black text-white uppercase tracking-tighter", colors[color])}>
             {points}
           </span>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">{rule}</p>
      </div>
    </div>
  );
}
