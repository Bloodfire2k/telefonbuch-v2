# Telefonbuch v2 - Nextcloud CardDAV Integration

Ein modernes, sauberes Telefonbuch für Nextcloud Kontakte mit CardDAV Integration.

## 🚀 Features

- **📱 Moderne UI** mit blauen Akzenten und sauberem Design
- **🔍 Live-Suche** in allen Kontakten
- **📞 Anklickbare Telefonnummern** (öffnet Telefon-App auf mobilen Geräten)
- **📧 Anklickbare E-Mail-Adressen** (öffnet E-Mail-App)
- **📊 Übersichtliche Statistiken** nach Adressbüchern
- **🔄 Automatische Aktualisierung** mit Cache-System
- **📱 Responsive Design** für alle Geräte

## 🛠️ Technologie-Stack

- **Next.js 14** mit App Router
- **TypeScript** für typsichere Entwicklung
- **Tailwind CSS** für modernes Styling
- **Lucide React** für Icons
- **CardDAV** für Nextcloud Integration

## 📦 Installation

### Lokale Entwicklung

1. **Repository klonen:**
```bash
git clone https://github.com/dein-username/telefonbuch-v2.git
cd telefonbuch-v2
```

2. **Abhängigkeiten installieren:**
```bash
npm install
```

3. **Umgebungsvariablen konfigurieren:**
Erstelle eine `.env.local` Datei:
```env
CARDAV_SERVER_URL=https://dein-nextcloud-server.com
CARDAV_USERNAME=dein-username
CARDAV_PASSWORD=dein-password
USE_REAL_CARDAV=true
ALLOWED_ADDRESSBOOKS=Vertreter,Edeka Adressbuch,Handwerker
```

4. **Entwicklungsserver starten:**
```bash
npm run dev
```

Die Anwendung ist dann unter `http://localhost:3000` verfügbar.

## 🐳 Docker Deployment

### Mit Docker Compose

1. **Docker Compose starten:**
```bash
docker-compose up -d
```

### Mit Coolify

1. **GitHub Repository erstellen** und Code pushen
2. **Coolify Dashboard** öffnen
3. **Neue Anwendung** erstellen
4. **GitHub Repository** auswählen
5. **Umgebungsvariablen** in Coolify konfigurieren:
   - `CARDAV_SERVER_URL`
   - `CARDAV_USERNAME`
   - `CARDAV_PASSWORD`
   - `USE_REAL_CARDAV=true`
   - `ALLOWED_ADDRESSBOOKS`

## 🔧 Konfiguration

### Umgebungsvariablen

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `CARDAV_SERVER_URL` | Nextcloud Server URL | `https://nextcloud.example.com` |
| `CARDAV_USERNAME` | CardDAV Benutzername | `kontakte` |
| `CARDAV_PASSWORD` | CardDAV Passwort | `password123` |
| `USE_REAL_CARDAV` | Echte CardDAV Integration | `true` |
| `ALLOWED_ADDRESSBOOKS` | Erlaubte Adressbücher | `Vertreter,Edeka Adressbuch,Handwerker` |

### Adressbuch-Konfiguration

Die Anwendung unterstützt verschiedene Adressbuch-Typen:
- **Vertreter** - Vertriebskontakte
- **Edeka Adressbuch** - Hauptadressbuch
- **Handwerker** - Handwerker-Kontakte

## 📱 Features im Detail

### Telefonnummern-Formatierung
- **+49** wird automatisch zu **0** konvertiert
- **Anklickbare Links** für mobile Geräte
- **Dynamische Icons** je nach Telefonnummer-Typ:
  - 📱 **Smartphone** für Handy-Nummern
  - 📞 **Phone** für normale Telefonnummern
  - 🖨️ **Printer** für Fax-Nummern

### E-Mail-Integration
- **iPhone vCard Support** für `item1.EMAIL;type=INTERNET`
- **Anklickbare E-Mail-Links**
- **Mehrere E-Mail-Adressen** pro Kontakt

### Suchfunktion
- **Live-Suche** in allen Kontaktfeldern
- **Sofortige Ergebnisse** ohne Verzögerung
- **Case-insensitive** Suche

## 🚀 Deployment mit Coolify

### Schritt 1: GitHub Repository
1. Gehe zu [GitHub](https://github.com)
2. Erstelle ein neues Repository: `telefonbuch-v2`
3. Führe folgende Befehle aus:

```bash
git remote add origin https://github.com/dein-username/telefonbuch-v2.git
git branch -M main
git push -u origin main
```

### Schritt 2: Coolify Konfiguration
1. **Coolify Dashboard** öffnen
2. **"New Application"** klicken
3. **"GitHub"** als Quelle auswählen
4. **Repository** auswählen: `telefonbuch-v2`
5. **Branch** auswählen: `main`
6. **Build Command** eingeben: `npm run build`
7. **Start Command** eingeben: `npm start`

### Schritt 3: Umgebungsvariablen
In Coolify folgende Umgebungsvariablen setzen:

```env
NODE_ENV=production
CARDAV_SERVER_URL=https://dein-nextcloud-server.com
CARDAV_USERNAME=dein-username
CARDAV_PASSWORD=dein-password
USE_REAL_CARDAV=true
ALLOWED_ADDRESSBOOKS=Vertreter,Edeka Adressbuch,Handwerker
```

### Schritt 4: Domain konfigurieren
1. **Custom Domain** hinzufügen (z.B. `telefonbuch.deine-domain.com`)
2. **SSL-Zertifikat** automatisch generieren lassen
3. **Deploy** starten

## 🔍 Troubleshooting

### Häufige Probleme

**Problem:** Keine Kontakte werden angezeigt
- **Lösung:** Prüfe die CardDAV-Zugangsdaten in den Umgebungsvariablen
- **Lösung:** Stelle sicher, dass `USE_REAL_CARDAV=true` gesetzt ist

**Problem:** Telefonnummern werden nicht formatiert
- **Lösung:** Prüfe die `formatPhoneNumber` Funktion in `lib/carddav.ts`

**Problem:** E-Mails von iPhone-Kontakten werden nicht angezeigt
- **Lösung:** Die Anwendung unterstützt bereits iPhone vCard-Format (`item1.EMAIL;type=INTERNET`)

## 📈 Performance

- **Caching-System** für bessere Performance
- **Lazy Loading** für große Kontaktlisten
- **Optimierte CardDAV-Requests**
- **Standalone Docker Build** für minimale Image-Größe

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 🆘 Support

Bei Fragen oder Problemen:
1. Erstelle ein Issue auf GitHub
2. Prüfe die Troubleshooting-Sektion
3. Kontaktiere den Entwickler

---

**Entwickelt mit ❤️ für Nextcloud CardDAV Integration** 