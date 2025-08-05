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
  private baseUrl: string; // Neue Property für Base-URL
  private credentials: string;
  private allowedBooks: string[];
  private isConfigured: boolean = false;
  private addressBookMapping: Map<string, {originalName: string, url: string}> = new Map(); // Mapping: cleanName -> {originalName, url}
  private contactsCache: Map<string, { contacts: CardDAVContact[], timestamp: number }> = new Map(); // In-Memory Cache für Kontakte
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten Cache-Dauer

  constructor() {
    this.serverUrl = '';
    this.baseUrl = ''; // Initialisiere baseUrl
    this.credentials = '';
    this.allowedBooks = [];
    this.initializeConfig();
  }

  private initializeConfig() {
    try {
      this.serverUrl = process.env.CARDAV_SERVER_URL || '';
      const username = process.env.CARDAV_USERNAME || '';
      const password = process.env.CARDAV_PASSWORD || '';
      const allowedBooksStr = process.env.ALLOWED_ADDRESSBOOKS || '';
      
      this.allowedBooks = allowedBooksStr.split(',').map(book => book.trim()).filter(book => book.length > 0);
      
      // Wenn keine Adressbücher konfiguriert sind und CardDAV verfügbar ist, verwende alle gefundenen
      if (this.allowedBooks.length === 0) {
        this.allowedBooks = []; // Wird dynamisch gefüllt
      }

      if (this.serverUrl && username && password) {
        // Create base64 encoded credentials
        this.credentials = Buffer.from(`${username}:${password}`).toString('base64');
        
        // Extrahiere Base-URL aus serverUrl
        try {
          const url = new URL(this.serverUrl);
          this.baseUrl = `${url.protocol}//${url.host}`;
          console.log('Base-URL extrahiert:', this.baseUrl);
        } catch (e) {
          console.error('Fehler beim Parsen der CARDAV_SERVER_URL für baseUrl:', e);
          this.baseUrl = ''; // Fallback
        }
        
        this.isConfigured = true;
        console.log('CardDAV konfiguriert - verwende echte Adressbücher');
      } else {
        console.warn('CardDAV-Konfiguration unvollständig - verwende Demo-Modus');
        this.isConfigured = false;
        // Fallback für Demo-Modus
        if (this.allowedBooks.length === 0) {
          this.allowedBooks = ['Edeka Adressbuch', 'Vertreter', 'Handwerker'];
        }
      }
    } catch (error) {
      console.warn('Fehler beim Initialisieren der CardDAV-Konfiguration:', error);
      this.isConfigured = false;
      this.allowedBooks = ['Edeka Adressbuch', 'Vertreter', 'Handwerker'];
    }
  }

  private async makeRequest(path: string, method: string = 'PROPFIND', body?: string, headers?: Record<string, string>): Promise<Response> {
    if (!this.isConfigured) {
      throw new Error('CardDAV nicht konfiguriert - verwende Demo-Modus');
    }

    const url = `${this.serverUrl}${path}`;
    
    const defaultHeaders = {
      'Authorization': `Basic ${this.credentials}`,
      'Content-Type': 'application/xml',
      'Depth': '1',
      ...headers
    };

    const response = await fetch(url, {
      method,
      headers: defaultHeaders,
      body
    });

    if (!response.ok) {
      throw new Error(`CardDAV Request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  async getAddressBooks(): Promise<CardDAVAddressBook[]> {
    if (!this.isConfigured) {
      console.log('Demo-Modus: Zeige konfigurierte Adressbücher');
      return this.allowedBooks.map(name => ({
        displayName: name,
        url: `${encodeURIComponent(name)}/`,
        description: `Adressbuch: ${name} (Demo-Modus)`
      }));
    }

    try {
      // Step 1: Get the addressbook-home-set from the principal
      console.log('Schritt 1: Lade addressbook-home-set vom Principal...');
      const principalPropfindBody = `<?xml version="1.0" encoding="utf-8" ?>
        <d:propfind xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
          <d:prop>
            <card:addressbook-home-set />
            <d:displayname />
          </d:prop>
        </d:propfind>`;

      const principalResponse = await this.makeRequest('', 'PROPFIND', principalPropfindBody);
      const principalXml = await principalResponse.text();
      
      console.log('Principal Response XML:', principalXml.substring(0, 500) + '...');
      
      // Extract addressbook-home-set URL
      const homeSetMatch = principalXml.match(/<card:addressbook-home-set[^>]*><d:href[^>]*>(.*?)<\/d:href><\/card:addressbook-home-set>/);
      
             if (!homeSetMatch) {
         console.log('Keine addressbook-home-set gefunden, versuche direkten Zugriff...');
         // Fallback: Try to construct the addressbook URL
         const addressBookUrl = this.serverUrl.replace('/principals/users/', '/addressbooks/users/');
         return await this.getAddressBooksFromUrl(addressBookUrl);
       }
      
      const addressBookHomeUrl = homeSetMatch[1].trim();
      console.log('Gefundene addressbook-home-set URL:', addressBookHomeUrl);
      
      // Step 2: Get address books from the home set
      return await this.getAddressBooksFromUrl(addressBookHomeUrl);
      
    } catch (error) {
      console.error('Fehler beim Laden der Adressbücher:', error);
    }
    
    // Fallback: Return demo books if discovery fails
    console.log('Fallback: Verwende Demo-Adressbücher');
    const fallbackBooks = ['Edeka Adressbuch', 'Vertreter', 'Handwerker'];
    this.allowedBooks = fallbackBooks;
    return fallbackBooks.map(name => ({
      displayName: name,
      url: `${encodeURIComponent(name)}/`,
      description: `Adressbuch: ${name} (Fallback)`
    }));
  }

  private async getAddressBooksFromUrl(baseUrl: string): Promise<CardDAVAddressBook[]> {
    console.log('Schritt 2: Lade Adressbücher von URL:', baseUrl);
    
    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
      <d:propfind xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
        <d:prop>
          <d:displayname />
          <d:resourcetype />
          <card:addressbook-description />
        </d:prop>
      </d:propfind>`;

    // Make request to the addressbook home URL
    const fullUrl = baseUrl.startsWith('http') ? baseUrl : `${this.serverUrl.split('/remote.php')[0]}${baseUrl}`;
    console.log('Vollständige URL für Adressbücher:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'PROPFIND',
      headers: {
        'Authorization': `Basic ${this.credentials}`,
        'Content-Type': 'application/xml',
        'Depth': '1'
      },
      body: propfindBody
    });

    if (!response.ok) {
      throw new Error(`CardDAV Request failed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log('AddressBooks Response XML:', xmlText.substring(0, 500) + '...');
    
    // Parse XML response for address books
    const addressBooks = this.parseAddressBooksFromXML(xmlText);
    
    console.log('Gefundene Adressbücher:', addressBooks.map(b => b.displayName));
    
    // Filter out proxy address books and other non-contact address books
    const realAddressBooks = addressBooks.filter(book => 
      book.displayName && 
      !book.displayName.includes('proxy') &&
      !book.displayName.includes('calendar') &&
      !book.displayName.includes('Calendar')
    );
    
    console.log('Echte Adressbücher (ohne Proxies):', realAddressBooks.map(b => b.displayName));

    // Spezielle Filterung für die gewünschten 3 Adressbücher
    const targetBooks = ['Vertreter', 'Edeka Adressbuch', 'Handwerker'];
    const filteredBooks = realAddressBooks.filter(book => {
      // Prüfe, ob der Adressbuch-Name einen der Ziel-Namen enthält
      return targetBooks.some(target => book.displayName.includes(target));
    }).map(book => {
      // Bereinige den Namen und entferne "(Andreas Jochum)" und ähnliche Zusätze
      const cleanName = this.cleanAddressBookName(book.displayName);
      // Speichere das Mapping zwischen bereinigtem Namen und ursprünglichem Namen
      this.addressBookMapping.set(cleanName, {originalName: book.displayName, url: book.url});
      
      return {
        displayName: cleanName,
        url: book.url,
        description: book.description
      };
    }).sort((a, b) => {
      // Sortiere nach der gewünschten Reihenfolge im targetBooks Array
      const indexA = targetBooks.indexOf(a.displayName);
      const indexB = targetBooks.indexOf(b.displayName);
      return indexA - indexB;
    });

    console.log('Gefilterte und bereinigte Adressbücher:', filteredBooks.map(b => b.displayName));

    if (filteredBooks.length > 0) {
      // Update allowedBooks for contact filtering
      this.allowedBooks = filteredBooks.map(book => book.displayName);
      return filteredBooks;
    }

    return [];
  }

  private cleanAddressBookName(name: string): string {
    // Entferne "(Andreas Jochum)" und ähnliche Zusätze in Klammern
    return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
  }

  async getContacts(addressBookName: string): Promise<CardDAVContact[]> {
    // If no specific allowedBooks restriction, allow any address book
    if (this.allowedBooks.length > 0 && !this.allowedBooks.includes(addressBookName)) {
      throw new Error('Zugriff auf dieses Adressbuch nicht erlaubt');
    }

    if (!this.isConfigured) {
      console.log(`Demo-Modus: Lade Demo-Kontakte für ${addressBookName}`);
      return this.getDemoContacts(addressBookName);
    }

    try {
      // Check cache - aber nur wenn wir echte vCard-Daten haben
      const cacheEntry = this.contactsCache.get(addressBookName);
      if (cacheEntry && Date.now() - cacheEntry.timestamp < this.CACHE_DURATION && cacheEntry.contacts.length > 0) {
        console.log(`Cache hit for ${addressBookName} (${cacheEntry.contacts.length} Kontakte)`);
        return cacheEntry.contacts;
      }
      
      // Cache leeren wenn keine Kontakte gefunden wurden
      if (cacheEntry && cacheEntry.contacts.length === 0) {
        console.log(`Cache miss für ${addressBookName} - leere Cache und lade neu`);
        this.contactsCache.delete(addressBookName);
      }

      // Lade die echten Adressbücher, um die URL zu finden
      console.log(`Debug: Lade Adressbücher für ${addressBookName}...`);
      const addressBooks = await this.getAddressBooks();
      const targetAddressBook = addressBooks.find(book => book.displayName === addressBookName);
      
      console.log(`Debug: Gefundenes Adressbuch:`, targetAddressBook);
      
      let fullUrl: string;
      if (targetAddressBook?.url) {
        // Verwende die echte URL aus den Adressbüchern
        fullUrl = targetAddressBook.url.startsWith('http') 
          ? targetAddressBook.url 
          : `${this.baseUrl}${targetAddressBook.url}`;
        console.log(`Debug: Verwende URL aus Adressbüchern: ${fullUrl}`);
      } else {
        // Fallback: Konstruiere URL wie vorher
        const addressBookPath = `${encodeURIComponent(addressBookName)}/`;
        const addressBookBaseUrl = this.serverUrl.replace('/principals/users/', '/addressbooks/users/');
        fullUrl = `${addressBookBaseUrl}${addressBookPath}`;
        console.log(`Debug: Verwende Fallback-URL: ${fullUrl}`);
      }
      
      console.log(`Versuche Kontakte zu laden von: ${fullUrl}`);
      
      // NEUE METHODE 0: Direkter Export als eine VCF-Datei (schnellste)
      console.log('Methode 0: Direkter Export als VCF-Datei...');
      try {
        const exportUrl = `${fullUrl}?export`;
        console.log(`Versuche Export von: ${exportUrl}`);
        
        const response = await fetch(exportUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${this.credentials}`,
            'Accept': 'text/vcard, application/vcard, */*',
            'Cache-Control': 'no-cache'
          }
        });

        if (response.ok) {
          const vcfContent = await response.text();
          console.log(`Export erfolgreich! VCF Länge: ${vcfContent.length} Zeichen`);
          
          if (vcfContent.includes('BEGIN:VCARD')) {
            // Parse die große VCF-Datei in einzelne Kontakte
            const contacts = this.parseVCFExport(vcfContent, fullUrl);
            console.log(`Export Kontakte geparst: ${contacts.length} für ${addressBookName}`);
            
            if (contacts.length > 0) {
              this.contactsCache.set(addressBookName, { contacts, timestamp: Date.now() });
              return contacts;
            }
          } else {
            console.log('Export erfolgreich, aber keine vCard-Daten gefunden');
          }
        } else {
          console.log(`Export Request failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`Export Methode fehlgeschlagen:`, error);
      }
      
      // OPTIMIERT: Verwende verschiedene CardDAV-Methoden für maximale Performance
      console.log('Versuche optimierte CardDAV-Methoden...');
      
      // Methode 1: REPORT ohne Filter (schnellste)
      const reportBodySimple = `<?xml version="1.0" encoding="utf-8" ?>
        <c:addressbook-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:carddav">
          <d:prop>
            <d:getetag />
            <c:address-data />
          </d:prop>
        </c:addressbook-query>`;

      try {
        console.log('Methode 1: REPORT ohne Filter...');
        let response = await fetch(fullUrl, {
          method: 'REPORT',
          headers: {
            'Authorization': `Basic ${this.credentials}`,
            'Content-Type': 'application/xml',
            'Depth': '1'
          },
          body: reportBodySimple
        });

        if (response.ok) {
          let xmlText = await response.text();
          console.log('REPORT Response XML Länge:', xmlText.length);
          console.log('Enthält card:address-data:', xmlText.includes('card:address-data'));

          // Parse Kontakte aus der REPORT Response
          const contacts = this.parseContactsFromXML(xmlText, targetAddressBook?.url || '');
          console.log(`REPORT Kontakte geparst: ${contacts.length} für ${addressBookName}`);

          // Wenn Kontakte gefunden wurden, cache und zurückgeben
          if (contacts.length > 0) {
            this.contactsCache.set(addressBookName, { contacts, timestamp: Date.now() });
            return contacts;
          }
        } else {
          console.log(`REPORT Request failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log('REPORT Request fehlgeschlagen:', error);
      }

      // Methode 2: PROPFIND mit card:address-data (zweitschnellste)
      console.log('Methode 2: PROPFIND mit card:address-data...');
      const propfindWithDataBody = `<?xml version="1.0" encoding="utf-8" ?>
        <d:propfind xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
          <d:prop>
            <d:getetag />
            <card:address-data />
          </d:prop>
        </d:propfind>`;

      try {
        let response = await fetch(fullUrl, {
          method: 'PROPFIND',
          headers: {
            'Authorization': `Basic ${this.credentials}`,
            'Content-Type': 'application/xml',
            'Depth': '1'
          },
          body: propfindWithDataBody
        });

        if (response.ok) {
          let xmlText = await response.text();
          console.log('PROPFIND Response XML Länge:', xmlText.length);
          console.log('Enthält card:address-data:', xmlText.includes('card:address-data'));

          // Parse Kontakte aus der PROPFIND Response
          const contacts = this.parseContactsFromXML(xmlText, targetAddressBook?.url || '');
          console.log(`PROPFIND Kontakte geparst: ${contacts.length} für ${addressBookName}`);

          // Wenn Kontakte gefunden wurden, cache und zurückgeben
          if (contacts.length > 0) {
            this.contactsCache.set(addressBookName, { contacts, timestamp: Date.now() });
            return contacts;
          }
        } else {
          console.log(`PROPFIND Request failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log('PROPFIND Request fehlgeschlagen:', error);
      }

      // Methode 3: OPTIMIERTE direkte GET-Requests mit größeren Batches
      console.log('Methode 3: Optimierte direkte GET-Requests...');
      const directContacts = await this.getContactsViaDirectRequestsOptimized(fullUrl);
      
      if (directContacts.length > 0) {
        this.contactsCache.set(addressBookName, { contacts: directContacts, timestamp: Date.now() });
        return directContacts;
      }
      
      // Fallback zu Demo-Kontakten
      console.log(`Keine echten Kontakte gefunden für ${addressBookName}, verwende Demo-Kontakte`);
      return this.getDemoContacts(addressBookName);
    } catch (error) {
      console.error('Fehler beim Laden der Kontakte:', error);
      
      // Return demo contacts if real connection fails
      return this.getDemoContacts(addressBookName);
    }
  }

  private parseAddressBooksFromXML(xmlText: string): CardDAVAddressBook[] {
    const books: CardDAVAddressBook[] = [];
    
    // Simple regex-based XML parsing (not ideal but works for basic cases)
    const responseRegex = /<d:response[^>]*>(.*?)<\/d:response>/gs;
    let match;
    
    while ((match = responseRegex.exec(xmlText)) !== null) {
      const responseContent = match[1];
      
      // Check if it's an address book
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
     
     console.log('Parsing XML für Kontakte...');
     console.log('XML Länge:', xmlText.length);
     
     const responseRegex = /<d:response[^>]*>(.*?)<\/d:response>/gs;
     let match;
     let responseCount = 0;
     
     while ((match = responseRegex.exec(xmlText)) !== null) {
       responseCount++;
       const responseContent = match[1];
       
       console.log(`Response ${responseCount}:`, responseContent.substring(0, 200) + '...');
       
       const hrefMatch = responseContent.match(/<d:href[^>]*>(.*?)<\/d:href>/);
       const etagMatch = responseContent.match(/<d:getetag[^>]*>(.*?)<\/d:getetag>/);
       const vcardMatch = responseContent.match(/<card:address-data[^>]*>(.*?)<\/card:address-data>/);
       
       console.log('Href Match:', hrefMatch?.[1]);
       console.log('ETag Match:', etagMatch?.[1]);
       console.log('vCard Match vorhanden:', !!vcardMatch);
       
       if (hrefMatch && vcardMatch) {
         const vcard = vcardMatch[1].trim();
         console.log('vCard gefunden, Länge:', vcard.length);
         console.log('vCard Inhalt:', vcard.substring(0, 200) + '...');
         
         const contact = this.parseVCard(vcard, hrefMatch[1].trim(), etagMatch?.[1].trim());
         
         if (contact.name !== 'Unbekannt') {
           contacts.push(contact);
           console.log('Kontakt hinzugefügt:', contact.name);
         }
       } else {
         console.log('Keine vCard-Daten in dieser Response gefunden');
       }
     }
     
     console.log(`Insgesamt ${responseCount} Responses gefunden, ${contacts.length} Kontakte geparst`);
     return contacts;
   }

  private parseVCard(vcard: string, url: string, etag?: string): CardDAVContact {
    // Erweiterte vCard-Parsing für alle verfügbaren Felder
    const name = this.extractVCardField(vcard, 'FN') || this.extractVCardField(vcard, 'N') || 'Unbekannt';
    
    // E-Mail-Adressen (alle)
    const emails = this.extractAllVCardFields(vcard, 'EMAIL');
    const email = emails.length > 0 ? emails[0] : undefined;
    
    // Telefonnummern (alle mit Typen)
    const phones = this.extractPhoneNumbers(vcard);
    const phone = phones.length > 0 ? phones[0].number : undefined;
    
    // Firmen-/Organisationsdaten
    const company = this.extractVCardField(vcard, 'ORG');
    const title = this.extractVCardField(vcard, 'TITLE');
    
    // Adresse
    const address = this.extractAddress(vcard);
    
    // Weitere Felder
    const website = this.extractVCardField(vcard, 'URL');
    const birthday = this.extractVCardField(vcard, 'BDAY');
    const notes = this.extractVCardField(vcard, 'NOTE');

    return {
      id: url,
      name,
      email,
      emails: emails.length > 0 ? emails : undefined,
      phone,
      phones: phones.length > 0 ? phones : undefined,
      company,
      title,
      address,
      website,
      birthday,
      notes,
      vcard,
      etag,
      url
    };
  }

  private extractAllVCardFields(vcard: string, field: string): string[] {
    if (!vcard) return [];
    
    // Erweiterte Regex für verschiedene vCard-Formate (inkl. iPhone)
    const patterns = [
      // Standard vCard Format
      new RegExp(`^${field}[^:]*:(.*)$`, 'gim'),
      // iPhone Format: item1.EMAIL;type=INTERNET;type=pref:email@example.com
      new RegExp(`^item\\d+\\.${field}[^:]*:(.*)$`, 'gim'),
      // Alternative iPhone Format: EMAIL;type=INTERNET:email@example.com
      new RegExp(`^${field};[^:]*:(.*)$`, 'gim')
    ];
    
    const matches: string[] = [];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(vcard)) !== null) {
        if (match[1]) {
          let value = match[1].trim();
          
          // vCard-Escaping entfernen
          value = value
            .replace(/\\n/g, '\n')
            .replace(/\\,/g, ',')
            .replace(/\\\\/g, '\\');
          
          // HTML-Entities und Steuerzeichen bereinigen
          value = this.decodeHtmlEntities(value);
          value = this.cleanControlCharacters(value);
          
          if (value && !matches.includes(value)) {
            matches.push(value);
          }
        }
      }
    }
    
    return matches;
  }

  private formatPhoneNumber(number: string): string {
    if (!number) return '';
    
    // Entferne alle Leerzeichen und Sonderzeichen
    let cleaned = number.replace(/[\s\-\(\)]/g, '');
    
    // Entferne +49 am Anfang und ersetze durch 0
    if (cleaned.startsWith('+49')) {
      cleaned = '0' + cleaned.substring(3);
    }
    
    // Entferne 49 am Anfang (falls kein + vorhanden war)
    if (cleaned.startsWith('49') && cleaned.length > 10) {
      cleaned = '0' + cleaned.substring(2);
    }
    
    // Keine Formatierung mit Leerzeichen - einfach die bereinigte Nummer zurückgeben
    return cleaned;
  }

  private extractPhoneNumbers(vcard: string): { type: string; number: string; }[] {
    if (!vcard) return [];
    
    // Erweiterte Regex für verschiedene Telefonnummern-Formate
    const phonePatterns = [
      // Standard Format: TEL;type=CELL:+49123456789
      /^TEL([^:]*):(.*)$/gim,
      // iPhone Format: TEL;type=CELL;type=VOICE;type=pref:+49123456789
      /^TEL;([^:]*):(.*)$/gim,
      // Alternative iPhone Format: item1.TEL;type=CELL:+49123456789
      /^item\d+\.TEL([^:]*):(.*)$/gim
    ];
    
    const phones: { type: string; number: string; }[] = [];
    
    for (const pattern of phonePatterns) {
      let match;
      while ((match = pattern.exec(vcard)) !== null) {
        const typeInfo = match[1] || '';
        let number = match[2].trim();
        
        // Nummer bereinigen
        number = this.decodeHtmlEntities(number);
        number = this.cleanControlCharacters(number);
        
        if (number) {
          // Telefon-Typ bestimmen (erweiterte Logik für iPhone-Format)
          let type = 'Telefon';
          const lowerTypeInfo = typeInfo.toLowerCase();
          
          if (lowerTypeInfo.includes('cell') || lowerTypeInfo.includes('mobile')) {
            type = 'Handy';
          } else if (lowerTypeInfo.includes('fax')) {
            type = 'Fax';
          } else if (lowerTypeInfo.includes('work')) {
            type = 'Telefon';
          } else if (lowerTypeInfo.includes('home')) {
            type = 'Telefon';
          } else if (lowerTypeInfo.includes('voice')) {
            type = 'Telefon';
          }
          
          // Nummer formatieren
          const formattedNumber = this.formatPhoneNumber(number);
          
          // Prüfe ob diese Nummer bereits existiert
          const exists = phones.some(phone => phone.number === formattedNumber && phone.type === type);
          if (!exists) {
            phones.push({ type, number: formattedNumber });
          }
        }
      }
    }
    
    // Sortiere nach gewünschter Reihenfolge: Handy, Telefon, Fax
    return phones.sort((a, b) => {
      const order = { 'Handy': 1, 'Telefon': 2, 'Fax': 3 };
      const orderA = order[a.type as keyof typeof order] || 4;
      const orderB = order[b.type as keyof typeof order] || 4;
      return orderA - orderB;
    });
  }

  private extractAddress(vcard: string): { street?: string; city?: string; postalCode?: string; country?: string; full?: string; } | undefined {
    const adrField = this.extractVCardField(vcard, 'ADR');
    if (!adrField) return undefined;
    
    // ADR-Format: ;;Straße;Stadt;Region;PLZ;Land
    const parts = adrField.split(';');
    
    const street = parts[2]?.trim() || undefined;
    const city = parts[3]?.trim() || undefined;
    const postalCode = parts[5]?.trim() || undefined;
    const country = parts[6]?.trim() || undefined;
    
    // Vollständige Adresse zusammensetzen
    const addressParts = [street, postalCode, city, country].filter(p => p && p.length > 0);
    const full = addressParts.length > 0 ? addressParts.join(', ') : undefined;
    
    if (!street && !city && !postalCode && !country) {
      return undefined;
    }
    
    return {
      street,
      city,
      postalCode,
      country,
      full
    };
  }

  private extractVCardField(vcard: string, field: string): string | undefined {
    if (!vcard) return undefined;
    
    const regex = new RegExp(`^${field}[^:]*:(.*)$`, 'im');
    const match = vcard.match(regex);
    
    if (match && match[1]) {
      let value = match[1].trim();
      
      // vCard-Escaping entfernen
      value = value
        .replace(/\\n/g, '\n')
        .replace(/\\,/g, ',')
        .replace(/\\\\/g, '\\');
      
      // HTML-Entities dekodieren
      value = this.decodeHtmlEntities(value);
      
      // Steuerzeichen und Zeilenendezeichen bereinigen
      value = this.cleanControlCharacters(value);
      
      return value;
    }
    
    return undefined;
  }

  private decodeHtmlEntities(text: string): string {
    // HTML-Entities dekodieren
    const entities: { [key: string]: string } = {
      '&#13;': '', // Carriage Return entfernen
      '&#10;': '', // Line Feed entfernen  
      '&#9;': ' ', // Tab zu Leerzeichen
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&nbsp;': ' ',
      '&#228;': 'ä',
      '&#246;': 'ö',
      '&#252;': 'ü',
      '&#196;': 'Ä',
      '&#214;': 'Ö',
      '&#220;': 'Ü',
      '&#223;': 'ß'
    };
    
    let result = text;
    for (const [entity, replacement] of Object.entries(entities)) {
      result = result.replace(new RegExp(entity, 'g'), replacement);
    }
    
    // Numerische HTML-Entities dekodieren (&#xxx;)
    result = result.replace(/&#(\d+);/g, (match, code) => {
      const charCode = parseInt(code, 10);
      // Steuerzeichen filtern (0-31, außer 9, 10, 13)
      if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
        return '';
      }
      // Carriage Return und Line Feed entfernen
      if (charCode === 13 || charCode === 10) {
        return '';
      }
      return String.fromCharCode(charCode);
    });
    
    // UTF-8 fehlkodierte Umlaute korrigieren
    result = this.fixUtf8Encoding(result);
    
    return result;
  }

  private fixUtf8Encoding(text: string): string {
    // Häufige UTF-8 Fehlkodierungen korrigieren
    const utf8Fixes: { [key: string]: string } = {
      'Ã¤': 'ä',
      'Ã¶': 'ö', 
      'Ã¼': 'ü',
      'Ã„': 'Ä',
      'Ã–': 'Ö',
      'Ã œ': 'Ü',
      'ÃŸ': 'ß',
      'Ã©': 'é',
      'Ã¨': 'è',
      'Ã¡': 'á',
      'Ã ': 'à',
      'Ã³': 'ó',
      'Ã²': 'ò',
      'Ãº': 'ú',
      'Ã¹': 'ù',
      'Ã­': 'í',
      'Ã¬': 'ì',
      'Ã±': 'ñ',
      'Ã§': 'ç'
    };
    
    let result = text;
    for (const [wrong, correct] of Object.entries(utf8Fixes)) {
      result = result.replace(new RegExp(wrong, 'g'), correct);
    }
    
    return result;
  }

  private cleanControlCharacters(text: string): string {
    // Steuerzeichen entfernen (außer normalen Leerzeichen)
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Steuerzeichen entfernen
      .replace(/\r\n/g, ' ') // Windows-Zeilenenede durch Leerzeichen ersetzen
      .replace(/[\r\n]/g, ' ') // Einzelne Zeilenendezeichen durch Leerzeichen ersetzen
      .replace(/\s+/g, ' ') // Mehrfache Leerzeichen durch einzelnes ersetzen
      .trim(); // Führende und nachfolgende Leerzeichen entfernen
  }

  private async getContactsViaDirectRequestsOptimized(addressBookUrl: string): Promise<CardDAVContact[]> {
    console.log('Lade Kontakte via optimierte direkte GET-Requests...');
    
    // Konstruiere vollständige URL für den initialen PROPFIND Request
    const fullAddressBookUrl = addressBookUrl.startsWith('http') 
      ? addressBookUrl 
      : `${this.baseUrl}${addressBookUrl}`;
    
    console.log('Vollständige Adressbuch-URL für PROPFIND:', fullAddressBookUrl);
    
    // Zuerst PROPFIND um alle vCard-Dateien zu finden
    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
      <d:propfind xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
        <d:prop>
          <d:getetag />
        </d:prop>
      </d:propfind>`;

    const response = await fetch(fullAddressBookUrl, {
      method: 'PROPFIND',
      headers: {
        'Authorization': `Basic ${this.credentials}`,
        'Content-Type': 'application/xml',
        'Depth': '1'
      },
      body: propfindBody
    });

    if (!response.ok) {
      throw new Error(`PROPFIND Request failed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log('PROPFIND Response für direkte Requests:', xmlText.substring(0, 500) + '...');

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
          // Konstruiere vollständige URL mit baseUrl
          const fullVcardUrl = href.startsWith('http') 
            ? href 
            : `${this.baseUrl}${href}`;
          vcardUrls.push(fullVcardUrl);
        }
      }
    }

    console.log(`Gefundene vCard-Dateien: ${vcardUrls.length}`);

    // OPTIMIERT: Größere Batches und bessere Performance
    const contacts: CardDAVContact[] = [];
    const batchSize = 50; // Erhöht von 10 auf 50 für bessere Performance
    
    for (let i = 0; i < vcardUrls.length; i += batchSize) {
      const batch = vcardUrls.slice(i, i + batchSize);
      console.log(`Lade optimierten Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(vcardUrls.length/batchSize)} (${batch.length} vCards)`);
      
      // Lade Batch parallel mit optimierten Headers
      const batchPromises = batch.map(async (vcardUrl) => {
        try {
          const vcardResponse = await fetch(vcardUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${this.credentials}`,
              'Accept': 'text/vcard, application/vcard',
              'Cache-Control': 'no-cache'
            }
          });

          if (vcardResponse.ok) {
            const vcardText = await vcardResponse.text();
            const contact = this.parseVCard(vcardText, vcardUrl);
            if (contact.name !== 'Unbekannt') {
              return contact;
            }
          } else {
            console.log(`Fehler beim Laden von ${vcardUrl}: ${vcardResponse.status}`);
          }
        } catch (error) {
          console.log(`Fehler beim Laden von ${vcardUrl}:`, error);
        }
        return null;
      });
      
      // Warte auf Batch-Completion
      const batchResults = await Promise.all(batchPromises);
      const validContacts = batchResults.filter(contact => contact !== null) as CardDAVContact[];
      contacts.push(...validContacts);
      
      console.log(`Optimierter Batch ${Math.floor(i/batchSize) + 1} abgeschlossen: ${validContacts.length} Kontakte geladen`);
    }

    console.log(`Insgesamt ${contacts.length} Kontakte via optimierte direkte Requests geladen`);
    return contacts;
  }

  private async getContactsViaDirectRequests(addressBookUrl: string): Promise<CardDAVContact[]> {
    console.log('Lade Kontakte via direkte GET-Requests...');
    
    // Konstruiere vollständige URL für den initialen PROPFIND Request
    const fullAddressBookUrl = addressBookUrl.startsWith('http') 
      ? addressBookUrl 
      : `${this.baseUrl}${addressBookUrl}`;
    
    console.log('Vollständige Adressbuch-URL für PROPFIND:', fullAddressBookUrl);
    
    // Zuerst PROPFIND um alle vCard-Dateien zu finden
    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
      <d:propfind xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
        <d:prop>
          <d:getetag />
        </d:prop>
      </d:propfind>`;

    const response = await fetch(fullAddressBookUrl, {
      method: 'PROPFIND',
      headers: {
        'Authorization': `Basic ${this.credentials}`,
        'Content-Type': 'application/xml',
        'Depth': '1'
      },
      body: propfindBody
    });

    if (!response.ok) {
      throw new Error(`PROPFIND Request failed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log('PROPFIND Response für direkte Requests:', xmlText.substring(0, 500) + '...');

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
          // Konstruiere vollständige URL mit baseUrl
          const fullVcardUrl = href.startsWith('http') 
            ? href 
            : `${this.baseUrl}${href}`;
          vcardUrls.push(fullVcardUrl);
        }
      }
    }

    console.log(`Gefundene vCard-Dateien: ${vcardUrls.length}`);

    // OPTIMIERT: Lade vCards in Batches für bessere Performance
    const contacts: CardDAVContact[] = [];
    const batchSize = 10; // Lade 10 vCards parallel
    
    for (let i = 0; i < vcardUrls.length; i += batchSize) {
      const batch = vcardUrls.slice(i, i + batchSize);
      console.log(`Lade Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(vcardUrls.length/batchSize)} (${batch.length} vCards)`);
      
      // Lade Batch parallel
      const batchPromises = batch.map(async (vcardUrl) => {
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
              return contact;
            }
          } else {
            console.log(`Fehler beim Laden von ${vcardUrl}: ${vcardResponse.status}`);
          }
        } catch (error) {
          console.log(`Fehler beim Laden von ${vcardUrl}:`, error);
        }
        return null;
      });
      
      // Warte auf Batch-Completion
      const batchResults = await Promise.all(batchPromises);
      const validContacts = batchResults.filter(contact => contact !== null) as CardDAVContact[];
      contacts.push(...validContacts);
      
      console.log(`Batch ${Math.floor(i/batchSize) + 1} abgeschlossen: ${validContacts.length} Kontakte geladen`);
    }

    console.log(`Insgesamt ${contacts.length} Kontakte via direkte Requests geladen`);
    return contacts;
  }

  private parseVCFExport(vcfContent: string, baseUrl: string): CardDAVContact[] {
    console.log('Parse VCF Export...');
    
    // Teile die große VCF-Datei in einzelne vCards auf
    const vcardRegex = /BEGIN:VCARD[\s\S]*?END:VCARD/g;
    const vcardMatches = vcfContent.match(vcardRegex);
    
    if (!vcardMatches) {
      console.log('Keine vCard-Einträge in der Export-Datei gefunden');
      return [];
    }
    
    console.log(`Gefundene vCard-Einträge: ${vcardMatches.length}`);
    
    const contacts: CardDAVContact[] = [];
    
    for (let i = 0; i < vcardMatches.length; i++) {
      const vcard = vcardMatches[i];
      try {
        // Generiere eine eindeutige URL für jeden Kontakt
        const contactId = `export-${i}-${Date.now()}`;
        const contactUrl = `${baseUrl}${contactId}.vcf`;
        
        const contact = this.parseVCard(vcard, contactUrl);
        if (contact.name !== 'Unbekannt') {
          contacts.push(contact);
        }
      } catch (error) {
        console.log(`Fehler beim Parsen von vCard ${i}:`, error);
      }
    }
    
    console.log(`Export erfolgreich geparst: ${contacts.length} Kontakte`);
    return contacts;
  }

  private getDemoContacts(addressBookName: string): CardDAVContact[] {
    // Demo-Kontakte als Fallback
    const demoContacts = [
      {
        id: '1',
        name: 'Max Mustermann',
        email: 'max.mustermann@edeka.de',
        phone: '+49 123 456789',
        company: 'EDEKA Zentrale',
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Max Mustermann\nEMAIL:max.mustermann@edeka.de\nTEL:+49 123 456789\nORG:EDEKA Zentrale\nEND:VCARD'
      },
      {
        id: '2',
        name: 'Anna Schmidt',
        email: 'anna.schmidt@vertreter.com',
        phone: '+49 987 654321',
        company: 'Vertrieb Nord',
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Anna Schmidt\nEMAIL:anna.schmidt@vertreter.com\nTEL:+49 987 654321\nORG:Vertrieb Nord\nEND:VCARD'
      },
      {
        id: '3',
        name: 'Klaus Bauer',
        email: 'klaus.bauer@handwerk.de',
        phone: '+49 555 123456',
        company: 'Bauer Sanitär',
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Klaus Bauer\nEMAIL:klaus.bauer@handwerk.de\nTEL:+49 555 123456\nORG:Bauer Sanitär\nEND:VCARD'
      },
      {
        id: '4',
        name: 'Petra Meier',
        email: 'petra.meier@edeka-sued.de',
        phone: '+49 444 111222',
        company: 'EDEKA Süd',
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Petra Meier\nEMAIL:petra.meier@edeka-sued.de\nTEL:+49 444 111222\nORG:EDEKA Süd\nEND:VCARD'
      },
      {
        id: '5',
        name: 'Thomas Wagner',
        email: 'thomas.wagner@vertrieb-west.com',
        phone: '+49 333 999888',
        company: 'Vertrieb West GmbH',
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Thomas Wagner\nEMAIL:thomas.wagner@vertrieb-west.com\nTEL:+49 333 999888\nORG:Vertrieb West GmbH\nEND:VCARD'
      },
      {
        id: '6',
        name: 'Sandra Hoffmann',
        email: 'sandra.hoffmann@elektro-hoffmann.de',
        phone: '+49 222 777555',
        company: 'Elektro Hoffmann',
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Sandra Hoffmann\nEMAIL:sandra.hoffmann@elektro-hoffmann.de\nTEL:+49 222 777555\nORG:Elektro Hoffmann\nEND:VCARD'
      }
    ];

    // Filter based on address book name
    if (addressBookName.includes('Edeka')) {
      return demoContacts.filter(c => c.company?.includes('EDEKA'));
    } else if (addressBookName.includes('Vertreter')) {
      return demoContacts.filter(c => c.company?.includes('Vertrieb'));
    } else if (addressBookName.includes('Handwerker')) {
      return demoContacts.filter(c => 
        c.company?.includes('Sanitär') || 
        c.company?.includes('Handwerk') || 
        c.company?.includes('Elektro')
      );
    }

    return demoContacts;
  }

  async searchContacts(addressBookName: string, searchTerm: string): Promise<CardDAVContact[]> {
    // Prüfe erst den Cache, bevor wir laden
    const cacheEntry = this.contactsCache.get(addressBookName);
    let contacts: CardDAVContact[];
    
    if (cacheEntry && Date.now() - cacheEntry.timestamp < this.CACHE_DURATION) {
      console.log(`Cache hit für Suche in ${addressBookName}`);
      contacts = cacheEntry.contacts;
    } else {
      console.log(`Cache miss für Suche in ${addressBookName} - lade Kontakte`);
      contacts = await this.getContacts(addressBookName);
    }
    
    if (!searchTerm) return contacts;
    
    const term = searchTerm.toLowerCase();
    return contacts.filter(contact => {
      // Grundfelder durchsuchen
      if (contact.name.toLowerCase().includes(term) ||
          contact.email?.toLowerCase().includes(term) ||
          contact.phone?.toLowerCase().includes(term) ||
          contact.company?.toLowerCase().includes(term)) {
        return true;
      }
      
      // Erweiterte Felder durchsuchen
      if (contact.title?.toLowerCase().includes(term) ||
          contact.website?.toLowerCase().includes(term) ||
          contact.notes?.toLowerCase().includes(term)) {
        return true;
      }
      
      // Alle E-Mail-Adressen durchsuchen
      if (contact.emails?.some(email => email.toLowerCase().includes(term))) {
        return true;
      }
      
      // Alle Telefonnummern durchsuchen
      if (contact.phones?.some(phone => 
        phone.number.toLowerCase().includes(term) || 
        phone.type.toLowerCase().includes(term)
      )) {
        return true;
      }
      
      // Adresse durchsuchen
      if (contact.address) {
        if (contact.address.street?.toLowerCase().includes(term) ||
            contact.address.city?.toLowerCase().includes(term) ||
            contact.address.postalCode?.toLowerCase().includes(term) ||
            contact.address.country?.toLowerCase().includes(term) ||
            contact.address.full?.toLowerCase().includes(term)) {
          return true;
        }
      }
      
      return false;
    });
  }

  // Cache-Verwaltung
  clearCache(addressBookName?: string): void {
    if (addressBookName) {
      this.contactsCache.delete(addressBookName);
      console.log(`Cache für ${addressBookName} geleert`);
    } else {
      this.contactsCache.clear();
      console.log('Kompletter Cache geleert');
    }
  }

  getCacheStatus(): { [key: string]: { contactCount: number, age: string } } {
    const status: { [key: string]: { contactCount: number, age: string } } = {};
    
    for (const [addressBook, cacheEntry] of this.contactsCache.entries()) {
      const ageMs = Date.now() - cacheEntry.timestamp;
      const ageMin = Math.floor(ageMs / (60 * 1000));
      const ageSec = Math.floor((ageMs % (60 * 1000)) / 1000);
      
      status[addressBook] = {
        contactCount: cacheEntry.contacts.length,
        age: `${ageMin}m ${ageSec}s`
      };
    }
    
    return status;
  }
}

// Export eine Singleton-Instanz
export const cardDAVClient = new SimpleCardDAVClient(); 