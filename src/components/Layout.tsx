import { Outlet } from 'react-router';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex h-screen bg-[#08080C]">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
