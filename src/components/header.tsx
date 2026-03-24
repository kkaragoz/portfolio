"use client";

import { Search, Menu, Sun, Moon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';

interface HeaderProps {
  onToggleSidebar: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Header({ onToggleSidebar, darkMode, onToggleDarkMode }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!formRef.current) return;
      const target = e.target as Node;
      if (!formRef.current.contains(target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveIndex(-1);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current as number);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const q = encodeURIComponent(searchQuery.trim());
        const res = await fetch(`/api/symbols?q=${q}`);
        const data = await res.json();
        setSuggestions(data || []);
        setShowSuggestions(true);
        setActiveIndex(-1);
      } catch (err) {
        console.error(err);
      }
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current as number);
    };
  }, [searchQuery]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch('/api/symbols');
      const data = await res.json();
      const q = searchQuery.trim().toLowerCase();
      const found = data.find((s: any) =>
        s.name?.toLowerCase() === q ||
        s.name?.toLowerCase().includes(q) ||
        s.code?.toLowerCase() === q ||
        s.code?.toLowerCase().includes(q) ||
        s.code1?.toLowerCase() === q ||
        s.code1?.toLowerCase().includes(q) ||
        s.code2?.toLowerCase() === q ||
        s.code2?.toLowerCase().includes(q) ||
        s.code3?.toLowerCase() === q ||
        s.code3?.toLowerCase().includes(q)
      );
      if (found) {
        if (window.location.pathname !== '/symbols') {
          try {
            await router.push('/symbols');
            setTimeout(() => window.dispatchEvent(new CustomEvent('openSymbol', { detail: found })), 200);
          } catch (err) {
            console.error('Navigation to /symbols failed', err);
            window.dispatchEvent(new CustomEvent('openSymbol', { detail: found }));
          }
        } else {
          window.dispatchEvent(new CustomEvent('openSymbol', { detail: found }));
        }
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Sembol Bulunamadı',
          text: 'Aradığınız sembol bulunamadı.',
          confirmButtonText: 'Tamam'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const selectSuggestion = async (s: any) => {
    setSearchQuery(s.name);
    setSuggestions([]);
    setShowSuggestions(false);
    if (window.location.pathname !== '/symbols') {
      await router.push('/symbols');
      setTimeout(() => window.dispatchEvent(new CustomEvent('openSymbol', { detail: s })), 200);
    } else {
      window.dispatchEvent(new CustomEvent('openSymbol', { detail: s }));
    }
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    if (activeIndex >= 0) {
      const el = document.querySelector(`[data-index='${activeIndex}']`) as HTMLElement | null;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  return (
    <header
      className="h-16 flex items-center gap-4 px-4 lg:px-6 relative z-20 flex-shrink-0"
      style={{
        background: 'var(--bg-header)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 rounded-md transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        aria-label="Menüyü aç"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-xl">
        <form ref={formRef} onSubmit={handleSearchSubmit} className="relative">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Sembol ara..."
              className="w-full pl-10 pr-4 py-2 rounded-md text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div
              className="absolute z-[60] left-0 right-0 mt-1 rounded-md max-h-72 overflow-auto"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-card-hover)',
              }}
            >
              {suggestions.map((s, idx) => (
                <div
                  key={s.id}
                  data-index={idx}
                  className="px-4 py-2.5 cursor-pointer transition-colors"
                  style={{
                    background: activeIndex === idx ? 'var(--bg-hover)' : 'transparent',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; setActiveIndex(idx); }}
                  onMouseLeave={(e) => { if (activeIndex !== idx) e.currentTarget.style.background = 'transparent'; }}
                  onClick={() => selectSuggestion(s)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {s.name}
                    </span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                    >
                      {s.code || s.code1 || s.code2 || s.code3 || '-'}
                    </span>
                  </div>
                  {s.note && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-md transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          title={darkMode ? 'Açık temaya geç' : 'Koyu temaya geç'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
