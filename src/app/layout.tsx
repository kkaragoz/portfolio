"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { useState, useEffect } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');

    if (savedTheme !== null) {
      setDarkMode(savedTheme === 'true');
    } else {
      const hour = new Date().getHours();
      const shouldBeDark = hour >= 18 || hour < 6;
      setDarkMode(shouldBeDark);
      localStorage.setItem('darkMode', shouldBeDark.toString());
    }

    const interval = setInterval(() => {
      const savedTheme = localStorage.getItem('darkMode');
      if (savedTheme === null) {
        const hour = new Date().getHours();
        const shouldBeDark = hour >= 18 || hour < 6;
        setDarkMode(shouldBeDark);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  return (
    <html lang="tr" className={darkMode ? 'dark' : ''}>
      <body className={`${inter.variable} antialiased`}>
        <div className="flex h-screen" style={{ background: 'var(--bg-body)' }}>
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <Header 
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
            />
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
