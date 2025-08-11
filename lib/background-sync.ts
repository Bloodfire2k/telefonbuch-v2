import { cardDAVClient } from './carddav';

export class BackgroundSync {
  private intervalId: NodeJS.Timeout | null = null;
  private cardDAVClient: typeof cardDAVClient;
  private isRunning: boolean = false;

  constructor(cardDAVClientInstance: typeof cardDAVClient) {
    this.cardDAVClient = cardDAVClientInstance;
  }

  startSync(intervalMinutes: number = 3) {
    if (this.isRunning) {
      console.log('Hintergrund-Sync läuft bereits');
      return;
    }

    console.log(`Hintergrund-Sync gestartet: Alle ${intervalMinutes} Minuten`);
    this.isRunning = true;

    // Sofort den ersten Sync starten
    this.performSync();

    // Dann alle X Minuten wiederholen
    this.intervalId = setInterval(() => {
      this.performSync();
    }, intervalMinutes * 60 * 1000);
  }

  stopSync() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Hintergrund-Sync gestoppt');
  }

  private async performSync() {
    try {
      console.log(`Hintergrund-Sync: Cache wird geleert (${new Date().toLocaleTimeString()})`);
      
      // Alle Caches leeren
      this.cardDAVClient.clearAllCaches();
      
      // Alle Adressbücher neu laden (ohne sie zu speichern, nur um den Cache zu aktualisieren)
      const addressBooks = await this.cardDAVClient.getAddressBooks();
      
      for (const book of addressBooks) {
        try {
          await this.cardDAVClient.getContacts(book.displayName);
          console.log(`Hintergrund-Sync: ${book.displayName} aktualisiert`);
        } catch (error) {
          console.error(`Hintergrund-Sync: Fehler bei ${book.displayName}:`, error);
        }
      }
      
      console.log(`Hintergrund-Sync: Abgeschlossen (${new Date().toLocaleTimeString()})`);
    } catch (error) {
      console.error('Hintergrund-Sync: Fehler beim Sync:', error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId ? 'aktiv' : 'inaktiv'
    };
  }
}
