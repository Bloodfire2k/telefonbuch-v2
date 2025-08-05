import { NextRequest, NextResponse } from 'next/server';
import { cardDAVClient } from '@/lib/carddav';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: Teste CardDAV-Verbindung...');
    
    // Teste Adressbücher laden
    const addressBooks = await cardDAVClient.getAddressBooks();
    console.log('DEBUG: Gefundene Adressbücher:', addressBooks);
    
    // Teste Kontakte laden für das erste Adressbuch
    if (addressBooks.length > 0) {
      const firstBook = addressBooks[0];
      console.log('DEBUG: Teste Kontakte laden für:', firstBook.displayName);
      console.log('DEBUG: URL:', firstBook.url);
      
      const contacts = await cardDAVClient.getContacts(firstBook.displayName);
      console.log('DEBUG: Kontakte geladen:', contacts.length);
      
      return NextResponse.json({
        success: true,
        addressBooks,
        testBook: firstBook,
        contactsLoaded: contacts.length,
        sampleContact: contacts[0] || null
      });
    }
    
    return NextResponse.json({
      success: true,
      addressBooks,
      message: 'Keine Adressbücher gefunden'
    });
    
  } catch (error) {
    console.error('DEBUG: Fehler:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 }
    );
  }
} 