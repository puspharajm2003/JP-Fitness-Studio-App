import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/components/jp/Layout";
import { useAuth } from "@/providers/AuthProvider";
import Dashboard from "@/components/jp/sections/Dashboard";
import Attendance from "@/components/jp/sections/Attendance";
import Progress from "@/components/jp/sections/Progress";
import Diet from "@/components/jp/sections/Diet";
import Workout from "@/components/jp/sections/Workout";
import Water from "@/components/jp/sections/Water";
import ActivityPage from "@/components/jp/sections/ActivityPage";
import Medications from "@/components/jp/sections/Medications";
import LoyaltyDashboard from "@/components/jp/sections/LoyaltyDashboard";
import Notifications from "@/components/jp/sections/Notifications";
import Profile from "@/components/jp/sections/Profile";
import Tool from "@/components/jp/sections/Tool";
import CoachCrmPanel from "@/components/jp/sections/CoachCrmPanel";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/tool" element={<Tool />} />
        <Route path="/diet" element={<Diet />} />
        <Route path="/workout" element={<Workout />} />
        <Route path="/coach" element={<CoachCrmPanel />} />
        <Route path="/water" element={<Water />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/medications" element={<Medications />} />
        <Route path="/rewards" element={<LoyaltyDashboard />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Layout>
  );
}
