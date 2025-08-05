import { NextRequest, NextResponse } from 'next/server';
import { cardDAVClient } from '@/lib/carddav';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const addressBookName = searchParams.get('addressBook');
    const searchTerm = searchParams.get('search') || '';

    console.log(`API: Lade Kontakte${addressBookName ? ` für Adressbuch "${addressBookName}"` : ''}${searchTerm ? ` mit Suche "${searchTerm}"` : ''}`);

    // Lade Kontakte
    const contacts = await cardDAVClient.getContacts(addressBookName || '');

    // Suche anwenden falls vorhanden
    let filteredContacts = contacts;
    if (searchTerm) {
      console.log(`API: Suche nach "${searchTerm}" in ${contacts.length} Kontakten`);
      filteredContacts = await cardDAVClient.searchContacts(addressBookName || '', searchTerm);
    }

    console.log(`API: ${filteredContacts.length} Kontakte erfolgreich geladen`);
    
    return NextResponse.json({
      success: true,
      contacts: filteredContacts,
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