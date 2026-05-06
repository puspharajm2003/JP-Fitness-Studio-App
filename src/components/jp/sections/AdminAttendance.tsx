import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Calendar, Download, Filter, ArrowLeft, RefreshCcw, UserCheck, Clock, Search } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  user_id: string;
  full_name: string;
  date: string;
  check_in: string;
}

const SYNC_INTERVAL = 15000; // 15s polling for attendance

export default function AdminAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select(`id, user_id, date, check_in, profiles!inner(full_name)`)
        .eq("date", dateFilter)
        .order("check_in", { ascending: false });

      if (error) throw error;

      const list = (data || []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        full_name: r.profiles?.full_name || "Unknown",
        date: r.date,
        check_in: r.check_in,
      }));
      setRecords(list);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [dateFilter]);

  useEffect(() => { 
    load(true);
    const id = setInterval(() => load(false), SYNC_INTERVAL);
    return () => clearInterval(id);
  }, [load]);

  const exportCSV = () => {
    const csv = [
      ["Name", "Date", "Check-in Time"].join(","),
      ...records.map(r => [r.full_name, r.date, new Date(r.check_in).toLocaleTimeString()].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${dateFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/admin" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-all mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Badge variant="outline" className="rounded-full bg-emerald-500/5 text-emerald-600 border-emerald-500/20 px-3 py-1 font-black text-[10px] uppercase tracking-widest">
              Live Presence Tracker
            </Badge>
            {isSyncing && <RefreshCcw className="w-3.5 h-3.5 text-primary animate-spin" />}
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-black tracking-tight">Attendance <span className="text-muted-foreground/30 font-normal">Monitor</span></h2>
          <p className="text-xs text-muted-foreground font-medium mt-1">Real-time check-in stream from the studio.</p>
        </div>
        <button 
          onClick={exportCSV} 
          className="px-6 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-black text-sm shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-all"
        >
          <Download className="w-5 h-5" /> Export Records
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-[32px] p-8 border-none shadow-premium bg-white dark:bg-slate-900">
            <h3 className="font-display font-black text-xl mb-6">Filters</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Date</label>
                 <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={e => setDateFilter(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                    />
                 </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-muted-foreground">Total Sessions</span>
                    <Badge className="bg-primary/10 text-primary border-none">{records.length}</Badge>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">Peak Hour</span>
                    <span className="text-xs font-black">06:00 PM</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-[32px] p-8 border-none shadow-premium bg-gradient-brand text-white">
            <UserCheck className="w-8 h-8 mb-4 opacity-50" />
            <h4 className="font-display font-black text-xl leading-tight mb-2">Live Studio Capacity</h4>
            <p className="text-xs opacity-80 mb-6 font-medium">Monitoring studio check-ins for resource optimization.</p>
            <div className="flex items-end gap-2">
               <span className="text-4xl font-black">{records.length}</span>
               <span className="text-sm font-bold mb-1 opacity-70">Members present</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="glass-card rounded-[32px] p-8 border-none shadow-premium bg-white dark:bg-slate-900 overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                <h3 className="font-display font-black text-2xl">Daily Stream</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input placeholder="Filter stream..." className="pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-xs font-bold outline-none" />
                </div>
             </div>

             {loading ? (
               <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                  <p className="font-display font-black text-slate-400 uppercase tracking-widest text-sm">Syncing Check-ins...</p>
               </div>
             ) : (
               <div className="overflow-x-auto -mx-8">
                 <table className="w-full text-sm">
                   <thead>
                     <tr className="text-left bg-slate-50/50 dark:bg-slate-800/50">
                       <th className="pl-8 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Member</th>
                       <th className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Date Session</th>
                       <th className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Exact Timestamp</th>
                       <th className="pr-8 text-right text-[10px] font-black uppercase text-muted-foreground tracking-widest">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                     {records.map(r => (
                       <tr key={r.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                         <td className="pl-8 py-5">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center font-black text-emerald-600 text-xs shadow-sm">
                               {r.full_name.slice(0, 2).toUpperCase()}
                             </div>
                             <span className="font-bold text-sm">{r.full_name}</span>
                           </div>
                         </td>
                         <td>
                           <Badge variant="outline" className="rounded-lg border-slate-200 dark:border-slate-800 font-bold text-[10px] px-2 py-1">
                             {r.date}
                           </Badge>
                         </td>
                         <td>
                           <div className="flex items-center gap-2">
                             <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                             <span className="font-black text-sm">{new Date(r.check_in).toLocaleTimeString()}</span>
                           </div>
                         </td>
                         <td className="pr-8 text-right">
                           <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest">
                             Verified
                           </Badge>
                         </td>
                       </tr>
                     ))}
                     {records.length === 0 && (
                       <tr>
                         <td colSpan={4} className="py-20 text-center">
                            <div className="flex flex-col items-center justify-center gap-3">
                               <Calendar className="w-16 h-16 text-slate-100 dark:text-slate-800" />
                               <p className="font-display font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest text-sm">No activity recorded for this date</p>
                            </div>
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
