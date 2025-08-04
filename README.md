# Telefonbuch v2 - Nextcloud Kontakte

Eine moderne, responsive Webanwendung für die Verwaltung und Anzeige von Nextcloud-Kontakten über CardDAV.

## Features

- 🎨 **Modernes Design** - Frische, aufgeräumte Benutzeroberfläche mit blauen Akzenten
- 📱 **Responsive** - Funktioniert auf Desktop, Tablet und Smartphone
- 🔍 **Echtzeit-Suche** - Durchsuchen von Namen, Organisationen, Telefonnummern und E-Mails
- 📊 **Übersichtskarten** - Zusammenfassung der Kontakte nach Kategorien
- 🔄 **Live-Aktualisierung** - Kontakte können über den "Aktualisieren"-Button neu geladen werden
- 📞 **Vollständige Kontaktdaten** - Anzeige von Telefonnummern, Fax und E-Mail-Adressen

## Installation

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **Umgebungsvariablen konfigurieren:**
   Erstelle eine `.env.local` Datei im Root-Verzeichnis:
   ```env
   CARDAV_SERVER_URL=https://nextcloud.ecenter-jochum.de/remote.php/dav/principals/users/kontakte/
   CARDAV_USERNAME=Kontakte
   CARDAV_PASSWORD=contacts@edeka
   ```

3. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

4. **Anwendung öffnen:**
   Öffne [http://localhost:3000](http://localhost:3000) in deinem Browser.

## Technologie-Stack

- **Next.js 14** - React-Framework mit App Router
- **TypeScript** - Typsichere Entwicklung
- **Tailwind CSS** - Utility-first CSS Framework
- **Lucide React** - Moderne Icons
- **Axios** - HTTP-Client für API-Anfragen
- **xml2js** - XML-Parsing für CardDAV

## Projektstruktur

```
telefonbuch-v2/
├── app/                    # Next.js App Router
│   ├── api/               # API-Routen
│   ├── globals.css        # Globale Styles
│   ├── layout.tsx         # Root-Layout
│   └── page.tsx           # Hauptseite
├── components/            # React-Komponenten
│   ├── ContactCard.tsx    # Kontaktkarte
│   ├── SearchBar.tsx      # Suchleiste
│   └── SummaryCards.tsx   # Übersichtskarten
├── lib/                   # Utility-Funktionen
│   └── carddav.ts         # CardDAV-Client
└── public/                # Statische Dateien
```

## CardDAV-Integration

Die Anwendung ist für die Integration mit Nextcloud-Kontakten über CardDAV konfiguriert. Die CardDAV-Client-Implementierung in `lib/carddav.ts` kann an spezifische Nextcloud-Setups angepasst werden.

### Aktuelle Implementierung

- Verwendet Mock-Daten für die Entwicklung
- Kann einfach auf echte CardDAV-Integration umgestellt werden
- Unterstützt Authentifizierung über Basic Auth

## Entwicklung

### Verfügbare Scripts

- `npm run dev` - Startet den Entwicklungsserver
- `npm run build` - Erstellt eine Produktionsversion
- `npm run start` - Startet den Produktionsserver
- `npm run lint` - Führt ESLint aus

### Hinweise zur CardDAV-Integration

Für die vollständige CardDAV-Integration müssen folgende Anpassungen vorgenommen werden:

1. **XML-Parsing implementieren** - Die CardDAV-Antworten müssen korrekt geparst werden
2. **VCF-Dateien verarbeiten** - Kontaktdaten aus VCF-Format extrahieren
3. **Fehlerbehandlung** - Robuste Fehlerbehandlung für Netzwerkprobleme
4. **Caching** - Implementierung von Caching für bessere Performance

## Lizenz

Dieses Projekt ist für den internen Gebrauch bestimmt. 