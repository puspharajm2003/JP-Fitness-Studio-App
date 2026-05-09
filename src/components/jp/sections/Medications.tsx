import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { 
  Check, Pill, Plus, Trash2, Clock, Calendar, 
  AlertCircle, ChevronRight, X, Sparkles, Bell, 
  Settings, History, Info, Play, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { today } from "@/lib/dateUtil";
import { cn } from "@/lib/utils";

const GlassCard = ({ children, className }: any) => (
  <div className={cn(
    "relative overflow-hidden rounded-[2.5rem] bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl transition-all duration-300 hover:scale-[1.005]",
    className
  )}>
    {children}
  </div>
);

export default function Medications() {
  const { user } = useAuth();
  const [meds, setMeds] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ name: "", dose: "", times: "08:00" });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        supabase.from("medications").select("*").eq("user_id", user.id).eq("active", true),
        supabase.from("medication_logs").select("*").eq("user_id", user.id).gte("taken_at", today()),
      ]);
      setMeds(a.data || []);
      setLogs(b.data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time reminder logic
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hhmm = now.toTimeString().slice(0, 5);
      meds.forEach(m => {
        (m.schedule_times || []).forEach((t: string) => {
          if (t === hhmm && !logs.some(l => l.medication_id === m.id && new Date(l.taken_at).toDateString() === now.toDateString())) {
            toast(`💊 Time for ${m.name}`, { 
              description: `${m.dose} scheduled at ${t}`,
              action: {
                label: "Mark Taken",
                onClick: () => taken(m)
              }
            });
          }
        });
      });
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [meds, logs]);

  const add = async (e: any) => {
    e.preventDefault();
    if (!f.name || !user) return;
    const times = f.times.split(",").map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from("medications").insert({ 
      user_id: user.id, 
      name: f.name, 
      dose: f.dose, 
      schedule_times: times 
    });
    if (error) {
      toast.error(error.message);
    } else {
      setShowAddForm(false);
      setF({ name: "", dose: "", times: "08:00" });
      load();
      toast.success("Medication added to your schedule ✨");
    }
  };

  const taken = async (m: any) => {
    if (!user) return;
    const { error } = await supabase.from("medication_logs").insert({ 
      user_id: user.id, 
      medication_id: m.id, 
      status: "taken" 
    });
    if (error) {
      toast.error(error.message);
    } else {
      load();
      toast.success(`Success! Logged dose for ${m.name}`);
    }
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("medications").update({ active: false }).eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      load();
      toast.success("Medication removed");
    }
  };

  return (
    <div className="space-y-10 pb-20 max-w-5xl mx-auto animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Health Compliance
            </div>
            {logs.length > 0 && (
              <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                {logs.length} Logged Today
              </div>
            )}
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Medication <span className="text-slate-300 dark:text-slate-700">Tracker</span>
          </h1>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setShowAddForm(prev => !prev)}
            className="px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? "Cancel" : "New Entry"}
          </button>
        </div>
      </div>

      {/* Add Form Section */}
      {showAddForm && (
        <div className="px-4 animate-in slide-in-from-top-4 duration-500">
          <GlassCard className="p-8 border-primary/20 bg-primary/5">
            <form onSubmit={add} className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Medication Name</label>
                <div className="relative group">
                  <Pill className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input 
                    required 
                    value={f.name} 
                    onChange={e => setF({...f, name: e.target.value})} 
                    placeholder="e.g. Paracetamol" 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dosage</label>
                <div className="relative group">
                  <Info className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input 
                    value={f.dose} 
                    onChange={e => setF({...f, dose: e.target.value})} 
                    placeholder="e.g. 500mg" 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Daily Schedule</label>
                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input 
                    value={f.times} 
                    onChange={e => setF({...f, times: e.target.value})} 
                    placeholder="08:00, 14:00" 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <button className="md:col-span-3 py-5 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all">
                Add to Daily Protocols
              </button>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Grid of Medications */}
      <div className="grid md:grid-cols-2 gap-8 px-4">
        {loading ? (
          <div className="md:col-span-2 py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest animate-pulse">Syncing Protocols...</p>
          </div>
        ) : meds.length === 0 ? (
          <div className="md:col-span-2 py-24 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-300 dark:text-slate-800 mb-6">
              <Pill size={48} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No active protocols</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto font-medium">Add your first medication to start receiving smart reminders and tracking your consistency.</p>
          </div>
        ) : (
          meds.map(m => {
            const todayLogs = logs.filter(l => l.medication_id === m.id);
            const scheduledCount = (m.schedule_times || []).length || 1;
            const progress = (todayLogs.length / scheduledCount) * 100;

            return (
              <GlassCard key={m.id} className="group overflow-visible">
                <div className="p-8 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary/10 to-indigo-500/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <Pill className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-1">{m.name}</h3>
                         <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              {m.dose}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {(m.schedule_times || []).join(", ")}
                            </span>
                            {m.schedule_times?.length > 0 && progress < 100 && (
                              <span className="text-[10px] font-black text-primary uppercase tracking-tighter animate-pulse flex items-center gap-1">
                                <Bell className="w-3 h-3" />
                                Next: {m.schedule_times.find((t: string) => t > new Date().toTimeString().slice(0, 5)) || m.schedule_times[0]}
                              </span>
                            )}
                         </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => del(m.id)}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <History className="w-3 h-3" /> 
                        Daily Compliance
                      </span>
                      <span className={cn(
                        "font-black",
                        progress === 100 ? "text-emerald-500" : "text-slate-500"
                      )}>
                        {todayLogs.length} / {scheduledCount} Doses
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden border border-slate-200/20 dark:border-slate-800/20 shadow-inner">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          progress === 100 ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-primary"
                        )} 
                        style={{ width: `${Math.max(5, progress)}%` }} 
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={() => taken(m)}
                      className={cn(
                        "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95",
                        progress === 100 
                          ? "bg-emerald-500/10 text-emerald-600 cursor-default" 
                          : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl hover:translate-y-[-2px]"
                      )}
                    >
                      {progress === 100 ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Protocol Complete
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Mark Dose Taken
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      {/* Info Card */}
      <div className="px-4">
        <GlassCard className="p-8 flex flex-col md:flex-row items-center gap-8 bg-indigo-500/5 border-indigo-500/20">
           <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
             <Bell className="w-10 h-10 animate-bounce" />
           </div>
           <div className="space-y-2 text-center md:text-left">
             <h4 className="text-xl font-black text-slate-900 dark:text-white">Smart Reminders Active</h4>
             <p className="text-sm text-slate-500 font-medium leading-relaxed">
               The system will automatically notify you when it's time for your next dose based on your custom schedules. Ensure notifications are enabled for the best experience.
             </p>
           </div>
           <button className="md:ml-auto px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs uppercase tracking-widest whitespace-nowrap">
             Test Alert
           </button>
        </GlassCard>
      </div>
    </div>
  );
}
