import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Calendar, Download, Filter } from "lucide-react";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  user_id: string;
  full_name: string;
  date: string;
  check_in: string;
}

export default function AdminAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("attendance")
        .select(`id, user_id, date, check_in, profiles!inner(full_name)`)
        .eq("date", dateFilter)
        .order("check_in", { ascending: false });

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
    }
  };

  useEffect(() => { load(); }, [user, dateFilter]);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-extrabold">Attendance Tracking</h2>
        <button onClick={exportCSV} className="px-4 py-2 rounded-xl bg-gradient-brand text-primary-foreground text-sm font-semibold flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"
          />
          <span className="text-sm text-muted-foreground">{records.length} check-ins</span>
        </div>

        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                  <th className="py-2">Name</th>
                  <th>Date</th>
                  <th>Check-in Time</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-2 font-medium">{r.full_name}</td>
                    <td className="text-muted-foreground">{r.date}</td>
                    <td className="text-muted-foreground">{new Date(r.check_in).toLocaleTimeString()}</td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">
                      No attendance records for this date.
                    </td>
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
