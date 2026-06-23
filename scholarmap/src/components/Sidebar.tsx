import { NavLink } from 'react-router';
import { LayoutDashboard, Bookmark, BarChart3, Settings, Search } from 'lucide-react';

const navItems = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/library', label: 'Library', icon: Bookmark },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-[240px] min-h-screen bg-[#0F0F14] border-r border-[#23232D] flex flex-col shrink-0">
      <div className="flex items-center gap-2 px-5 h-14 border-b border-[#23232D]">
        <Search size={18} className="text-[#6366F1]" />
        <span className="text-sm font-semibold text-[#F0F0F5]">ScholarMap</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#6366F1]/10 text-[#6366F1] font-medium'
                  : 'text-[#8A8A98] hover:text-[#F0F0F5] hover:bg-[#1E1E28]'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
