import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Coach {
  id: string;
  full_name: string;
  phone: string;
  role: 'coach' | 'admin' | 'super_admin';
}

export function useCoaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);

  useEffect(() => {
    async function fetchCoaches() {
      // Fetch all user_ids with coach or admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["coach", "admin", "super_admin"] as any[]);

      if (!roleData) return;

      const userIds = roleData.map(r => r.user_id);
      const roleMap = new Map(roleData.map(r => [r.user_id, r.role]));

      // Fetch profiles for these user_ids
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", userIds);

      if (profiles) {
        const mapped = profiles.map(p => ({
          ...p,
          role: roleMap.get(p.id) as any
        }));
        setCoaches(mapped);
      }
    }

    fetchCoaches();
  }, []);

  return coaches;
}
