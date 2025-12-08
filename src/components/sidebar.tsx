"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  TrendingUp,
  BarChart3,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  { href: "/", label: "Giriş", icon: Home },
  { href: "/symbols", label: "Sembollar", icon: Package },
  { href: "/transactions", label: "İşlemler", icon: TrendingUp },
  { href: "/reports", label: "Raporlar", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col h-full`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        {!collapsed && <span className="font-bold text-sm">MENU</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
        >
          <ChevronLeft
            size={18}
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-500 text-white"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title={collapsed ? item.label : ""}
            >
              <Icon size={20} />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        {!collapsed && <p>v1.0.0</p>}
      </div>
    </aside>
  );
}
