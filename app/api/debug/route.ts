import { NextRequest, NextResponse } from 'next/server';
import { cardDAVClient } from '@/lib/carddav';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG INFO ===');
    console.log('Server URL:', process.env.CARDAV_SERVER_URL);
    console.log('Username:', process.env.CARDAV_USERNAME);
    console.log('Password set:', !!process.env.CARDAV_PASSWORD);
    console.log('Use Real CardDAV:', process.env.USE_REAL_CARDAV);
    console.log('Allowed Addressbooks:', process.env.ALLOWED_ADDRESSBOOKS);
    console.log('Node ENV:', process.env.NODE_ENV);
    
    // Alle Umgebungsvariablen auflisten
    console.log('=== ALL ENVIRONMENT VARIABLES ===');
    Object.keys(process.env).forEach(key => {
      if (key.includes('CARDAV') || key.includes('NODE') || key.includes('USE')) {
        console.log(`${key}: ${process.env[key]}`);
      }
    });
    
    // Teste CardDAV-Verbindung
    console.log('=== TESTING CARDAV CONNECTION ===');
    const addressBooks = await cardDAVClient.getAddressBooks();
    console.log('Found address books:', addressBooks.map(ab => ab.displayName));
    
    // Teste Kontakte laden
    console.log('=== TESTING CONTACT LOADING ===');
    const contacts = await cardDAVClient.getContacts('Handwerker');
    
    return NextResponse.json({
      success: true,
      contactsCount: contacts.length,
      contacts: contacts.slice(0, 3), // Show first 3 contacts
      addressBooks: addressBooks.map(ab => ({ name: ab.displayName, url: ab.url })),
      environment: {
        serverUrl: process.env.CARDAV_SERVER_URL,
        username: process.env.CARDAV_USERNAME,
        passwordSet: !!process.env.CARDAV_PASSWORD,
        useRealCardDAV: process.env.USE_REAL_CARDAV,
        allowedAddressbooks: process.env.ALLOWED_ADDRESSBOOKS,
        nodeEnv: process.env.NODE_ENV,
        allEnvVars: Object.keys(process.env).filter(key => 
          key.includes('CARDAV') || key.includes('NODE') || key.includes('USE')
        )
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        serverUrl: process.env.CARDAV_SERVER_URL,
        username: process.env.CARDAV_USERNAME,
        passwordSet: !!process.env.CARDAV_PASSWORD,
        useRealCardDAV: process.env.USE_REAL_CARDAV,
        allowedAddressbooks: process.env.ALLOWED_ADDRESSBOOKS,
        nodeEnv: process.env.NODE_ENV,
        allEnvVars: Object.keys(process.env).filter(key => 
          key.includes('CARDAV') || key.includes('NODE') || key.includes('USE')
        )
      }
    }, { status: 500 });
  }
} 