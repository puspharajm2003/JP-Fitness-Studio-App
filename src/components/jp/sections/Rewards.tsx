import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { Award, Crown, Gift, Sparkles, Check, TrendingUp, ArrowUpDown } from "lucide-react";
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
      supabase.from("redemptions").select("*").eq("user_id", user.id).order("redeemed_at",{ascending:false}),
      supabase.from("loyalty_point_logs").select("*").eq("user_id", user.id).order("created_at",{ascending:true}),
    ]);
    setHistory(redemptions.data||[]);
    setPointLogs(logs.data||[]);
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

  // Stats
  const totalEarned = pointLogs.filter(l => l.points_change > 0).reduce((s,l) => s + l.points_change, 0);
  const totalSpent = Math.abs(pointLogs.filter(l => l.points_change < 0).reduce((s,l) => s + l.points_change, 0));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-brand-3 p-7 md:p-10 text-primary-foreground shadow-brand">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold mb-3"><Crown className="w-3 h-3"/>Loyalty Member</div>
        <h2 className="font-display text-4xl font-extrabold">{points.toLocaleString()} <span className="text-base font-normal opacity-90">points</span></h2>
        <p className="opacity-90 mt-1">Earn 10 points each gym check-in. Redeem for sessions & discounts.</p>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Earned</p>
          <p className="font-display text-2xl font-bold text-green-600">+{totalEarned}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Spent</p>
          <p className="font-display text-2xl font-bold text-red-600">{totalSpent}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Balance</p>
          <p className="font-display text-2xl font-bold text-primary">{points}</p>
        </div>
      </div>

      <div>
        <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent"/>Available rewards</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REWARDS.map(r => {
            const can = points >= r.cost;
            return (
              <div key={r.name} className="glass-card rounded-2xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-brand text-primary-foreground flex items-center justify-center"><Gift className="w-5 h-5"/></div>
                  <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-secondary border border-border">{r.badge}</span>
                </div>
                <h4 className="font-display font-bold mb-1">{r.name}</h4>
                <p className="text-xs text-muted-foreground mb-4 flex-1">Show your coach to claim after redemption.</p>
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-primary">{r.cost} pts</span>
                  <button disabled={!can || claiming===r.name} onClick={()=>claim(r)} className="px-3 py-1.5 rounded-lg bg-gradient-brand text-primary-foreground text-xs font-semibold disabled:opacity-40">
                    {claiming===r.name ? "Claiming…" : can ? "Claim" : "Locked"}
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
