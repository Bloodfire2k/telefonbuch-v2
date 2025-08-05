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
      console.log(`${key}: ${process.env[key]}`);
    });
    
    // Spezielle Coolify-Variablen prüfen
    console.log('=== COOLIFY SPECIFIC VARIABLES ===');
    console.log('COOLIFY_APP_ID:', process.env.COOLIFY_APP_ID);
    console.log('COOLIFY_DATABASE_URL:', process.env.COOLIFY_DATABASE_URL);
    console.log('COOLIFY_REDIS_URL:', process.env.COOLIFY_REDIS_URL);
    
    // Alternative Variablennamen prüfen
    console.log('=== ALTERNATIVE VARIABLE NAMES ===');
    console.log('NEXT_PUBLIC_CARDAV_SERVER_URL:', process.env.NEXT_PUBLIC_CARDAV_SERVER_URL);
    console.log('NEXT_PUBLIC_CARDAV_USERNAME:', process.env.NEXT_PUBLIC_CARDAV_USERNAME);
    console.log('NEXT_PUBLIC_USE_REAL_CARDAV:', process.env.NEXT_PUBLIC_USE_REAL_CARDAV);
    
    // Teste CardDAV-Verbindung
    console.log('=== TESTING CARDAV CONNECTION ===');
    const addressBooks = await cardDAVClient.getAddressBooks();
    console.log('Found address books:', addressBooks.map(ab => ab.displayName));
    
    // Teste Kontakte laden
    console.log('=== TESTING CONTACT LOADING ===');
    const result = await cardDAVClient.getContacts('Handwerker');
    
    return NextResponse.json({
      success: true,
      contactsCount: result.contacts.length,
      contacts: result.contacts.slice(0, 3), // Show first 3 contacts
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