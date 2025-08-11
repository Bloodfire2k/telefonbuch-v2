'use client';

import { useState, useEffect } from 'react';
import ContactCard from '@/components/ContactCard';
import SearchBar from '@/components/SearchBar';
import AddressBookSelector from '@/components/AddressBookSelector';

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  website?: string;
  birthday?: string;
  notes?: string;
}

interface AddressBook {
  name: string;
  count: number;
  url: string;
}

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([]);
  const [selectedAddressBook, setSelectedAddressBook] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backgroundSyncStatus, setBackgroundSyncStatus] = useState<{ isRunning: boolean; intervalId: string } | null>(null);

  const loadContacts = async (addressBookName?: string | null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (addressBookName) {
        params.append('addressBook', addressBookName);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/contacts?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setContacts(data.contacts);
        setFilteredContacts(data.contacts);
        setAddressBooks(data.addressBooks);
        console.log(`${data.contacts.length} Kontakte geladen`);
      } else {
        setError(data.error || 'Fehler beim Laden der Kontakte');
        setContacts([]);
        setFilteredContacts([]);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Kontakte:', err);
      setError('Verbindungsfehler');
      setContacts([]);
      setFilteredContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact =>
        contact.name.toLowerCase().includes(term.toLowerCase()) ||
        contact.email?.toLowerCase().includes(term.toLowerCase()) ||
        contact.phone?.includes(term) ||
        contact.company?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  };

  const handleAddressBookSelect = (addressBookName: string | null) => {
    setSelectedAddressBook(addressBookName);
    loadContacts(addressBookName);
  };

  const handleClearCache = async () => {
    try {
      // Cache für alle Adressbücher leeren
      const response = await fetch('/api/contacts?clearCache=true');
      if (response.ok) {
        console.log('Cache für alle Adressbücher geleert');
        // Kontakte neu laden
        loadContacts(selectedAddressBook);
      }
    } catch (err) {
      console.error('Fehler beim Leeren des Caches:', err);
    }
  };

  const handleBackgroundSync = async (action: 'start' | 'stop') => {
    try {
      const response = await fetch('/api/background-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, intervalMinutes: 3 })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(data.message);
        setBackgroundSyncStatus(data.status);
      }
    } catch (err) {
      console.error('Fehler beim Hintergrund-Sync:', err);
    }
  };

  const loadBackgroundSyncStatus = async () => {
    try {
      const response = await fetch('/api/background-sync');
      if (response.ok) {
        const data = await response.json();
        setBackgroundSyncStatus(data.status);
      }
    } catch (err) {
      console.error('Fehler beim Laden des Sync-Status:', err);
    }
  };

  useEffect(() => {
    loadContacts();
    loadBackgroundSyncStatus();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Fehler beim Laden der Kontakte</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => loadContacts()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Telefonbuch</h1>
              <p className="text-gray-600">Schneller Zugriff auf alle Kontakte</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearCache}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                title="Cache leeren und Kontakte neu laden"
              >
                Cache leeren
              </button>
              <button
                onClick={() => handleBackgroundSync(backgroundSyncStatus?.isRunning ? 'stop' : 'start')}
                className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                  backgroundSyncStatus?.isRunning 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                title={backgroundSyncStatus?.isRunning ? 'Hintergrund-Sync stoppen' : 'Hintergrund-Sync starten (alle 3 Minuten)'}
              >
                {backgroundSyncStatus?.isRunning ? 'Sync stoppen' : 'Auto-Sync starten'}
              </button>
            </div>
          </div>
        </div>

        {/* Adressbuch-Auswahl */}
        {addressBooks.length > 0 && (
          <AddressBookSelector
            addressBooks={addressBooks}
            selectedAddressBook={selectedAddressBook}
            onAddressBookSelect={handleAddressBookSelect}
          />
        )}

        {/* Suchleiste */}
        <SearchBar onSearch={handleSearch} />

        {/* Kontakte */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Lade Kontakte...</span>
          </div>
        ) : filteredContacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredContacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'Keine Kontakte gefunden.' : 'Keine Kontakte verfügbar.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 