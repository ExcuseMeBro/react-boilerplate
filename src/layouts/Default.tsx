import { Outlet, useNavigation } from "react-router-dom";
import { RouteLoading } from "@/components/layout/RouteStatus";
import Navbar from "@/components/layout/Navbar";

export default function DefaultLayout() {
  const navigation = useNavigation();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      {navigation.state !== "idle" && <RouteLoading />}
      <Outlet />
    </div>
  );
}
