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
    const result = await cardDAVClient.getContacts(addressBookName || undefined);

    if (!result.success) {
      console.error('API: Fehler beim Laden der Kontakte:', result.error);
      return NextResponse.json(
        { error: result.error || 'Fehler beim Laden der Kontakte' },
        { status: 500 }
      );
    }

    // Suche anwenden falls vorhanden
    let contacts = result.contacts;
    if (searchTerm) {
      console.log(`API: Suche nach "${searchTerm}" in ${contacts.length} Kontakten`);
      contacts = await cardDAVClient.searchContacts(addressBookName || '', searchTerm);
    }

    console.log(`API: ${contacts.length} Kontakte erfolgreich geladen`);
    
    return NextResponse.json({
      success: true,
      contacts,
      addressBooks: result.addressBooks,
      totalCount: contacts.length
    });

  } catch (error) {
    console.error('API: Unerwarteter Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
} 