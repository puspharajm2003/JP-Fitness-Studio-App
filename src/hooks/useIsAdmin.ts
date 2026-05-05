import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Check if super admin email
    const SUPER_ADMIN_EMAIL = "puspharaj.m2003@gmail.com";
    if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    // Check role in database
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.role === "admin");
        setLoading(false);
      })
      .catch(() => {
        setIsAdmin(false);
        setLoading(false);
      });
  }, [user]);

  return { isAdmin, loading };
}
