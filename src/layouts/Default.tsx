import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';

export default function DefaultLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <Outlet />
    </div>
  );
}
