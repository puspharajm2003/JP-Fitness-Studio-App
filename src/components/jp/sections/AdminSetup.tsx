import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Shield, CheckCircle, AlertTriangle, UserPlus } from "lucide-react";
import { toast } from "sonner";

const SUPER_ADMIN_EMAIL = "puspharaj.m2003@gmail.com";

export default function AdminSetup() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [hasRole, setHasRole] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav("/auth", { replace: true });
      return;
    }

    // Check if current user is the super admin email
    const email = user.email || "";
    const isSA = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    setIsSuperAdmin(isSA);

    if (!isSA) {
      // Check if they have admin role
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setHasRole(data?.role === "admin");
          setChecking(false);
          if (!data || data.role !== "admin") {
            toast.error("Access denied. Admin only.");
            nav("/", { replace: true });
          }
        });
    } else {
      // Super admin - ensure they have admin role
      supabase
        .from("user_roles")
        .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id, role" })
        .then(() => {
          setHasRole(true);
          setChecking(false);
          toast.success("Super admin access granted!");
        });
    }
  }, [user, loading, nav]);

  if (loading || checking) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-3xl p-7 md:p-10">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h2 className="font-display text-2xl font-extrabold">Admin Setup</h2>
            <p className="text-sm text-muted-foreground">
              {isSuperAdmin ? "Super Admin Panel" : "Admin Panel"}
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="font-semibold text-green-800">Super Admin Access</p>
            </div>
            <p className="text-sm text-green-700 mt-1">
              {SUPER_ADMIN_EMAIL} has full administrative privileges.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-display font-bold">Create New Admin</h3>
          <CreateAdminForm isSuperAdmin={isSuperAdmin} />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-bold mb-4">Admin Actions</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href="/admin"
            className="px-4 py-2 rounded-xl bg-gradient-brand text-primary-foreground text-sm font-semibold"
          >
            Go to CRM Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

function CreateAdminForm({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    try {
      // Find user by email in profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .single();

      if (!profiles) {
        toast.error("User not found with that email");
        return;
      }

      // Assign admin role
      const { error } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: profiles.id, role: "admin" },
          { onConflict: "user_id, role" }
        );

      if (error) throw error;
      toast.success(`Made ${email} an admin!`);
      setEmail("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-800">
            Only the super admin can create new admins.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={createAdmin} className="flex gap-2">
      <input
        type="email"
        required
        placeholder="user@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"
      />
      <button
        disabled={busy}
        className="px-4 py-2 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-semibold disabled:opacity-60"
      >
        <UserPlus className="w-4 h-4 inline mr-1" />
        Make Admin
      </button>
    </form>
  );
}
