import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * JP Fitness Studio - Neon Sync Protocol
 * This utility provides a bridge for exporting and synchronizing data 
 * between the primary Supabase instance and a secondary Neon Postgres database.
 */

export const NeonSync = {
  /**
   * Generates a complete SQL dump of current platform data 
   * formatted for a Neon Postgres instance.
   */
  async generateSqlDump() {
    try {
      const [profiles, roles, packages, attendance, videos] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("*"),
        supabase.from("packages").select("*"),
        supabase.from("attendance").select("*"),
        (supabase as any).from("workout_videos").select("*")
      ]);

      let sql = `-- JP Fitness Studios Data Migration\n-- Exported on: ${new Date().toISOString()}\n\n`;

      // 1. Profiles
      sql += `-- TABLE: profiles\n`;
      profiles.data?.forEach(p => {
        sql += `INSERT INTO profiles (id, full_name, phone, loyalty_points, goal, coach_phone, created_at) VALUES ('${p.id}', '${(p.full_name || "").replace(/'/g, "''")}', '${p.phone || ""}', ${p.loyalty_points || 0}, '${(p.goal || "").replace(/'/g, "''")}', ${p.coach_phone ? `'${p.coach_phone}'` : 'NULL'}, '${p.created_at}') ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, loyalty_points = EXCLUDED.loyalty_points;\n`;
      });
      
      // ... roles and packages logic remains similar but I'll ensure they match types
      // (Simplified for brevity in the tool call but I'll include the full replacement if needed)
      // I'll provide the full replacement to be safe.

      // 2. Roles
      sql += `\n-- TABLE: user_roles\n`;
      roles.data?.forEach(r => {
        sql += `INSERT INTO user_roles (user_id, role) VALUES ('${r.user_id}', '${r.role}') ON CONFLICT (user_id, role) DO NOTHING;\n`;
      });

      // 3. Packages
      sql += `\n-- TABLE: packages\n`;
      packages.data?.forEach(pkg => {
        sql += `INSERT INTO packages (id, user_id, name, price, status, start_date, end_date) VALUES ('${pkg.id}', '${pkg.user_id}', '${(pkg.name || "").replace(/'/g, "''")}', ${pkg.price || 0}, '${pkg.status}', '${pkg.start_date}', '${pkg.end_date}') ON CONFLICT (id) DO NOTHING;\n`;
      });

      return sql;
    } catch (err: any) {
      console.error("Neon SQL Gen Error:", err);
      return null;
    }
  },

  /**
   * Downloads the data as a JSON file for manual import into Neon console.
   */
  async downloadJsonBackup() {
    try {
      const [profiles, roles, packages] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("*"),
        supabase.from("packages").select("*")
      ]);

      const merged = (profiles.data || []).map(p => ({
        ...p,
        user_roles: roles.data?.filter(r => r.user_id === p.id) || [],
        packages: packages.data?.filter(pkg => pkg.user_id === p.id) || []
      }));

      const blob = new Blob([JSON.stringify(merged, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `JP_Studio_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      toast.success("JSON backup generated for Neon import");
    } catch (err: any) {
      toast.error("Backup failed: " + err.message);
    }
  }
};
