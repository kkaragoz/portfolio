"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  ArrowLeftRight,
  BarChart3,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/symbols", label: "Semboller", icon: Tag },
    { href: "/transactions", label: "İşlemler", icon: ArrowLeftRight },
    { href: "/reports", label: "Raporlar", icon: BarChart3 },
  ];

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
        {collapsed && !mobile ? (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent)' }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>
              Portfolio
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {!collapsed && !mobile && (
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Ana Menü
          </p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md transition-all duration-200 ${
                collapsed && !mobile ? 'justify-center px-2 py-2.5 mx-auto' : 'px-3 py-2.5'
              }`}
              style={{
                background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                color: isActive ? 'var(--sidebar-active-text)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
              title={collapsed && !mobile ? item.label : undefined}
              onClick={mobile ? onClose : undefined}
            >
              <Icon className="w-[22px] h-[22px] flex-shrink-0" style={{ color: isActive ? 'var(--sidebar-active-text)' : 'var(--text-muted)' }} />
              {(!collapsed || mobile) && (
                <span className={`text-[13px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Collapse toggle */}
      {!mobile && (
        <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            title={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          {!collapsed && (
            <div className="text-center mt-1">
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>v1.5.1</span>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`${collapsed ? 'w-[70px]' : 'w-[220px]'} hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out`}
        style={{
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <NavContent />
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" onClick={onClose}>
          <div className="absolute inset-0 bg-black/40" />
          <aside
            className="absolute left-0 top-0 h-full w-[260px] flex flex-col animate-slide-in"
            style={{
              background: 'var(--bg-sidebar)',
              borderRight: '1px solid var(--border-color)',
              boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <NavContent mobile />
          </aside>
        </div>
      )}
    </>
  );
}