import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { DollarSign, AlertTriangle, CheckCircle, Download, ArrowLeft, RefreshCcw, TrendingUp, CreditCard, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  user_id: string;
  name: string;
  price: number;
  start_date: string;
  end_date: string;
  status: string;
  full_name: string;
}

const SYNC_INTERVAL = 30000; // 30s for payments

export default function AdminPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "expiring">("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from("packages")
        .select(`id, user_id, name, price, start_date, end_date, status, profiles!inner(full_name)`)
        .order("end_date", { ascending: true });

      if (error) throw error;

      const list = (data || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        name: p.name,
        price: p.price,
        start_date: p.start_date,
        end_date: p.end_date,
        status: p.status,
        full_name: p.profiles?.full_name || "Unknown",
      }));
      setPayments(list);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => { 
    load(true);
    const id = setInterval(() => load(false), SYNC_INTERVAL);
    return () => clearInterval(id);
  }, [load]);

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 864e5);

  const filtered = payments.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "all") return true;
    if (filter === "active") return p.status === "active";
    if (filter === "expired") return p.status === "expired" || new Date(p.end_date) < now;
    if (filter === "expiring") {
      return p.status === "active" && new Date(p.end_date) <= sevenDays && new Date(p.end_date) >= now;
    }
    return true;
  });

  const totalRevenue = filtered.reduce((sum, p) => sum + (p.price || 0), 0);

  const exportCSV = () => {
    const csv = [
      ["Member", "Package", "Price", "Start Date", "End Date", "Status"].join(","),
      ...filtered.map(p => [p.full_name, p.name, p.price, p.start_date, p.end_date, p.status].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_${new Date().toISOString().slice(0,10)}.csv`;
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
            <Badge variant="outline" className="rounded-full bg-indigo-500/5 text-indigo-600 border-indigo-500/20 px-3 py-1 font-black text-[10px] uppercase tracking-widest">
              Financial Ledger
            </Badge>
            {isSyncing && <RefreshCcw className="w-3.5 h-3.5 text-primary animate-spin" />}
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-black tracking-tight">Revenue <span className="text-muted-foreground/30 font-normal">Tracking</span></h2>
          <p className="text-xs text-muted-foreground font-medium mt-1">Audit active packages, renewals, and financial growth.</p>
        </div>
        <button 
          onClick={exportCSV} 
          className="px-6 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-black text-sm shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-all"
        >
          <Download className="w-5 h-5" /> Export Ledger
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-1 space-y-6">
            <div className="glass-card rounded-[32px] p-8 border-none shadow-premium bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
              <div className="flex items-center justify-between mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                    <DollarSign className="w-6 h-6" />
                 </div>
                 <Badge className="bg-white/10 text-white border-none font-bold text-[9px] uppercase tracking-widest px-2 py-1">TOTAL VIEW</Badge>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100/60 mb-1">Cumulative Revenue</p>
              <h3 className="text-4xl font-display font-black tracking-tight mb-8">${totalRevenue.toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-100">
                 <TrendingUp className="w-4 h-4" />
                 +12.4% from last month
              </div>
            </div>

            <div className="glass-card rounded-[32px] p-8 border-none shadow-premium bg-white dark:bg-slate-900">
               <h3 className="font-display font-black text-xl mb-6">Financial Filter</h3>
               <div className="space-y-3">
                  {(["all", "active", "expiring", "expired"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all",
                        filter === f 
                          ? "bg-primary text-white shadow-brand" 
                          : "bg-slate-50 dark:bg-slate-800 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700"
                      )}
                    >
                      <span className="capitalize">{f} Records</span>
                      {filter === f && <CheckCircle className="w-3.5 h-3.5" />}
                    </button>
                  ))}
               </div>
            </div>
         </div>

         <div className="lg:col-span-3">
            <div className="glass-card rounded-[32px] p-8 border-none shadow-premium bg-white dark:bg-slate-900 overflow-hidden">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <h3 className="font-display font-black text-2xl">Transaction History</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input 
                      placeholder="Search member or package..." 
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-xs font-bold outline-none w-64" 
                    />
                  </div>
               </div>

               {loading ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                    <p className="font-display font-black text-slate-400 uppercase tracking-widest text-sm">Syncing Financials...</p>
                 </div>
               ) : (
                 <div className="overflow-x-auto -mx-8">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left bg-slate-50/50 dark:bg-slate-800/50">
                          <th className="pl-8 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Subscriber</th>
                          <th className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Package Details</th>
                          <th className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Subscription Period</th>
                          <th className="pr-8 text-right text-[10px] font-black uppercase text-muted-foreground tracking-widest">Operational Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {filtered.map(p => {
                          const expiring = p.status === "active" && new Date(p.end_date) <= sevenDays && new Date(p.end_date) >= now;
                          return (
                            <tr key={p.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="pl-8 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center font-black text-indigo-600 text-xs shadow-sm">
                                    {p.full_name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-bold text-sm">{p.full_name}</span>
                                </div>
                              </td>
                              <td>
                                <div className="flex flex-col">
                                   <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.name}</span>
                                   <span className="text-[10px] font-black text-primary uppercase tracking-tighter">${p.price} SECURED</span>
                                </div>
                              </td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="text-[11px] font-bold text-muted-foreground">Ends {p.end_date}</span>
                                </div>
                              </td>
                              <td className="pr-8 text-right">
                                <Badge className={cn(
                                  "rounded-lg px-2.5 py-1 text-[9px] font-black border-none uppercase tracking-widest",
                                  expiring ? "bg-amber-500/10 text-amber-600 animate-pulse" :
                                  p.status === "active" ? "bg-emerald-500/10 text-emerald-600" :
                                  "bg-rose-500/10 text-rose-600"
                                )}>
                                  {expiring ? "Expiring Soon" : p.status}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                        {filtered.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-20 text-center">
                               <div className="flex flex-col items-center justify-center gap-3">
                                  <AlertTriangle className="w-16 h-16 text-slate-100 dark:text-slate-800" />
                                  <p className="font-display font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest text-sm">No transaction records found</p>
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
