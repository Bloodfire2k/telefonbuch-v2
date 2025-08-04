'use client';

import { useState, useEffect } from 'react';
import ContactCard from '@/components/ContactCard';
import SummaryCards from '@/components/SummaryCards';
import SearchBar from '@/components/SearchBar';

interface Contact {
  id: string;
  name: string;
  email?: string;
  emails?: string[];
  phone?: string;
  phones?: {
    type: string;
    number: string;
  }[];
  company?: string;
  title?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    full?: string;
  };
  website?: string;
  birthday?: string;
  notes?: string;
  addressBook?: string;
  category?: string;
}

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contacts');
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Kontakte');
      }
      const data = await response.json();
      setContacts(data.contacts || []);
      setFilteredContacts(data.contacts || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const filtered = contacts.filter(contact => {
      const searchLower = term.toLowerCase();
      return (
        contact.name?.toLowerCase().includes(searchLower) ||
        contact.company?.toLowerCase().includes(searchLower) ||
        contact.title?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.emails?.some(email => email.toLowerCase().includes(searchLower)) ||
        contact.phone?.toLowerCase().includes(searchLower) ||
        contact.phones?.some(phone => phone.number.toLowerCase().includes(searchLower)) ||
        contact.address?.full?.toLowerCase().includes(searchLower) ||
        contact.website?.toLowerCase().includes(searchLower) ||
        contact.notes?.toLowerCase().includes(searchLower) ||
        contact.addressBook?.toLowerCase().includes(searchLower) ||
        contact.category?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredContacts(filtered);
  };

  const handleRefresh = () => {
    fetchContacts();
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Lade Kontakte...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">Fehler beim Laden der Kontakte</p>
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Telefonbuch</h1>
          <p className="text-gray-600">{contacts.length} Kontakte geladen</p>
        </div>

        {/* Adressbuch-Buttons - kleiner gemacht */}
        <div className="mb-6">
          <SummaryCards contacts={contacts} />
        </div>

        {/* Suchleiste - jetzt unter den Buttons */}
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} onRefresh={handleRefresh} />
        </div>

        {/* Kontakt-Anzahl und Filter-Info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {filteredContacts.length} von {contacts.length} Kontakten
          </p>
        </div>

        {/* Kontakte Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>

        {filteredContacts.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <p className="text-gray-500">Keine Kontakte gefunden für "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
} 