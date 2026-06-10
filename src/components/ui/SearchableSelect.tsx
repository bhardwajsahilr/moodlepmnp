import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  helper?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  id?: string;
}

export function SearchableSelect({
  label,
  helper,
  error,
  options,
  placeholder = 'Select…',
  value,
  onChange,
  id,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleOpen() {
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSelect(opt: Option) {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
  }

  return (
    <div className="space-y-1" ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-gray-600">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          id={inputId}
          type="button"
          onClick={handleOpen}
          className={`w-full px-3 py-2.5 rounded-lg border text-sm bg-white text-left flex items-center justify-between transition-colors duration-150
            ${error
              ? 'border-red-300 bg-red-50/30 focus:ring-red-200 focus:border-red-400'
              : open
                ? 'border-secondary ring-2 ring-secondary/30'
                : 'border-gray-200 hover:border-gray-300'
            }
            focus:outline-none`}
        >
          <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-md">
                <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search…"
                  className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>
            <ul className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-xs text-gray-400 text-center">No options found</li>
              )}
              {filtered.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-primary-50 transition-colors"
                  >
                    <span className={opt.value === value ? 'text-primary font-medium' : 'text-gray-700'}>
                      {opt.label}
                    </span>
                    {opt.value === value && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!error && helper && <p className="text-xs text-gray-400">{helper}</p>}
    </div>
  );
}
