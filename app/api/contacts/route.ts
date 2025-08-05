import { NextRequest, NextResponse } from 'next/server';
import { cardDAVClient } from '@/lib/carddav';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const addressBookName = searchParams.get('addressBook');
    const searchTerm = searchParams.get('search') || '';

    console.log(`API: Lade Kontakte${addressBookName ? ` für Adressbuch "${addressBookName}"` : ''}${searchTerm ? ` mit Suche "${searchTerm}"` : ''}`);

    // Lade Adressbücher für die UI
    const addressBooks = await cardDAVClient.getAddressBooks();
    
    // Lade Kontakte und Statistiken für jedes Adressbuch
    const addressBookStats = [];
    let allContacts: any[] = [];
    
    for (const book of addressBooks) {
      try {
        console.log(`Lade Kontakte aus "${book.displayName}"...`);
        const contacts = await cardDAVClient.getContacts(book.displayName);
        console.log(`${contacts.length} Kontakte aus "${book.displayName}" geladen`);
        
        // Füge zur Statistik hinzu
        addressBookStats.push({
          name: book.displayName,
          count: contacts.length,
          url: book.url
        });
        
        // Wenn kein spezifisches Adressbuch ausgewählt ist, füge alle hinzu
        if (!addressBookName) {
          allContacts.push(...contacts);
        }
        // Wenn das spezifische Adressbuch ausgewählt ist, verwende nur diese
        else if (book.displayName === addressBookName) {
          allContacts = contacts;
        }
      } catch (error) {
        console.log(`Fehler beim Laden von "${book.displayName}":`, error);
        addressBookStats.push({
          name: book.displayName,
          count: 0,
          url: book.url
        });
      }
    }

    // Suche anwenden falls vorhanden
    let filteredContacts = allContacts;
    if (searchTerm) {
      console.log(`API: Suche nach "${searchTerm}" in ${allContacts.length} Kontakten`);
      filteredContacts = allContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone?.includes(searchTerm) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }



    console.log(`API: ${filteredContacts.length} Kontakte erfolgreich geladen`);
    
    return NextResponse.json({
      success: true,
      contacts: filteredContacts,
      addressBooks: addressBookStats,
      totalCount: filteredContacts.length
    });

  } catch (error) {
    console.error('API: Unerwarteter Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
} 