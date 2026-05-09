import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { Award, Crown, Gift, Sparkles, Check, TrendingUp, ArrowUpDown, Zap, Info, Footprints, Dumbbell, Droplets, Utensils } from "lucide-react";
import { toast } from "sonner";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const REWARDS = [
  { name: "10% Gym Membership Discount", cost: 500, badge: "Popular" },
  { name: "1 Personal Trainer Session", cost: 1200, badge: "Best Value" },
  { name: "Free Diet Consultation", cost: 800, badge: "New" },
  { name: "JP Branded Bottle", cost: 600, badge: "Limited" },
  { name: "Premium Plan Month", cost: 2500, badge: "Elite" },
  { name: "Recovery Massage Voucher", cost: 1500, badge: "Wellness" },
];

export default function Rewards() {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [history, setHistory] = useState<any[]>([]);
  const [pointLogs, setPointLogs] = useState<any[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);
  const points = profile?.loyalty_points || 0;

  const load = async () => {
    if (!user) return;
    const [redemptions, logs] = await Promise.all([
      supabase.from("redemptions").select("*").eq("user_id", user.id).order("redeemed_at", { ascending: false }),
      supabase.from("loyalty_point_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: true })
        .then(res => {
          if (res.error) {
            console.warn("Loyalty logs not available:", res.error.message);
            return { data: [], error: null };
          }
          return res;
        }),
    ]);
    setHistory(redemptions.data || []);
    setPointLogs(logs.data || []);
  };
  useEffect(()=>{ load(); },[user]);

  const claim = async (r:any) => {
    if (points < r.cost) { toast.error("Not enough points"); return; }
    if (!confirm(`Redeem "${r.name}" for ${r.cost} points?`)) return;
    setClaiming(r.name);
    const { data: redeemId, error } = await supabase.rpc("redeem_reward", { _reward_name: r.name, _points_cost: r.cost });
    if (error) {
      toast.error(error.message);
    } else {
      await supabase.from("loyalty_point_logs").insert({
        user_id: user!.id,
        points_change: -r.cost,
        reason: `redemption: ${r.name}`,
        related_id: redeemId,
      });
      toast.success("🎉 Redeemed! Show this to your coach to claim.");
      refresh();
      load();
    }
    setClaiming(null);
  };

  // Calculate running balance for chart
  const balanceData = (() => {
    let balance = 0;
    return pointLogs.map((l: any) => {
      balance += l.points_change;
      return {
        date: new Date(l.created_at).toLocaleDateString(),
        balance,
        change: l.points_change,
      };
    });
  })();

  // Find next reward threshold
  const nextReward = [...REWARDS].sort((a,b) => a.cost - b.cost).find(r => r.cost > points);
  const prevRewardCost = [...REWARDS].sort((a,b) => a.cost - b.cost).filter(r => r.cost <= points).pop()?.cost || 0;
  const progressToNext = nextReward ? Math.min(100, ((points - prevRewardCost) / (nextReward.cost - prevRewardCost)) * 100) : 100;

  // Stats
  const totalEarned = pointLogs.filter(l => l.points_change > 0).reduce((s,l) => s + l.points_change, 0);
  const totalSpent = Math.abs(pointLogs.filter(l => l.points_change < 0).reduce((s,l) => s + l.points_change, 0));

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 md:p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                <Crown className="w-3 h-3 text-amber-400"/> Status: Loyalty Member
              </div>
              <h2 className="font-display text-5xl font-black mb-2 flex items-baseline gap-2">
                {points.toLocaleString()} 
                <span className="text-xl font-medium opacity-60">pts</span>
              </h2>
              <p className="text-white/60 text-sm max-w-md">Your consistency is building real value. Keep logging your habits to unlock premium rewards.</p>
            </div>
            
            {nextReward && (
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 min-w-[280px]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Next Reward</span>
                  <span className="text-xs font-bold text-primary">{nextReward.cost - points} pts away</span>
                </div>
                <p className="font-bold text-sm mb-3">{nextReward.name}</p>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000" 
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-bold text-white/30">
                  <span>{points} pts</span>
                  <span>{nextReward.cost} pts</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Point Earning Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-3xl p-8 border-primary/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-bold text-xl">How to Earn Points</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <EarningRule icon={Footprints} label="Daily Steps" rule="10pts / 10k steps" color="text-emerald-500" />
            <EarningRule icon={Dumbbell} label="Workouts" rule="50pts / session" color="text-blue-500" />
            <EarningRule icon={Droplets} label="Hydration" rule="5pts / 250ml" color="text-cyan-500" />
            <EarningRule icon={Utensils} label="Food Logs" rule="10pts / meal" color="text-orange-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-accent to-purple-600 rounded-3xl p-8 text-white flex flex-col justify-between relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
            <Zap className="w-24 h-24" />
          </div>
          <h3 className="font-display font-extrabold text-xl mb-2 relative z-10">Coach Bonus</h3>
          <p className="text-white/80 text-xs mb-6 relative z-10">Coaches can award up to 500 bonus points for personal breakthroughs and milestone achievements.</p>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 relative z-10 text-[10px] font-bold text-center">
            LAST AWARDED: +200 PTS (April 28)
          </div>
        </div>
      </div>

      {/* Point Balance Trend */}
      {balanceData.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-bold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4"/>Point Balance Trend</h3>
          <ChartContainer config={{ balance: { label: "Balance", color: "#3b82f6" } }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={balanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="balance" stroke="var(--color-balance)" fill="var(--color-balance)" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {/* Summary Stats - Premium Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RewardStat label="Total Earned" value={totalEarned} icon={TrendingUp} color="text-emerald-500" />
        <RewardStat label="Total Spent" value={totalSpent} icon={TrendingUp} color="text-rose-500" flip />
        <RewardStat label="Current Balance" value={points} icon={Award} color="text-primary" />
        <RewardStat label="Claimable" value={REWARDS.filter(r => points >= r.cost).length} icon={Gift} color="text-amber-500" />
      </div>

      {/* Point Balance Trend - Premium Area Chart */}
      {balanceData.length > 0 && (
        <div className="glass-card rounded-3xl p-6 border-primary/10 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Award className="w-32 h-32" />
          </div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary"/>Points Growth
              </h3>
              <p className="text-xs text-muted-foreground">Your consistency pays off</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
              +{(totalEarned / Math.max(1, balanceData.length)).toFixed(0)} avg / log
            </div>
          </div>
          
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={balanceData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/30" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
                />
                <ChartTooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Quick Claim from Chart Area */}
          {REWARDS.filter(r => points >= r.cost).length > 0 && (
            <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {REWARDS.filter(r => points >= r.cost).map(r => (
                <button 
                  key={r.name}
                  onClick={() => claim(r)}
                  disabled={claiming === r.name}
                  className="whitespace-nowrap px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 text-[10px] font-black uppercase tracking-widest text-primary transition-all flex items-center gap-2"
                >
                  <Zap className="w-3 h-3 fill-primary" /> Claim {r.name.split(" ")[0]}...
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent"/>Claimable Rewards
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {REWARDS.length} Items Total
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REWARDS.map(r => {
            const can = points >= r.cost;
            return (
              <div 
                key={r.name} 
                className={`group glass-card rounded-3xl p-6 flex flex-col border-2 transition-all duration-300 hover:scale-[1.02] ${
                  can ? "border-emerald-500/20 shadow-emerald-500/5" : "border-transparent opacity-80"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 ${
                    can ? "bg-gradient-brand text-primary-foreground shadow-lg" : "bg-secondary text-muted-foreground"
                  }`}>
                    <Gift className="w-6 h-6"/>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold mb-1 ${
                      can ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" : "bg-secondary text-muted-foreground"
                    }`}>
                      {can ? "Ready" : "Locked"}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-medium">{r.badge}</span>
                  </div>
                </div>
                <h4 className="font-display font-extrabold text-lg mb-2">{r.name}</h4>
                <p className="text-xs text-muted-foreground mb-6 flex-1 leading-relaxed">
                  Redeem this reward and present the code to your coach at the studio.
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Cost</p>
                    <p className={`font-display font-black text-xl ${can ? "text-primary" : "text-muted-foreground"}`}>
                      {r.cost} <span className="text-xs">pts</span>
                    </p>
                  </div>
                  <button 
                    disabled={!can || claiming===r.name} 
                    onClick={()=>claim(r)} 
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
                      can 
                        ? "bg-gradient-brand text-primary-foreground shadow-brand hover:shadow-lg active:scale-95" 
                        : "bg-secondary text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {claiming===r.name ? "Claiming…" : can ? "Redeem Now" : `Need ${r.cost - points} more`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Transaction History */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Award className="w-4 h-4"/>Transaction History</h3>
        {/* Combined history from point logs */}
        {pointLogs.length === 0 && history.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground text-center">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {/* Show point logs (earn + spend) */}
            {pointLogs.map(l => (
              <li key={l.id} className="py-3 flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  l.points_change > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {l.points_change > 0 ? <ArrowUpDown className="w-4 h-4" /> : <ArrowUpDown className="w-4 h-4" />}
                </span>
                <span className="flex-1 text-sm">{l.reason}</span>
                <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</span>
                <span className={`text-xs font-bold ${
                  l.points_change > 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {l.points_change > 0 ? "+" : ""}{l.points_change} pts
                </span>
              </li>
            ))}
            {/* Also show redemption history */}
            {history.map(r => (
              <li key={r.id} className="py-3 flex items-center gap-3">
                <Check className="w-4 h-4 text-primary"/>
                <span className="flex-1 text-sm">{r.reward_name}</span>
                <span className="text-xs text-muted-foreground">{new Date(r.redeemed_at).toLocaleDateString()}</span>
                <span className="text-xs font-bold text-primary">-{r.points_cost} pts</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EarningRule({ icon: Icon, label, rule, color }: any) {
  return (
    <div className="flex flex-col items-center text-center group">
      <div className={`w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <p className="text-xs font-bold text-slate-800 dark:text-white mb-1">{label}</p>
      <p className="text-[10px] font-medium text-muted-foreground">{rule}</p>
    </div>
  );
}

function RewardStat({ label, value, icon: Icon, color, flip }: any) {
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center">
      <div className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center mb-2 ${flip ? "rotate-180" : ""}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
      <p className={`font-display text-xl font-black ${color}`}>{typeof value === 'number' && value > 0 && !flip ? "+" : ""}{value}</p>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 rounded-xl border-primary/20 shadow-xl animate-pop">
        <p className="text-[10px] font-bold text-muted-foreground mb-1">{payload[0].payload.date}</p>
        <p className="text-sm font-black text-primary">{payload[0].value} <span className="text-[10px] font-bold">PTS</span></p>
        {payload[0].payload.change !== 0 && (
          <p className={`text-[9px] font-bold ${payload[0].payload.change > 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {payload[0].payload.change > 0 ? "↑" : "↓"} {Math.abs(payload[0].payload.change)} pts
          </p>
        )}
      </div>
    );
  }
  return null;
}
