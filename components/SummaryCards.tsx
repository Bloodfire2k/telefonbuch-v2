import React from 'react';
import { User } from 'lucide-react';

export interface AddressBook {
  name: string;
  count: number;
  url: string;
}

export interface SummaryCardsProps {
  addressBooks: AddressBook[];
  onAddressBookSelect?: (addressBookName: string | null) => void;
  selectedAddressBook?: string | null;
}

export default function SummaryCards({ addressBooks, onAddressBookSelect, selectedAddressBook }: SummaryCardsProps) {
  const handleAddressBookClick = (addressBookName: string) => {
    if (onAddressBookSelect) {
      // If the same address book is clicked again, deselect it
      const newSelection = selectedAddressBook === addressBookName ? null : addressBookName;
      onAddressBookSelect(newSelection);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {addressBooks.map((addressBook) => (
        <button
          key={addressBook.name}
          onClick={() => handleAddressBookClick(addressBook.name)}
          className={`
            relative p-4 rounded-lg shadow-md transition-all duration-200 
            ${selectedAddressBook === addressBook.name
              ? 'bg-blue-600 text-white shadow-lg transform scale-105'
              : 'bg-white hover:bg-blue-50 hover:shadow-lg hover:scale-105'
            }
            border border-gray-200 hover:border-blue-300
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`
                p-2 rounded-full 
                ${selectedAddressBook === addressBook.name
                  ? 'bg-white bg-opacity-20'
                  : 'bg-blue-100'
                }
              `}>
                <User className={`
                  h-5 w-5 
                  ${selectedAddressBook === addressBook.name
                    ? 'text-white'
                    : 'text-blue-600'
                  }
                `} />
              </div>
              <div className="text-left">
                <h3 className={`
                  font-semibold text-sm
                  ${selectedAddressBook === addressBook.name
                    ? 'text-white'
                    : 'text-gray-800'
                  }
                `}>
                  {addressBook.name}
                </h3>
                <p className={`
                  text-xs font-medium
                  ${selectedAddressBook === addressBook.name
                    ? 'text-blue-100'
                    : 'text-gray-500'
                  }
                `}>
                  {addressBook.count} Kontakte
                </p>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
} 