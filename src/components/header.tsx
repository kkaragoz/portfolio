"use client";

import { Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Click outside to close suggestions
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

  // Fetch suggestions on input (debounced)
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
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center">
      {/* Search Bar */}
      <div className="flex-1 max-w-2xl translate-x-[12px]">
        <form 
          ref={formRef} 
          onSubmit={handleSearchSubmit} 
          className="relative"
        >
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Sembol ara... (örn: AAPL, Tesla)"
              className="w-full pl-4 pr-10 py-2 bg-gray-100 border border-transparent focus:border-blue-500 rounded-lg text-sm outline-none transition-colors text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-auto">
              {suggestions.map((s, idx) => (
                <div
                  key={s.id}
                  data-index={idx}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors ${
                    activeIndex === idx ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => selectSuggestion(s)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm text-gray-900">
                      {s.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {s.code || s.code1 || s.code2 || s.code3 || '-'}
                    </div>
                  </div>
                  {s.note && (
                    <div className="text-xs text-gray-500 mt-1">
                      {s.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </form>
      </div>


    </header>
  );
}
