import { NextRequest, NextResponse } from 'next/server';
import { cardDAVClient } from '@/lib/carddav';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('search') || '';
    const addressBook = searchParams.get('addressBook') || '';

    console.log('API Request - Search:', searchTerm, 'AddressBook:', addressBook);

    // Wenn kein spezifisches Adressbuch angegeben ist, lade alle verfügbaren
    if (!addressBook) {
      const addressBooks = await cardDAVClient.getAddressBooks();
      console.log('Verfügbare Adressbücher:', addressBooks.map(ab => ab.displayName));

      // Lade Kontakte aus allen Adressbüchern
      let allContacts: any[] = [];
      let totalContacts = 0;

      for (const book of addressBooks) {
        try {
          const contacts = await cardDAVClient.getContacts(book.displayName);
          console.log(`Kontakte aus ${book.displayName}:`, contacts.length);
          
          // Füge Adressbuch-Information zu jedem Kontakt hinzu
          const contactsWithBook = contacts.map(contact => ({
            ...contact,
            addressBook: book.displayName,
            category: book.displayName // Für Kompatibilität
          }));
          
          allContacts = allContacts.concat(contactsWithBook);
          totalContacts += contacts.length;
        } catch (error) {
          console.error(`Fehler beim Laden von ${book.displayName}:`, error);
        }
      }

      // Suche in allen Kontakten
      let filteredContacts = allContacts;
      if (searchTerm) {
        filteredContacts = allContacts.filter(contact => {
          const term = searchTerm.toLowerCase();
          return (
            contact.name?.toLowerCase().includes(term) ||
            contact.email?.toLowerCase().includes(term) ||
            contact.phone?.toLowerCase().includes(term) ||
            contact.company?.toLowerCase().includes(term) ||
            contact.title?.toLowerCase().includes(term) ||
            contact.addressBook?.toLowerCase().includes(term)
          );
        });
      }

      console.log(`API Response: ${filteredContacts.length} von ${totalContacts} Kontakten gefunden`);

      return NextResponse.json({
        contacts: filteredContacts,
        total: totalContacts,
        filtered: filteredContacts.length,
        source: 'CardDAV',
        addressBooks: addressBooks.map(ab => ab.displayName)
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } else {
      // Spezifisches Adressbuch
      const contacts = await cardDAVClient.getContacts(addressBook);
      let filteredContacts = contacts;

      if (searchTerm) {
        filteredContacts = await cardDAVClient.searchContacts(addressBook, searchTerm);
      }

      return NextResponse.json({
        contacts: filteredContacts,
        total: contacts.length,
        filtered: filteredContacts.length,
        source: 'CardDAV',
        addressBook: addressBook
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Fehler beim Laden der Kontakte',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
} 