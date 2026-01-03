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

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
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
    <aside
      className={`
        ${collapsed ? "w-16" : "w-56"}
        bg-white
        border-r border-gray-200
        transition-all duration-300 ease-in-out
        flex flex-col
        flex
        relative
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        {collapsed ? (
          <button
            aria-label="Menüyü genişlet"
            className="p-2 rounded-md hover:bg-gray-100"
            onClick={() => setOverlayOpen(true)}
            title="Menüyü genişlet"
          >
            <PanelLeftOpen className="w-5 h-5 text-gray-700" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FinanceApp
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? "px-2" : "px-5"} py-8 flex flex-col gap-1`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
                className={`
                  flex items-center gap-2 px-2 h-12 rounded-lg
                transition-all duration-200
                ${isActive 
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30" 
                  : "text-gray-700 hover:bg-gray-100"
                }
                ${collapsed ? "justify-center" : ""}
              `}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-white" : ""} ${collapsed ? "" : "ml-1"}`} />
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
              {!collapsed && isActive && (
                <span className="ml-auto w-2 h-2 bg-white rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            v1.0.0
          </div>
        </div>
      )}
    </aside>

    {/* Overlay sidebar for expanded view on small widths */}
    {overlayOpen && (
      <div className="fixed inset-0 z-50" onClick={() => setOverlayOpen(false)}>
        <div className="absolute inset-0 bg-black/40" />
        <aside
          className="absolute left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-16 flex items-center px-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FinanceApp
              </span>
            </div>
          </div>
          <nav className="flex-1 px-5 py-8 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-2 h-12 rounded-lg transition-all duration-200
                    ${isActive 
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30" 
                      : "text-gray-700 hover:bg-gray-100"}
                  `}
                  onClick={() => setOverlayOpen(false)}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-2 h-2 bg-white rounded-full" />
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