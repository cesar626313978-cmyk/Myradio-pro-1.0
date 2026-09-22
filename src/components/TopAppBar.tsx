import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { TabType } from '../types/radio';

interface TopAppBarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onToggleCarMode: () => void;
  isCarMode: boolean;
  onOpenSettings: () => void;
  lang: 'ES' | 'EN';
  onToggleLang: () => void;
  user: User | null;
  onLoginWithGoogle: () => void;
  onLogout: () => void;
  isSyncing?: boolean;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentTab,
  onSelectTab,
  onToggleCarMode,
  isCarMode,
  onOpenSettings,
  user,
  onLoginWithGoogle,
  onLogout,
  isSyncing = false,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navTabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'descubrir', label: 'Descubrir', icon: 'search' },
    { id: 'generos', label: 'Géneros', icon: 'category' },
    { id: 'paises', label: 'Países', icon: 'public' },
    { id: 'favoritas', label: 'Favoritas', icon: 'favorite' },
    { id: 'alarmas', label: 'Alarmas', icon: 'alarm' },
    { id: 'historial', label: 'Historial', icon: 'analytics' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#1A1A1A] border-b-3 border-black w-full shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone: 1 single clean line */}
        <div
          onClick={() => onSelectTab('descubrir')}
          className="flex items-center gap-2 cursor-pointer select-none group shrink-0"
        >
          <div className="w-9 h-9 bg-[#4edea3] border-2 border-black flex items-center justify-center font-black text-black text-xl group-hover:rotate-6 transition-transform">
            <span className="material-symbols-outlined text-black font-black text-2xl">
              radio
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-xl tracking-tighter text-white uppercase font-['Inter']">
              Myradio 1.0 Pro
            </span>
            <span className="bg-[#8B5CF6] text-white text-[9px] font-mono-tech font-bold px-1.5 py-0.5 border border-black uppercase hidden sm:inline-block">
              LIVE
            </span>
          </div>
        </div>

        {/* Navigation links (4-6 single-line links) */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {navTabs.map(tab => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 font-mono-tech text-xs font-bold uppercase transition-all whitespace-nowrap shrink-0 border-2 border-black flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#4edea3] text-[#003824] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#201f1f] text-[#e5e2e1] hover:bg-[#353534]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Actions Zone: Car Mode + Settings + Google Auth (User Login/Logout) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Car Mode Quick Toggle */}
          <button
            onClick={onToggleCarMode}
            className={`neo-button px-3 py-1.5 font-mono-tech text-xs font-extrabold uppercase flex items-center gap-1.5 whitespace-nowrap ${
              isCarMode
                ? 'bg-[#06B6D4] text-black'
                : 'bg-[#201f1f] text-white hover:bg-[#353534]'
            }`}
            title="Modo Coche para conducción"
          >
            <span className="material-symbols-outlined text-base">directions_car</span>
            <span className="hidden sm:inline">Modo Coche</span>
          </button>

          {/* User Auth Profile (Firebase + Gmail) */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-[#201f1f] border-2 border-black p-1 pr-2.5 hover:bg-[#353534] transition-colors"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="w-7 h-7 rounded-full border border-black object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#8B5CF6] text-white border border-black flex items-center justify-center font-bold text-xs">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <div className="font-mono-tech text-[11px] font-bold text-white truncate max-w-[110px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="font-mono-tech text-[9px] text-[#4edea3] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                    {isSyncing ? 'SYNC...' : 'CLOUD SYNC'}
                  </div>
                </div>
                <span className="material-symbols-outlined text-sm text-[#bbcabf]">
                  arrow_drop_down
                </span>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#201f1f] border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3 flex flex-col gap-2 z-50">
                  <div className="border-b-2 border-black pb-2">
                    <div className="font-bold text-white text-xs truncate">
                      {user.displayName || 'Usuario de Google'}
                    </div>
                    <div className="font-mono-tech text-[10px] text-[#bbcabf] truncate">
                      {user.email}
                    </div>
                    <div className="mt-1 font-mono-tech text-[9px] text-[#10B981] bg-black/40 px-2 py-0.5 border border-black flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">cloud_done</span>
                      Favoritas y alarmas sincronizadas
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="neo-button bg-[#EF4444] text-white font-mono-tech text-xs font-bold py-2 border-2 border-black uppercase flex items-center justify-center gap-2 hover:bg-[#dc2626]"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLoginWithGoogle}
              className="neo-button bg-white text-black font-mono-tech text-xs font-bold px-3 py-1.5 border-2 border-black flex items-center gap-2 uppercase hover:bg-[#e5e2e1] whitespace-nowrap"
              title="Iniciar sesión con Google para sincronizar tus preferencias"
            >
              {/* Google G Icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Acceder con Gmail</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 bg-[#201f1f] text-white border-2 border-black hover:bg-[#353534] transition-colors"
            title="Ajustes"
          >
            <span className="material-symbols-outlined text-lg">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
