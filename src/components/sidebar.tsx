"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  ArrowLeftRight,
  BarChart3,
  TrendingUp,
  PanelLeftOpen,
} from "lucide-react";
import { useState, useEffect } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Responsive: Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { 
      href: "/", 
      label: "Dashboard", 
      icon: LayoutDashboard 
    },
    { 
      href: "/symbols", 
      label: "Semboller", 
      icon: Tag 
    },
    { 
      href: "/transactions", 
      label: "İşlemler", 
      icon: ArrowLeftRight 
    },
    { 
      href: "/reports", 
      label: "Raporlar", 
      icon: BarChart3 
    },
  ];

  return (
    <>
    {/* Desktop Sidebar - Hidden on mobile */}
    <aside
      className={`
        ${collapsed ? "w-0 lg:w-16" : "w-0 lg:w-44"}
        bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl
        border-r border-white/20 dark:border-slate-700/50
        shadow-2xl shadow-blue-500/5 dark:shadow-purple-500/10
        transition-all duration-300 ease-in-out
        flex-col
        ${collapsed ? "hidden lg:flex" : "hidden lg:flex"}
        relative
        z-10
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/20 dark:border-slate-700/50">
        {collapsed ? (
          <button
            aria-label="Menüyü genişlet"
            className="p-2 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all"
            onClick={onClose}
            title="Menüyü genişlet"
          >
            <PanelLeftOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              FinanceApp
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? "px-2" : "px-4"} py-6 flex flex-col gap-2`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
                className={`
                  flex items-center gap-3 px-4 h-12 rounded-xl
                transition-all duration-300
                ${isActive 
                  ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/40 scale-105" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-600 hover:scale-105 hover:shadow-md"
                }
                ${collapsed ? "justify-center" : ""}
              `}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-600 dark:text-gray-400"} ${collapsed ? "" : ""}transition-transform duration-300 ${isActive ? "" : "group-hover:scale-110"}`} />
              {!collapsed && (
                <span className="font-semibold text-sm">{item.label}</span>
              )}
              {!collapsed && isActive && (
                <span className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-white/20 dark:border-slate-700/50">
          <div className="text-xs font-medium text-gray-400 dark:text-gray-500 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            v1.1.1
          </div>
        </div>
      )}
    </aside>

    {/* Mobile Overlay Sidebar */}
    {isOpen && (
      <div className="fixed inset-0 z-[100] lg:hidden" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <aside
          className="absolute left-0 top-0 h-full w-72 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/50 shadow-2xl z-[101]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-16 flex items-center px-4 border-b border-white/20 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                FinanceApp
              </span>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 h-12 rounded-xl transition-all duration-300
                    ${isActive 
                      ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/40 scale-105" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-600 hover:scale-105 hover:shadow-md"}
                  `}
                  onClick={onClose}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-600 dark:text-gray-400"}`} />
                  <span className="font-semibold text-sm">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>
    )}
    </>
  );
}