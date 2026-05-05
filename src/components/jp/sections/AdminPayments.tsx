import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { DollarSign, AlertTriangle, CheckCircle, Download } from "lucide-react";
import { toast } from "sonner";

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

export default function AdminPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "expiring">("all");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("packages")
        .select(`id, user_id, name, price, start_date, end_date, status, profiles!inner(full_name)`)
        .order("end_date", { ascending: true });

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
    }
  };

  useEffect(() => { load(); }, [user]);

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 864e5);

  const filtered = payments.filter(p => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-extrabold">Payments Tracking</h2>
        <button onClick={exportCSV} className="px-4 py-2 rounded-xl bg-gradient-brand text-primary-foreground text-sm font-semibold flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Revenue Card */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Revenue (filtered)</p>
            <p className="font-display text-3xl font-extrabold">${totalRevenue}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-secondary rounded-xl p-1 w-fit">
        {(["all", "active", "expiring", "expired"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              filter === f ? "bg-gradient-brand text-primary-foreground shadow-brand" : "text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6">
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                  <th className="py-2">Member</th>
                  <th>Package</th>
                  <th>Price</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const expiring = new Date(p.end_date) <= sevenDays && new Date(p.end_date) >= now;
                  return (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="py-2 font-medium">{p.full_name}</td>
                      <td>{p.name}</td>
                      <td>${p.price}</td>
                      <td className="text-muted-foreground">{p.start_date}</td>
                      <td className="text-muted-foreground">{p.end_date}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          p.status === "active" && !expiring ? "bg-green-100 text-green-700" :
                          expiring ? "bg-orange-100 text-orange-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {expiring ? "Expiring Soon" : p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">No payments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
