import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Users, DollarSign, TrendingUp, Activity, Calendar, 
  BarChart3, Search, Filter, Download, RefreshCcw, CheckCircle2,
  AlertTriangle, ArrowUpRight, ArrowDownRight, MoreHorizontal, UserPlus,
  Target, Zap, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { toast } from "sonner";

interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  membership_status: string;
  join_date: string;
  total_spent: number;
  last_checkin: string;
  loyalty_points: number;
  role: string;
  package_end?: string;
}

const SYNC_INTERVAL = 10000; // 10 seconds for real-time feel

export default function AdminCRMAdvanced() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "revenue" | "attendance">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const loadData = useCallback(async (isInitial = false) => {
    if (!user) return;
    if (isInitial) setLoading(true);
    setIsSyncing(true);

    try {
      // 1. Fetch profiles and roles
      const [profilesRes, rolesRes, packagesRes, attendanceRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("packages").select("*"),
        supabase.from("attendance").select("*").order("check_in", { ascending: false })
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const roleMap = new Map(rolesRes.data?.map(r => [r.user_id, r.role]) || []);
      const memberList: Member[] = (profilesRes.data || []).map(p => {
        const userPackages = packagesRes.data?.filter(pkg => pkg.user_id === p.id) || [];
        const activePkg = userPackages.find(pkg => pkg.status === "active");
        const lastAtt = attendanceRes.data?.find(a => a.user_id === p.id);

        return {
          id: p.id,
          full_name: p.full_name || "Unnamed",
          email: (p as any).email || "-",
          phone: p.phone || "-",
          membership_status: activePkg ? "Active" : "Inactive",
          join_date: p.created_at?.split("T")[0] || "-",
          total_spent: userPackages.reduce((sum, pkg) => sum + (pkg.price || 0), 0),
          last_checkin: lastAtt ? lastAtt.check_in?.split("T")[0] : "Never",
          loyalty_points: p.loyalty_points || 0,
          role: roleMap.get(p.id) || "member",
          package_end: activePkg?.end_date,
        };
      });

      setMembers(memberList);

      // 2. Process real chart data for last 6 months
      const now = new Date();
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const monthName = d.toLocaleString('en', { month: 'short' });
        const year = d.getFullYear();
        return { name: `${monthName} '${year.toString().slice(-2)}`, revenue: 0, attendance: 0 };
      });

      // Calculate real revenue by month from packages
      packagesRes.data?.forEach(pkg => {
        if (!pkg.start_date) return;
        const d = new Date(pkg.start_date);
        const monthKey = `${d.toLocaleString('en', { month: 'short' })} '${d.getFullYear().toString().slice(-2)}`;
        const entry = last6Months.find(m => m.name === monthKey);
        if (entry) entry.revenue += (pkg.price || 0);
      });

      // Calculate real attendance by month
      attendanceRes.data?.forEach(att => {
        if (!att.check_in) return;
        const d = new Date(att.check_in);
        const monthKey = `${d.toLocaleString('en', { month: 'short' })} '${d.getFullYear().toString().slice(-2)}`;
        const entry = last6Months.find(m => m.name === monthKey);
        if (entry) entry.attendance += 1;
      });

      setRevenueData(last6Months);
      setAttendanceData(last6Months);

      setLastSync(new Date());
    } catch (error: any) {
      console.error("CRM Sync Error:", error);
      toast.error("Real-time sync failed: " + error.message);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredMembers = members.filter(m => 
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculation
  const totalRev = members.reduce((s, m) => s + m.total_spent, 0);
  const activeCount = members.filter(m => m.membership_status === "Active").length;
  const expiringSoon = members.filter(m => {
    if (m.membership_status !== "Active" || !m.package_end) return false;
    const days = (new Date(m.package_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 7;
  }).length;

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/10">
      {/* Premium Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-[1px_0_10px_rgba(0,0,0,0.02)] z-40">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-brand transform rotate-3">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="font-display font-black text-xl tracking-tight">CRM <span className="text-primary">ULTRA</span></h2>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Admin Command Center</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "members", label: "Members", icon: Users },
              { id: "revenue", label: "Revenue", icon: DollarSign },
              { id: "attendance", label: "Attendance", icon: Calendar },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300",
                  activeTab === item.id
                    ? "bg-primary/10 text-primary border-l-4 border-primary shadow-sm"
                    : "text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-primary" : "")} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Live Status</p>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium mb-3">Syncing with production database every 10s.</p>
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="text-muted-foreground/60">LAST SYNC</span>
              <span className="text-slate-900 dark:text-slate-300">{lastSync.toLocaleTimeString()}</span>
            </div>
          </div>
          
          <Button
            variant="outline"
            className="w-full rounded-2xl border-slate-200 dark:border-slate-700 h-12 font-bold text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => nav("/profile")}
          >
            <ArrowLeft className="w-4 h-4" /> Exit Admin
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/50 p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="rounded-full bg-primary/5 text-primary border-primary/20 px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                  Active Intelligence
                </Badge>
                {isSyncing && <RefreshCcw className="w-4 h-4 text-primary animate-spin" />}
              </div>
              <h1 className="text-4xl lg:text-5xl font-display font-black tracking-tight text-slate-900 dark:text-white">
                Dashboard <span className="text-muted-foreground/20 font-normal">/</span> {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold w-64 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                />
              </div>
              <Button className="h-[52px] rounded-2xl bg-gradient-brand text-white shadow-brand px-6 font-bold flex items-center gap-2">
                <Download className="w-4 h-4" /> Report
              </Button>
            </div>
          </header>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
              <p className="font-display font-black text-slate-400 uppercase tracking-widest text-sm">Initializing CRM Engine...</p>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in duration-700">
              {/* Overiew / Stats */}
              {activeTab === "overview" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCardUltra label="Total Revenue" value={`$${totalRev.toLocaleString()}`} change="+14.2%" trend="up" icon={DollarSign} color="blue" />
                    <StatCardUltra label="Active Members" value={activeCount.toString()} change="+5.8%" trend="up" icon={Users} color="purple" />
                    <StatCardUltra label="Expiring Soon" value={expiringSoon.toString()} change="-2" trend="down" icon={AlertTriangle} color="amber" />
                    <StatCardUltra label="Growth Rate" value="22.5%" change="+3.1%" trend="up" icon={TrendingUp} color="emerald" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 rounded-[32px] border-none shadow-premium bg-white dark:bg-slate-900 overflow-hidden">
                      <CardHeader className="p-8 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="font-display font-black text-2xl">Revenue Trends</CardTitle>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">Last 6 Months Projection</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="rounded-lg bg-blue-500/10 text-blue-600 border-none px-3 py-1 font-bold text-[10px]">Monthly</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="px-6 pb-8">
                        <div className="h-[320px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                              <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: "#94a3b8"}} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: "#94a3b8"}} />
                              <Tooltip content={<CustomTooltip />} />
                              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-[32px] border-none shadow-premium bg-white dark:bg-slate-900 p-8 flex flex-col">
                      <h3 className="font-display font-black text-2xl mb-2">Member Retention</h3>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-8">Performance breakdown</p>
                      
                      <div className="flex-1 space-y-6">
                         <RetentionItem label="Check-in Consistency" value={85} color="bg-blue-500" />
                         <RetentionItem label="Package Renewal" value={72} color="bg-purple-500" />
                         <RetentionItem label="Loyalty Redemption" value={45} color="bg-emerald-500" />
                         <RetentionItem label="Social Engagement" value={60} color="bg-amber-500" />
                      </div>

                      <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-bold">Total Retention Score</p>
                          <p className="text-2xl font-black text-primary">A-</p>
                        </div>
                        <Button className="w-full h-12 rounded-2xl bg-secondary text-foreground font-bold text-sm">Optimize Growth</Button>
                      </div>
                    </Card>
                  </div>
                </>
              )}

              {/* Members View */}
              {(activeTab === "members" || activeTab === "overview") && (
                <Card className="rounded-[32px] border-none shadow-premium bg-white dark:bg-slate-900 overflow-hidden">
                   <CardHeader className="p-8 flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800">
                     <CardTitle className="font-display font-black text-2xl">Manage Members</CardTitle>
                     <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs"><Filter className="w-4 h-4 mr-2"/> Filter</Button>
                        <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs text-primary"><UserPlus className="w-4 h-4 mr-2"/> New User</Button>
                     </div>
                   </CardHeader>
                   <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                            <TableHead className="pl-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Member</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Points</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Revenue</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Last Activity</TableHead>
                            <TableHead className="pr-8 text-right text-[10px] font-black uppercase text-muted-foreground tracking-widest">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMembers.slice(0, 15).map(m => (
                            <TableRow key={m.id} className="border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <TableCell className="pl-8 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-soft flex items-center justify-center font-black text-primary text-xs shadow-sm">
                                    {m.full_name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm leading-none mb-1">{m.full_name}</p>
                                    <p className="text-[11px] text-muted-foreground font-medium">{m.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn(
                                  "rounded-lg px-2.5 py-1 text-[10px] font-black border-none shadow-sm uppercase tracking-wider",
                                  m.membership_status === "Active" ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 text-slate-500"
                                )}>
                                  {m.membership_status}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-bold text-sm">
                                <div className="flex items-center gap-1.5">
                                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  {m.loyalty_points}
                                </div>
                              </TableCell>
                              <TableCell className="font-black text-sm text-slate-900 dark:text-slate-100">${m.total_spent}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold">{m.last_checkin}</span>
                                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Check-in</span>
                                </div>
                              </TableCell>
                              <TableCell className="pr-8 text-right">
                                <button className="p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors">
                                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredMembers.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="h-64 text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <Users className="w-12 h-12 text-slate-200" />
                                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No matching members found</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                   </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCardUltra({ label, value, change, trend, icon: Icon, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
  };
  
  return (
    <Card className="rounded-[32px] border-none shadow-premium bg-white dark:bg-slate-900 p-8 group hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform duration-500", colorMap[color])}>
          <Icon className="w-7 h-7" />
        </div>
        <div className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider",
          trend === "up" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
        )}>
          {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">{label}</p>
        <p className="text-4xl font-display font-black tracking-tight">{value}</p>
      </div>
    </Card>
  );
}

function RetentionItem({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
        <span className="text-muted-foreground">{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 animate-pop">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{payload[0].payload.name}</p>
        <p className="text-xl font-black">${payload[0].value.toLocaleString()}</p>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 mt-1">
          <Activity className="w-3 h-3" />
          +12% Performance
        </div>
      </div>
    );
  }
  return null;
}
