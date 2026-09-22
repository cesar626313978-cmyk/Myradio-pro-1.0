import React from 'react';
import { TabType } from '../types/radio';

interface SideNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  favoritesCount: number;
  alarmsCount?: number;
}

export const SideNav: React.FC<SideNavProps> = ({
  currentTab,
  onSelectTab,
  favoritesCount,
}) => {
  const navItems: { id: TabType; label: string; icon: string; badge?: number }[] = [
    { id: 'descubrir', label: 'Buscador', icon: 'search' },
    { id: 'favoritas', label: 'Favoritas', icon: 'favorite', badge: favoritesCount },
    { id: 'coche', label: 'Modo Coche', icon: 'directions_car' },
  ];

  return (
    <aside className="hidden md:flex flex-col gap-6 p-6 h-[calc(100vh-68px)] border-r-3 border-black w-64 bg-[#131313] shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] shrink-0 sticky top-[68px] z-30">
      {/* Title */}
      <div>
        <h2 className="font-mono-tech text-xs tracking-widest text-[#bbcabf] uppercase mb-1">
          SYSTEM_CONTROL
        </h2>
        <h1 className="font-black text-3xl tracking-tighter text-[#4edea3] uppercase leading-none">
          SIGNAL<br />ZERO
        </h1>
      </div>

      {/* Nav List */}
      <nav className="flex flex-col gap-2.5 flex-1">
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center justify-between p-3.5 border-3 border-black font-mono-tech text-sm font-bold text-left uppercase transition-all duration-100 ${
                isActive
                  ? 'bg-[#4edea3] text-[#003824] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-1'
                  : 'bg-[#201f1f] text-[#e5e2e1] hover:bg-[#353534] hover:translate-x-0.5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-xl"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 border-2 border-black font-bold font-mono-tech ${
                    isActive ? 'bg-black text-[#4edea3]' : 'bg-[#353534] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Pill */}
      <div className="p-3 bg-[#1A1A1A] border-3 border-black flex flex-col gap-1">
        <div className="flex items-center justify-between font-mono-tech text-[10px] text-[#bbcabf]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            RADIO ENGINE
          </span>
          <span className="text-[#10B981] font-bold">ONLINE</span>
        </div>
        <div className="font-mono-tech text-[9px] text-[#86948a] truncate">
          STREAM BUFFER: 128KB | AUTO-SYNC
        </div>
      </div>
    </aside>
  );
};
