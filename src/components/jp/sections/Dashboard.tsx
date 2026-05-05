import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { today } from "@/lib/dateUtil";
import { Activity, ClipboardCheck, Dumbbell, Flame, Footprints, GlassWater, MessageCircle, Scale, Sparkles, TrendingDown, Trophy, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import TrendsSection from "./TrendsSection";

export default function Dashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [stats, setStats] = useState({ steps: 0, water: 0, weight: 0, attendance: 0, kcal: 0, workouts: 0 });
  const [pkg, setPkg] = useState<any>(null);

  useEffect(() => { (async () => {
    if (!user) return;
    const t = today();
    const [steps, water, weight, attCount, food, workouts, p] = await Promise.all([
      supabase.from("step_logs").select("steps").eq("user_id", user.id).eq("date", t).maybeSingle(),
      supabase.from("water_logs").select("amount_ml").eq("user_id", user.id).eq("date", t),
      supabase.from("weight_logs").select("weight_kg,date").eq("user_id", user.id).order("date",{ascending:false}).limit(1),
      supabase.from("attendance").select("id", { count:"exact", head:true }).eq("user_id", user.id).gte("date", new Date(Date.now()-30*864e5).toISOString().slice(0,10)),
      supabase.from("food_logs").select("kcal").eq("user_id", user.id).eq("date", t),
      supabase.from("workout_logs").select("id",{count:"exact",head:true}).eq("user_id", user.id).gte("date", new Date(Date.now()-7*864e5).toISOString().slice(0,10)),
      supabase.from("packages").select("*").eq("user_id", user.id).eq("status","active").order("end_date",{ascending:true}).limit(1).maybeSingle(),
    ]);
    setStats({
      steps: steps.data?.steps ?? 0,
      water: (water.data ?? []).reduce((s,r)=>s+(r.amount_ml||0),0),
      weight: weight.data?.[0]?.weight_kg ?? 0,
      attendance: attCount.count ?? 0,
      kcal: (food.data ?? []).reduce((s,r)=>s+(r.kcal||0),0),
      workouts: workouts.count ?? 0,
    });
    setPkg(p.data);
  })(); }, [user]);

  const checkIn = async () => {
    const { error } = await supabase.from("attendance").insert({ user_id: user!.id });
    if (error) {
      toast.error(error.message);
      return;
    }
    // Update points on profile
    await supabase.from("profiles").update({ loyalty_points: (profile?.loyalty_points||0)+10 }).eq("id", user!.id);
    // Log point change
    await supabase.from("loyalty_point_logs").insert({
      user_id: user!.id,
      points_change: 10,
      reason: "check-in",
      related_id: undefined,
    });
    toast.success("Checked in! +10 points");
  };

  const coachMsg = () => {
    const phone = (profile?.coach_phone||"").replace(/\D/g,"");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent("Hi Coach, I need help with my plan.")}`, "_blank");
  };

  const daysLeft = pkg ? Math.max(0, Math.ceil((new Date(pkg.end_date).getTime()-Date.now())/864e5)) : null;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-brand-3 p-7 md:p-10 text-primary-foreground shadow-brand">
        <div className="absolute -top-20 -right-10 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full backdrop-blur text-xs font-semibold mb-3">
            <Sparkles className="w-3 h-3" /> Welcome back
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-extrabold leading-tight">Hi, {profile?.full_name || "Champion"}!</h1>
          <p className="opacity-90 mt-2 max-w-lg">Stay consistent today. {profile?.goal === "weight_loss" ? "Every small calorie deficit counts." : "Keep building strength!"}</p>
          <div className="flex flex-wrap gap-2 mt-5">
            <button onClick={checkIn} className="px-5 py-2.5 rounded-xl bg-white text-foreground font-semibold flex items-center gap-2 hover:scale-105 transition-transform">
              <ClipboardCheck className="w-4 h-4" /> Check in
            </button>
            <button onClick={coachMsg} className="px-5 py-2.5 rounded-xl bg-black/20 backdrop-blur text-white font-semibold flex items-center gap-2 hover:bg-black/30 transition-colors">
              <MessageCircle className="w-4 h-4" /> Message Coach
            </button>
          </div>
        </div>
      </div>

      {pkg && daysLeft !== null && daysLeft <= 7 && (
        <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-accent" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Package "{pkg.name}" expires in {daysLeft} day{daysLeft!==1?"s":""}</p>
            <p className="text-xs text-muted-foreground">Renew with your coach to keep your streak alive.</p>
          </div>
          <Link to="/profile" className="px-3 py-2 rounded-lg bg-gradient-brand text-primary-foreground text-xs font-semibold">Renew</Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={Footprints} label="Steps" value={stats.steps.toLocaleString()} sub={`/ ${profile?.daily_step_goal || 10000}`} to="/activity" />
        <StatTile icon={GlassWater} label="Water" value={`${stats.water}ml`} sub={`/ ${profile?.daily_water_goal_ml || 2500}`} to="/water" />
        <StatTile icon={Flame} label="Calories" value={`${stats.kcal}`} sub={`/ ${profile?.daily_calorie_goal || 2000}`} to="/diet" />
        <StatTile icon={Dumbbell} label="Workouts" value={`${stats.workouts}`} sub="this week" to="/workout" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <QuickCard to="/progress" icon={Scale} title="Weight & Inches" desc={stats.weight ? `Current: ${stats.weight} kg` : "Log your first measurement"} accent />
        <QuickCard to="/attendance" icon={ClipboardCheck} title="Attendance" desc={`${stats.attendance} check-ins last 30 days`} />
        <QuickCard to="/diet" icon={Activity} title="Today's Diet Plan" desc="View AI meal suggestions for your goals" />
        <QuickCard to="/rewards" icon={Trophy} title={`${profile?.loyalty_points || 0} pts`} desc="Redeem PT sessions & gym discounts" />
      </div>

      {/* Trends Section */}
      <TrendsSection />
    </div>
  );
}

function StatTile({ icon:Icon, label, value, sub, to }: any) {
  return (
    <Link to={to} className="glass-card rounded-2xl p-4 hover:scale-[1.02] transition-transform animate-pop">
      <div className="w-10 h-10 rounded-xl bg-gradient-soft flex items-center justify-center mb-2"><Icon className="w-5 h-5" style={{color:"hsl(var(--primary))"}} /></div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </Link>
  );
}
function QuickCard({ to, icon:Icon, title, desc, accent }: any) {
  return (
    <Link to={to} className={`rounded-2xl p-5 flex items-center gap-4 transition-transform hover:scale-[1.01] ${accent ? "bg-gradient-brand text-primary-foreground shadow-brand" : "glass-card"}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent ? "bg-white/20" : "bg-gradient-soft"}`}>
        <Icon className="w-5 h-5" style={accent?{}:{color:"hsl(var(--primary))"}} />
      </div>
      <div className="flex-1">
        <p className="font-display font-bold">{title}</p>
        <p className={`text-xs ${accent?"opacity-90":"text-muted-foreground"}`}>{desc}</p>
      </div>
    </Link>
  );
}
