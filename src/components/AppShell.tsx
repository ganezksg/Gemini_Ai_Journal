import React, { useState } from 'react';
import {
  LayoutGrid,
  BookOpen,
  FileText,
  TreePine,
  BrainCircuit,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Sparkles,
  Sprout
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavigationTab = 'dashboard' | 'journal' | 'summarize' | 'topics-tree' | 'insights' | 'settings';

interface AppShellProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  journalCount: number;
  completedSummaryCount: number;
  fullBleed?: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onTabChange,
  journalCount,
  completedSummaryCount,
  fullBleed = false,
  children,
}) => {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number; showcase?: boolean }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
    },
    {
      id: 'journal',
      label: 'Journal',
      icon: BookOpen,
      badge: journalCount > 0 ? journalCount : undefined,
    },
    {
      id: 'summarize',
      label: 'Summarize',
      icon: FileText,
      badge: completedSummaryCount > 0 ? completedSummaryCount : undefined,
    },
    {
      id: 'topics-tree',
      label: 'Topics Tree',
      icon: TreePine,
      showcase: true,
    },
    {
      id: 'insights',
      label: 'Reflection Insights',
      icon: BrainCircuit,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleSelectTab = (tab: NavigationTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  // The 4 core primary navigation sections for mobile bottom bar
  const bottomNavItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: LayoutGrid,
    },
    {
      id: 'journal' as NavigationTab,
      label: 'Journal',
      icon: BookOpen,
      badge: journalCount > 0 ? journalCount : undefined,
    },
    {
      id: 'topics-tree' as NavigationTab,
      label: 'Topics Tree',
      icon: TreePine,
    },
    {
      id: 'insights' as NavigationTab,
      label: 'Insights',
      icon: BrainCircuit,
    },
  ];

  return (
    <div className="h-[100dvh] md:h-auto md:min-h-screen bg-[#FAF8F5] text-[#1E2922] flex flex-col md:flex-row font-sans overflow-hidden md:overflow-visible">
      {/* ========================================================================= */}
      {/* 1. DESKTOP LEFT SIDEBAR */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#FAF8F5] border-r border-[#EBE5DC] p-5 shrink-0 sticky top-0 h-screen justify-between z-30">
        <div className="space-y-6">
          {/* EMORA Branding */}
          <div className="flex items-center gap-3 px-2 py-1.5 cursor-pointer" onClick={() => handleSelectTab('dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-[#324C3D] text-[#E8F3EB] flex items-center justify-center shadow-xs border border-[#23382C]">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-[#1E2922] tracking-wider leading-none">
                EMORA
              </h1>
              <span className="text-[11px] font-medium text-[#7A8A7F] tracking-wide">
                Personal Reflection
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all duration-200 group active:scale-[0.98] ${
                    isActive
                      ? 'bg-[#EBF2EE] text-[#1D3526] shadow-2xs font-semibold'
                      : 'text-[#5A6B60] hover:text-[#1E2922] hover:bg-[#F2ECE4]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-[#324C3D]' : 'text-[#7B8B80] group-hover:text-[#324C3D]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.showcase && (
                      <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#D4E8DC] text-[#22442F] border border-[#B8D7C4]">
                        Living
                      </span>
                    )}

                    {item.badge !== undefined && !item.showcase && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E5DFD6] text-[#425046]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Card & Sign Out at bottom of Left Sidebar */}
        <div className="pt-4 border-t border-[#EBE5DC] space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#E2ECE5] border border-[#C6DACB] text-[#2C4837] flex items-center justify-center font-serif text-xs font-bold shrink-0">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'E')}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1E2922] truncate">
                  {user?.displayName || 'Journaler'}
                </p>
                <p className="text-[10px] text-[#78887D] truncate">
                  {user?.email || 'Private Account'}
                </p>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-xl text-[#7E8E83] hover:text-[#1E2922] hover:bg-[#F2ECE4] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-[#F0EBE2] text-[10px] text-[#5C6E62]">
            <ShieldCheck className="w-3 h-3 text-[#4A6B56]" />
            <span>Per-User Firestore Guarded</span>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MOBILE TOP NAVIGATION BAR */}
      {/* ========================================================================= */}
      {!fullBleed && (
        <header className="md:hidden bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EBE5DC] sticky top-0 z-40 px-4 h-15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5" onClick={() => handleSelectTab('dashboard')}>
            <div className="w-8 h-8 rounded-xl bg-[#324C3D] text-[#E8F3EB] flex items-center justify-center shadow-xs">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-serif text-base font-bold text-[#1E2922] tracking-wider leading-none">
                EMORA
              </h1>
              <span className="text-[10px] text-[#7A8A7F]">
                {navItems.find((n) => n.id === activeTab)?.label || 'Reflection'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-2xl bg-white border border-[#EBE5DC] text-[#324C3D] shadow-2xs"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>
      )}

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-[#FAF8F5] rounded-t-3xl border-t border-[#EBE5DC] p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#324C3D] text-white flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </div>
                <h2 className="font-serif font-bold text-lg text-[#1E2922]">EMORA</h2>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full text-[#7B8B80] hover:bg-[#EBE5DC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-medium ${
                      isActive ? 'bg-[#EBF2EE] text-[#1D3526] font-semibold' : 'text-[#5A6B60]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-[#324C3D]" />
                      <span>{item.label}</span>
                    </div>
                    {item.showcase && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#D4E8DC] text-[#22442F]">
                        Living
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-[#EBE5DC] flex items-center justify-between">
              <div className="text-xs">
                <p className="font-semibold text-[#1E2922]">{user?.displayName || 'Journaler'}</p>
                <p className="text-[10px] text-[#7A8A7F]">{user?.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5DFD5] text-xs text-[#5A6B60]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN APPLICATION CONTENT AREA */}
      {/* ========================================================================= */}
      <main
        className={`flex-1 min-w-0 w-full ${
          fullBleed
            ? 'p-0 max-w-full flex flex-col mobile-journal-main overflow-hidden'
            : 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto mobile-scroll-padding overflow-y-auto'
        }`}
      >
        {children}
      </main>

      {/* ========================================================================= */}
      {/* 4. MOBILE BOTTOM NAVIGATION BAR (FIXED) */}
      {/* ========================================================================= */}
      <nav
        id="mobile-bottom-navigation"
        aria-label="Mobile Navigation Bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[#EBE5DC] px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.03)]"
      >
        <div className="grid grid-cols-4 items-center justify-around gap-1 max-w-md mx-auto">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => handleSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-[#EBF2EE] text-[#1D3526] font-semibold'
                    : 'text-[#65766B] hover:text-[#1E2922] hover:bg-[#F4EFE7]'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-[#324C3D]' : 'text-[#7B8B80]'
                    }`}
                  />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 text-[9px] font-bold rounded-full bg-[#324C3D] text-[#E8F3EB] flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-1 leading-tight truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
