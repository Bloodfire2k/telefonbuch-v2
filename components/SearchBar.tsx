'use client';

import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';

interface SearchBarProps {
  onSearch: (term: string) => void;
  onRefresh: () => void;
}

export default function SearchBar({ onSearch, onRefresh }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleRefresh = () => {
    setSearchTerm('');
    onRefresh();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Nach Kontakten suchen..."
          value={searchTerm}
          onChange={handleInputChange}
          className="search-input w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <button
        onClick={handleRefresh}
        className="btn-primary flex items-center justify-center gap-2 px-4 py-2"
      >
        <RefreshCw className="w-4 h-4" />
        Aktualisieren
      </button>
    </div>
  );
} 