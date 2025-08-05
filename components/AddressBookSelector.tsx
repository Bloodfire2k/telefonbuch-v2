'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Users } from 'lucide-react';

interface AddressBook {
  name: string;
  count: number;
  url: string;
}

interface AddressBookSelectorProps {
  addressBooks: AddressBook[];
  selectedAddressBook: string | null;
  onAddressBookSelect: (addressBookName: string | null) => void;
}

export default function AddressBookSelector({
  addressBooks,
  selectedAddressBook,
  onAddressBookSelect
}: AddressBookSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddressBookClick = (addressBookName: string) => {
    setIsLoading(true);
    onAddressBookSelect(addressBookName);
    // Loading-Status nach kurzer Verzögerung zurücksetzen
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleShowAll = () => {
    setIsLoading(true);
    onAddressBookSelect(null);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
        Adressbücher
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* "Alle Adressbücher" Option */}
        <button
          onClick={handleShowAll}
          disabled={isLoading}
          className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
            selectedAddressBook === null
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-3 text-blue-600" />
              <div>
                <div className="font-medium">Alle Adressbücher</div>
                <div className="text-sm text-gray-500">
                  {addressBooks.reduce((sum, book) => sum + book.count, 0)} Kontakte
                </div>
              </div>
            </div>
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </div>
        </button>

        {/* Einzelne Adressbücher */}
        {addressBooks.map((addressBook) => (
          <button
            key={addressBook.name}
            onClick={() => handleAddressBookClick(addressBook.name)}
            disabled={isLoading}
            className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
              selectedAddressBook === addressBook.name
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 mr-3 text-blue-600" />
                <div>
                  <div className="font-medium">{addressBook.name}</div>
                  <div className="text-sm text-gray-500">
                    {addressBook.count} Kontakte
                  </div>
                </div>
              </div>
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 