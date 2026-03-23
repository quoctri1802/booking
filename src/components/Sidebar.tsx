import React from 'react';
import { LayoutDashboard, Users, MessageSquare, LogOut, Activity, Shield } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: 'chat' | 'dashboard' | 'patients' | 'interactions' | 'users';
  setActiveTab: (tab: 'chat' | 'dashboard' | 'patients' | 'interactions' | 'users') => void;
  onLogout: () => void;
  user: any;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onLogout, user, isOpen, onClose }: SidebarProps) {
  const menuItems = [
    { id: 'chat', label: 'Tổng đài AI', icon: MessageSquare },
    { id: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
    { id: 'patients', label: 'Danh sách lịch hẹn', icon: Users },
    { id: 'interactions', label: 'Lịch sử tương tác', icon: Activity },
  ];

  if (user.role === 'admin' || user.role === 'staff') {
    menuItems.push({ id: 'users', label: 'Quản lý nhân viên', icon: Shield });
  }

  const handleTabClick = (id: any) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen shadow-xl transition-transform duration-300 lg:relative lg:translate-x-0 lg:shadow-sm",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-100">
              <Activity className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Lien Chieu</h2>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Medical Center</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 lg:hidden">
              <LogOut className="w-5 h-5 rotate-180" />
            </button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                activeTab === item.id
                  ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm ring-1 ring-emerald-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                activeTab === item.id ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
              )} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/30">
        <div className="mb-4 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} referrerPolicy="no-referrer" />
              ) : (
                <span className="text-emerald-700 font-bold text-sm">{user.displayName?.[0]}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user.displayName}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider truncate">{user.email}</p>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
    </>
  );
}
