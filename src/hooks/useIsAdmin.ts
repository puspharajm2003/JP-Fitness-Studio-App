import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCoach, setIsCoach] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsCoach(false);
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    // Check if super admin email
    const SUPER_ADMIN_EMAIL = "puspharaj.m2003@gmail.com";
    if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setIsAdmin(true);
      setIsCoach(true);
      setIsSuperAdmin(true);
      setLoading(false);
      return;
    }

    async function checkRole() {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        const role = data?.role as string;
        setIsAdmin(role === "admin" || role === "super_admin");
        setIsCoach(role === "coach" || role === "admin" || role === "super_admin");
        setIsSuperAdmin(role === "super_admin");
      } catch (err) {
        setIsAdmin(false);
        setIsCoach(false);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkRole();
  }, [user]);

  return { isAdmin, isCoach, isSuperAdmin, loading };
}
