import { NextRequest, NextResponse } from 'next/server';
import { cardDAVClient } from '@/lib/carddav';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const addressBookName = searchParams.get('addressBookName');

    console.log('API Route: Lade Kontakte...');
    if (addressBookName) {
      console.log(`API Route: Filtere nach Adressbuch: ${addressBookName}`);
    }

    const result = await cardDAVClient.getContacts(addressBookName || undefined);

    if (result.success) {
      console.log(`API Route: ${result.contacts.length} Kontakte erfolgreich geladen`);
      return NextResponse.json({
        success: true,
        contacts: result.contacts,
        addressBooks: result.addressBooks
      });
    } else {
      console.error('API Route: Fehler beim Laden der Kontakte:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error || 'Unbekannter Fehler'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API Route: Unerwarteter Fehler:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Serverfehler'
    }, { status: 500 });
  }
} 