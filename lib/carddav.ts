export interface CardDAVContact {
  id: string;
  name: string;
  email?: string;
  emails?: string[];
  phone?: string;
  phones?: {
    type: string;
    number: string;
  }[];
  company?: string;
  title?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    full?: string;
  };
  website?: string;
  birthday?: string;
  notes?: string;
  vcard: string;
  etag?: string;
  url?: string;
}

export interface CardDAVAddressBook {
  displayName: string;
  url: string;
  description?: string;
}

class SimpleCardDAVClient {
  private serverUrl: string;
  private credentials: string;
  private isConfigured: boolean = false;
  private contactsCache: Map<string, { contacts: CardDAVContact[], timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten Cache

  constructor() {
    this.serverUrl = '';
    this.credentials = '';
    this.initializeConfig();
  }

  private initializeConfig() {
    try {
      this.serverUrl = process.env.CARDAV_SERVER_URL || '';
      const username = process.env.CARDAV_USERNAME || '';
      const password = process.env.CARDAV_PASSWORD || '';
      
      if (this.serverUrl && username && password) {
        this.credentials = Buffer.from(`${username}:${password}`).toString('base64');
        this.isConfigured = true;
        console.log('CardDAV konfiguriert - verwende echte Adressbücher');
      } else {
        console.warn('CardDAV-Konfiguration unvollständig - verwende Demo-Modus');
        this.isConfigured = false;
      }
    } catch (error) {
      console.warn('Fehler beim Initialisieren der CardDAV-Konfiguration:', error);
      this.isConfigured = false;
    }
  }

  async getAddressBooks(): Promise<CardDAVAddressBook[]> {
    if (!this.isConfigured) {
      return [
        { displayName: 'Demo Adressbuch', url: 'demo', description: 'Demo-Kontakte' }
      ];
    }

    try {
      const response = await fetch(`${this.serverUrl}/remote.php/dav/addressbooks/users/kontakte/`, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${this.credentials}`,
          'Content-Type': 'application/xml',
          'Depth': '1'
        },
        body: `<?xml version="1.0" encoding="utf-8" ?>
          <d:propfind xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
            <d:prop>
              <d:displayname />
              <card:addressbook-description />
            </d:prop>
          </d:propfind>`
      });

      if (!response.ok) {
        throw new Error(`PROPFIND failed: ${response.status}`);
      }

      const xmlText = await response.text();
      return this.parseAddressBooksFromXML(xmlText);
    } catch (error) {
      console.error('Fehler beim Laden der Adressbücher:', error);
      return [];
    }
  }

  async getContacts(addressBookName?: string): Promise<{
    success: boolean;
    contacts: CardDAVContact[];
    addressBooks: { name: string; count: number; url: string }[];
    error?: string;
  }> {
    if (!this.isConfigured) {
      return {
        success: true,
        contacts: this.getDemoContacts('demo'),
        addressBooks: [{ name: 'Demo', count: 10, url: 'demo' }]
      };
    }

    try {
      // Lade alle Adressbücher
      const addressBooks = await this.getAddressBooks();
      console.log('Gefundene Adressbücher:', addressBooks.map(ab => ab.displayName));

      // Filtere erlaubte Adressbücher
      const allowedBooks = process.env.ALLOWED_ADDRESSBOOKS?.split(',') || [];
      const filteredBooks = addressBooks.filter(book => 
        allowedBooks.some(allowed => book.displayName.includes(allowed))
      );

      console.log('Gefilterte Adressbücher:', filteredBooks.map(ab => ab.displayName));

      const allContacts: CardDAVContact[] = [];
      const addressBookStats: { name: string; count: number; url: string }[] = [];

      // Wenn ein spezifisches Adressbuch angegeben ist, lade nur dieses
      if (addressBookName) {
        const targetBook = filteredBooks.find(book => 
          book.displayName.includes(addressBookName)
        );
        
        if (targetBook) {
          console.log(`Lade Kontakte aus "${addressBookName}"`);
          console.log(`Verwende URL: ${targetBook.url}`);
          const contacts = await this.getContactsFromAddressBook(targetBook.url);
          allContacts.push(...contacts);
          addressBookStats.push({
            name: targetBook.displayName,
            count: contacts.length,
            url: targetBook.url
          });
        } else {
          console.log(`Adressbuch "${addressBookName}" nicht gefunden`);
        }
      } else {
        // Lade alle Adressbücher
        for (const book of filteredBooks) {
          console.log(`Lade Kontakte aus "${book.displayName}"`);
          console.log(`Verwende URL: ${book.url}`);
          const contacts = await this.getContactsFromAddressBook(book.url);
          allContacts.push(...contacts);
          addressBookStats.push({
            name: book.displayName,
            count: contacts.length,
            url: book.url
          });
        }
      }

      return {
        success: true,
        contacts: allContacts,
        addressBooks: addressBookStats
      };
    } catch (error) {
      console.error('Fehler beim Laden der Kontakte:', error);
      return {
        success: false,
        contacts: [],
        addressBooks: [],
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      };
    }
  }

  private async getContactsFromAddressBook(addressBookUrl: string): Promise<CardDAVContact[]> {
    console.log('Lade Kontakte mit einfacher, effizienter Methode...');
    
    try {
      // METHODE 1: REPORT mit card:address-data (schnellste)
      console.log('Methode 1: REPORT mit card:address-data...');
      const reportBody = `<?xml version="1.0" encoding="utf-8" ?>
        <c:addressbook-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:carddav">
          <d:prop>
            <d:getetag />
            <c:address-data />
          </d:prop>
        </c:addressbook-query>`;

      const fullUrl = addressBookUrl.startsWith('http') 
        ? addressBookUrl 
        : `${this.serverUrl}${addressBookUrl}`;

      console.log('Vollständige URL für REPORT:', fullUrl);

      const response = await fetch(fullUrl, {
        method: 'REPORT',
        headers: {
          'Authorization': `Basic ${this.credentials}`,
          'Content-Type': 'application/xml',
          'Depth': '1'
        },
        body: reportBody
      });

      console.log('REPORT Response Status:', response.status);
      console.log('REPORT Response Headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const xmlText = await response.text();
        console.log('REPORT Response Länge:', xmlText.length);
        console.log('REPORT Response (erste 500 Zeichen):', xmlText.substring(0, 500));
        
        const contacts = this.parseContactsFromXML(xmlText, addressBookUrl);
        console.log(`${contacts.length} Kontakte via REPORT geladen`);
        
        if (contacts.length > 0) {
          return contacts;
        }
      } else {
        console.log(`REPORT Request failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log('REPORT Methode fehlgeschlagen:', error);
    }

    // METHODE 2: PROPFIND mit card:address-data (Fallback)
    console.log('Methode 2: PROPFIND mit card:address-data...');
    try {
      const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
        <d:propfind xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
          <d:prop>
            <d:getetag />
            <card:address-data />
          </d:prop>
        </d:propfind>`;

      const fullUrl = addressBookUrl.startsWith('http') 
        ? addressBookUrl 
        : `${this.serverUrl}${addressBookUrl}`;

      const response = await fetch(fullUrl, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${this.credentials}`,
          'Content-Type': 'application/xml',
          'Depth': '1'
        },
        body: propfindBody
      });

      console.log('PROPFIND Response Status:', response.status);

      if (response.ok) {
        const xmlText = await response.text();
        console.log('PROPFIND Response Länge:', xmlText.length);
        console.log('PROPFIND Response (erste 500 Zeichen):', xmlText.substring(0, 500));
        
        const contacts = this.parseContactsFromXML(xmlText, addressBookUrl);
        console.log(`${contacts.length} Kontakte via PROPFIND geladen`);
        
        if (contacts.length > 0) {
          return contacts;
        }
      } else {
        console.log(`PROPFIND Request failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log('PROPFIND Methode fehlgeschlagen:', error);
    }

    // METHODE 3: Direkte GET-Requests für einzelne vCards
    console.log('Methode 3: Direkte GET-Requests...');
    try {
      // Zuerst PROPFIND um alle vCard-Dateien zu finden
      const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
        <d:propfind xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
          <d:prop>
            <d:getetag />
          </d:prop>
        </d:propfind>`;

      const fullUrl = addressBookUrl.startsWith('http') 
        ? addressBookUrl 
        : `${this.serverUrl}${addressBookUrl}`;

      const response = await fetch(fullUrl, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${this.credentials}`,
          'Content-Type': 'application/xml',
          'Depth': '1'
        },
        body: propfindBody
      });

      if (response.ok) {
        const xmlText = await response.text();
        console.log('PROPFIND für vCard-URLs Response Länge:', xmlText.length);
        
        // Extrahiere alle vCard-Datei-URLs
        const vcardUrls: string[] = [];
        const responseRegex = /<d:response[^>]*>(.*?)<\/d:response>/gs;
        let match;

        while ((match = responseRegex.exec(xmlText)) !== null) {
          const responseContent = match[1];
          const hrefMatch = responseContent.match(/<d:href[^>]*>(.*?)<\/d:href>/);
          
          if (hrefMatch) {
            const href = hrefMatch[1].trim();
            if (href.endsWith('.vcf')) {
              const fullVcardUrl = href.startsWith('http') 
                ? href 
                : `${this.serverUrl}${href}`;
              vcardUrls.push(fullVcardUrl);
            }
          }
        }

        console.log(`Gefundene vCard-Dateien: ${vcardUrls.length}`);

        if (vcardUrls.length > 0) {
          // Lade die ersten 10 vCards als Test
          const testUrls = vcardUrls.slice(0, 10);
          const contacts: CardDAVContact[] = [];
          
          for (const vcardUrl of testUrls) {
            try {
              const vcardResponse = await fetch(vcardUrl, {
                method: 'GET',
                headers: {
                  'Authorization': `Basic ${this.credentials}`,
                  'Accept': 'text/vcard'
                }
              });

              if (vcardResponse.ok) {
                const vcardText = await vcardResponse.text();
                const contact = this.parseVCard(vcardText, vcardUrl);
                if (contact.name !== 'Unbekannt') {
                  contacts.push(contact);
                }
              }
            } catch (error) {
              console.log(`Fehler beim Laden von ${vcardUrl}:`, error);
            }
          }
          
          console.log(`${contacts.length} Kontakte via direkte GET-Requests geladen`);
          return contacts;
        }
      }
    } catch (error) {
      console.log('Direkte GET-Requests fehlgeschlagen:', error);
    }

    console.log('Alle Methoden fehlgeschlagen - keine Kontakte gefunden');
    return [];
  }

  private parseAddressBooksFromXML(xmlText: string): CardDAVAddressBook[] {
    const books: CardDAVAddressBook[] = [];
    const responseRegex = /<d:response[^>]*>(.*?)<\/d:response>/gs;
    let match;
    
    while ((match = responseRegex.exec(xmlText)) !== null) {
      const responseContent = match[1];
      
      if (responseContent.includes('<card:addressbook')) {
        const displayNameMatch = responseContent.match(/<d:displayname[^>]*>(.*?)<\/d:displayname>/);
        const hrefMatch = responseContent.match(/<d:href[^>]*>(.*?)<\/d:href>/);
        const descriptionMatch = responseContent.match(/<card:addressbook-description[^>]*>(.*?)<\/card:addressbook-description>/);
        
        if (displayNameMatch && hrefMatch) {
          books.push({
            displayName: displayNameMatch[1].trim(),
            url: hrefMatch[1].trim(),
            description: descriptionMatch ? descriptionMatch[1].trim() : undefined
          });
        }
      }
    }
    
    return books;
  }

  private parseContactsFromXML(xmlText: string, addressBookPath: string): CardDAVContact[] {
    const contacts: CardDAVContact[] = [];
    const responseRegex = /<d:response[^>]*>(.*?)<\/d:response>/gs;
    let match;
    
    while ((match = responseRegex.exec(xmlText)) !== null) {
      const responseContent = match[1];
      
      const hrefMatch = responseContent.match(/<d:href[^>]*>(.*?)<\/d:href>/);
      const etagMatch = responseContent.match(/<d:getetag[^>]*>(.*?)<\/d:getetag>/);
      const vcardMatch = responseContent.match(/<card:address-data[^>]*>(.*?)<\/card:address-data>/);
      
      if (hrefMatch && vcardMatch) {
        const vcard = vcardMatch[1].trim();
        const contact = this.parseVCard(vcard, hrefMatch[1].trim(), etagMatch?.[1].trim());
        
        if (contact.name !== 'Unbekannt') {
          contacts.push(contact);
        }
      }
    }
    
    return contacts;
  }

  private parseVCard(vcard: string, url: string, etag?: string): CardDAVContact {
    const name = this.extractVCardField(vcard, 'FN') || this.extractVCardField(vcard, 'N') || 'Unbekannt';
    const email = this.extractVCardField(vcard, 'EMAIL') || this.extractVCardField(vcard, 'item1.EMAIL;type=INTERNET');
    const phone = this.extractVCardField(vcard, 'TEL');
    const company = this.extractVCardField(vcard, 'ORG');
    const title = this.extractVCardField(vcard, 'TITLE');
    const website = this.extractVCardField(vcard, 'URL');
    const birthday = this.extractVCardField(vcard, 'BDAY');
    const notes = this.extractVCardField(vcard, 'NOTE');

    return {
      id: url.split('/').pop()?.replace('.vcf', '') || Math.random().toString(),
      name: this.decodeHtmlEntities(name),
      email: email ? this.decodeHtmlEntities(email) : undefined,
      emails: email ? [this.decodeHtmlEntities(email)] : [],
      phone: phone ? this.formatPhoneNumber(phone) : undefined,
      phones: phone ? [{ type: 'WORK', number: this.formatPhoneNumber(phone) }] : [],
      company: company ? this.decodeHtmlEntities(company) : undefined,
      title: title ? this.decodeHtmlEntities(title) : undefined,
      website: website ? this.decodeHtmlEntities(website) : undefined,
      birthday: birthday ? this.decodeHtmlEntities(birthday) : undefined,
      notes: notes ? this.decodeHtmlEntities(notes) : undefined,
      vcard: vcard,
      etag: etag,
      url: url
    };
  }

  private extractVCardField(vcard: string, field: string): string | undefined {
    const regex = new RegExp(`${field}[^:]*:(.*?)(?:\\r?\\n|$)`, 'i');
    const match = vcard.match(regex);
    return match ? match[1].trim() : undefined;
  }

  private formatPhoneNumber(number: string): string {
    // Entferne alle nicht-numerischen Zeichen außer + und -
    let cleaned = number.replace(/[^\d+\-]/g, '');
    
    // Konvertiere +49 zu 0
    if (cleaned.startsWith('+49')) {
      cleaned = '0' + cleaned.substring(3);
    }
    
    return cleaned;
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }

  private getDemoContacts(addressBookName: string): CardDAVContact[] {
    return [
      {
        id: '1',
        name: 'Max Mustermann',
        email: 'max@example.com',
        phone: '0123456789',
        company: 'Demo GmbH',
        title: 'Geschäftsführer',
        vcard: 'BEGIN:VCARD\nFN:Max Mustermann\nEND:VCARD',
        url: 'demo'
      },
      {
        id: '2',
        name: 'Anna Schmidt',
        email: 'anna@example.com',
        phone: '0987654321',
        company: 'Demo GmbH',
        title: 'Sekretärin',
        vcard: 'BEGIN:VCARD\nFN:Anna Schmidt\nEND:VCARD',
        url: 'demo'
      }
    ];
  }

  async searchContacts(addressBookName: string, searchTerm: string): Promise<CardDAVContact[]> {
    const result = await this.getContacts(addressBookName);
    if (!result.success) return [];

    const searchLower = searchTerm.toLowerCase();
    return result.contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.phone?.includes(searchTerm) ||
      contact.company?.toLowerCase().includes(searchLower)
    );
  }

  clearCache(addressBookName?: string): void {
    if (addressBookName) {
      this.contactsCache.delete(addressBookName);
    } else {
      this.contactsCache.clear();
    }
  }

  getCacheStatus(): { [key: string]: { contactCount: number, age: string } } {
    const status: { [key: string]: { contactCount: number, age: string } } = {};
    
    for (const [key, value] of this.contactsCache.entries()) {
      const age = Date.now() - value.timestamp;
      status[key] = {
        contactCount: value.contacts.length,
        age: `${Math.round(age / 1000)}s`
      };
    }
    
    return status;
  }
}

export const cardDAVClient = new SimpleCardDAVClient(); 