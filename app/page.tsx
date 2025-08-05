'use client';

import { useState, useEffect } from 'react';
import ContactCard from '@/components/ContactCard';
import SummaryCards, { AddressBook } from '@/components/SummaryCards';
import SearchBar from '@/components/SearchBar';
import { CardDAVContact } from '@/lib/carddav';

export default function Home() {
  const [contacts, setContacts] = useState<CardDAVContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<CardDAVContact[]>([]);
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddressBook, setSelectedAddressBook] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
  }, [selectedAddressBook]);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (selectedAddressBook) {
        params.append('addressBookName', selectedAddressBook);
      }
      
      const response = await fetch(`/api/contacts?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setContacts(data.contacts);
        setFilteredContacts(data.contacts);
        setAddressBooks(data.addressBooks || []);
      } else {
        setError(data.error || 'Fehler beim Laden der Kontakte');
      }
    } catch (err) {
      setError('Fehler beim Laden der Kontakte');
      console.error('Fehler beim Laden der Kontakte:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const filtered = contacts.filter(contact => {
      const searchLower = searchTerm.toLowerCase();
      return (
        contact.name.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.phone?.toLowerCase().includes(searchLower) ||
        contact.company?.toLowerCase().includes(searchLower) ||
        contact.phones?.some(phone => 
          phone.number.toLowerCase().includes(searchLower)
        )
      );
    });

    setFilteredContacts(filtered);
  };

  const handleRefresh = () => {
    fetchContacts();
  };

  const handleAddressBookSelect = (addressBookName: string | null) => {
    setSelectedAddressBook(addressBookName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lade Kontakte...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">Fehler</p>
              <p>{error}</p>
              <button 
                onClick={fetchContacts}
                className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Telefonbuch</h1>
          <p className="text-gray-600">
            {selectedAddressBook 
              ? `Anzeige: ${selectedAddressBook} (${filteredContacts.length} Kontakte)`
              : `Alle Adressbücher (${filteredContacts.length} Kontakte)`
            }
          </p>
        </div>

        <SummaryCards 
          addressBooks={addressBooks}
          onAddressBookSelect={handleAddressBookSelect}
          selectedAddressBook={selectedAddressBook}
        />

        <SearchBar onSearch={handleSearch} onRefresh={handleRefresh} />

        <div className="mt-8">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {contacts.length === 0 
                  ? 'Keine Kontakte gefunden'
                  : 'Keine Kontakte entsprechen der Suche'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 