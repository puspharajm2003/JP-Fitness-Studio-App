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
      const [profiles, roles, packages, attendance, redemptions] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("*"),
        supabase.from("packages").select("*"),
        supabase.from("attendance").select("*"),
        supabase.from("redemptions").select("*")
      ]);

      let sql = `-- JP Fitness Studios - Advanced Data Sync\n-- Timestamp: ${new Date().toISOString()}\n\n`;
      sql += `BEGIN;\n\n`;

      // 1. Profiles
      sql += `-- SYNC: profiles\n`;
      profiles.data?.forEach(p => {
        sql += `INSERT INTO profiles (id, full_name, phone, loyalty_points, goal, target_weight_kg, daily_calorie_goal, daily_water_goal_ml, coach_phone, created_at) VALUES ('${p.id}', '${(p.full_name || "").replace(/'/g, "''")}', '${p.phone || ""}', ${p.loyalty_points || 0}, '${p.goal || "weight_loss"}', ${p.target_weight_kg || 'NULL'}, ${p.daily_calorie_goal || 2000}, ${p.daily_water_goal_ml || 2500}, ${p.coach_phone ? `'${p.coach_phone}'` : 'NULL'}, '${p.created_at}') ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, loyalty_points = EXCLUDED.loyalty_points, updated_at = NOW();\n`;
      });
      
      // 2. Roles
      sql += `\n-- SYNC: user_roles\n`;
      roles.data?.forEach(r => {
        sql += `INSERT INTO user_roles (user_id, role) VALUES ('${r.user_id}', '${r.role}') ON CONFLICT (user_id, role) DO NOTHING;\n`;
      });

      // 3. Packages
      sql += `\n-- SYNC: packages\n`;
      packages.data?.forEach(pkg => {
        sql += `INSERT INTO packages (id, user_id, name, price, status, start_date, end_date) VALUES ('${pkg.id}', '${pkg.user_id}', '${(pkg.name || "").replace(/'/g, "''")}', ${pkg.price || 0}, '${pkg.status}', '${pkg.start_date}', '${pkg.end_date}') ON CONFLICT (id) DO NOTHING;\n`;
      });

      // 4. Attendance
      sql += `\n-- SYNC: attendance\n`;
      attendance.data?.forEach(att => {
        sql += `INSERT INTO attendance (user_id, date) VALUES ('${att.user_id}', '${att.date}') ON CONFLICT (user_id, date) DO NOTHING;\n`;
      });

      // 5. Redemptions
      sql += `\n-- SYNC: redemptions\n`;
      redemptions.data?.forEach(red => {
        sql += `INSERT INTO redemptions (id, user_id, reward_name, points_cost, redeemed_at) VALUES ('${red.id}', '${red.user_id}', '${(red.reward_name || "").replace(/'/g, "''")}', ${red.points_cost}, '${red.redeemed_at}') ON CONFLICT (id) DO NOTHING;\n`;
      });

      sql += `\nCOMMIT;\n`;
      return sql;
    } catch (err: any) {
      console.error("Neon SQL Export Protocol Failure:", err);
      toast.error("SQL Export failed");
      return null;
    }
  },

  /**
   * Generates a direct SQL download for the administrator.
   */
  async exportToNeon() {
    const sql = await this.generateSqlDump();
    if (!sql) return;

    const blob = new Blob([sql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `JP_Studio_Neon_Migration_${new Date().toISOString().split('T')[0]}.sql`;
    link.click();
    toast.success("Neon Migration Script Ready", {
      description: "Upload this script to the Neon SQL Console to sync data."
    });
  }
};
