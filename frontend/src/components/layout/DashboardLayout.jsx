import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen lg:pl-64">
      <Sidebar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
