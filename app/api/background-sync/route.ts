import { NextRequest, NextResponse } from 'next/server';
import { BackgroundSync } from '@/lib/background-sync';
import { cardDAVClient } from '@/lib/carddav';

// Singleton-Instanz des BackgroundSync
let backgroundSync: BackgroundSync | null = null;

export async function POST(request: NextRequest) {
  try {
    const { action, intervalMinutes = 3 } = await request.json();
    
    if (!backgroundSync) {
      backgroundSync = new BackgroundSync(cardDAVClient);
    }
    
    switch (action) {
      case 'start':
        backgroundSync.startSync(intervalMinutes);
        return NextResponse.json({ 
          success: true, 
          message: `Hintergrund-Sync gestartet (alle ${intervalMinutes} Minuten)`,
          status: backgroundSync.getStatus()
        });
        
      case 'stop':
        backgroundSync.stopSync();
        return NextResponse.json({ 
          success: true, 
          message: 'Hintergrund-Sync gestoppt',
          status: backgroundSync.getStatus()
        });
        
      case 'status':
        return NextResponse.json({ 
          success: true, 
          status: backgroundSync ? backgroundSync.getStatus() : { isRunning: false, intervalId: 'nicht initialisiert' }
        });
        
      default:
        return NextResponse.json({ 
          error: 'Ungültige Aktion. Verwende: start, stop oder status' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Fehler beim Hintergrund-Sync:', error);
    return NextResponse.json({ 
      error: 'Interner Server-Fehler' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!backgroundSync) {
      return NextResponse.json({ 
        success: true, 
        status: { isRunning: false, intervalId: 'nicht initialisiert' }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      status: backgroundSync.getStatus()
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Sync-Status:', error);
    return NextResponse.json({ 
      error: 'Interner Server-Fehler' 
    }, { status: 500 });
  }
}
