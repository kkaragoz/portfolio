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
    // LocalStorage'dan kullanıcı tercihini oku
    const savedTheme = localStorage.getItem('darkMode');
    
    if (savedTheme !== null) {
      // Kullanıcı daha önce bir tercih yapmış
      setDarkMode(savedTheme === 'true');
    } else {
      // İlk kez, sistem saatine göre ayarla (18:00 - 06:00 arası)
      const hour = new Date().getHours();
      const shouldBeDark = hour >= 18 || hour < 6;
      setDarkMode(shouldBeDark);
      localStorage.setItem('darkMode', shouldBeDark.toString());
    }

    // Her dakika saat kontrolü yap (sadece kullanıcı tercih yapmamışsa)
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

  // Dark mode toggle fonksiyonu
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  return (
    <html lang="tr" className={darkMode ? 'dark' : ''}>
      <body className={`${inter.variable} antialiased`}>
        <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 gap-1">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
              
            />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
