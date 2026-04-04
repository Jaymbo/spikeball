# Deployment Guide für Spikeball ELO System

## Lokale Entwicklung

```bash
# Installation
npm install

# Datenbank initialisieren
npm run db:push

# Dev-Server starten (Port 3000)
npm run dev
```

Dev-Server Logs: `dev.log`

---

## Production Deployment auf dem Server

### 1. Vorbereitung (einmalig)

```bash
# SSH auf den Server
ssh user@your-server.com

# Git-Repository klonen
cd /opt/spikeball
git clone <repository-url> .

# Dependencies installieren
npm install

# Datenbank initialisieren (falls neu)
npm run db:push

# Build durchführen
npm run build
```

### 2. Production-Server starten

```bash
# Option 1: Direkt mit npm (für Tests)
npm run start

# Option 2: Mit PM2 (für permanenten Betrieb - empfohlen)
npm install -g pm2
pm2 start npm --name "spikeball" -- run start
pm2 save
pm2 startup
```

**Production-Server Logs**: `server.log`

---

## Wichtige Umgebungsvariablen (.env)

```env
# Datenbank (SQLite)
DATABASE_URL="file:./db/custom.db"

# Optional: Node-Environment
NODE_ENV=production
```

---

## Aktualisierungen auf dem Server

```bash
cd /opt/spikeball

# Code pullen
git pull origin main

# Dependencies aktualisieren
npm install

# Datenbank-Migrationen (falls nötig)
npm run db:push

# Neu bauen
npm run build

# PM2 neustarten
```

---

## Datenbank-Verwaltung

### Datenbank zurücksetzen (⚠️ alle Daten löschen!)
```bash
npm run db:reset
```

### Datenbank-Migrationen
```bash
# Neue Migration erstellen
npm run db:migrate

npm run db:generate
```

### Daten-Backups
```bash
# SQLite-DB-Datei kopieren
cp db/custom.db db/custom.db.backup.$(date +%Y%m%d_%H%M%S)
```

---

## Wichtige API-Endpoints

### Spiele
- `GET /api/games` - Alle Spiele auflisten
- `POST /api/games` - Neues Spiel eintragen
- `DELETE /api/games?id=xxx` - Spiel löschen

### Spieler
- `GET /api/players` - Alle Spieler auflisten
- `POST /api/players` - Neuen Spieler hinzufügen
- `DELETE /api/players?id=xxx` - Spieler löschen

### Rangliste
- `GET /api/leaderboard` - Aktuelle Rangliste (mit Decay)

  - Löscht alle EloChange-Einträge
  - Geht alle Spiele chronologisch durch und berechnet neu


## ELO-System Erklärung

### Berechnung
- Jeder Spieler wird gegen den **Durchschnitt der gegnerischen Team** verglichen
- Beispiel: Team 1 (Spieler 1, Spieler 2) vs Team 2 (Spieler 3, Spieler 4)
  - Spieler 1 wird gegen (Spieler 3 + Spieler 4) / 2 bewertet
  - Spieler 2 wird gegen (Spieler 3 + Spieler 4) / 2 bewertet
  - Spieler 3 wird gegen (Spieler 1 + Spieler 2) / 2 bewertet
  - Spieler 4 wird gegen (Spieler 1 + Spieler 2) / 2 bewertet

### Konstanten
- **K-Faktor**: 32 (ELO-Bewegung pro Spiel)
- **Startrating**: 1000
- **Decay**: 5% pro inaktivem Monat

Wenn du merkst, dass ELO-Berechnung falsch ist oder die Datenbank korrupt ist:
1. Gehe zum "Admin" Tab
2. Klicke "Spiele neu berechnen"
3. System setzt alle Ratings auf 1000 zurück
4. Alle Spiele werden chronologisch neu durchgerechnet
5. Die korrekte Rangliste wird generiert

---

## Troubleshooting

### "Games noch in der Datenbank nach Löschung"
✅ **Behoben** - DELETE-Route deletiert nun korrekt wins/losses pro Spieler

### "ELO-Rating stimmt nicht"
✅ **Behoben** - ELO wird nun gegen Gegner-Durchschnitt berechnet (nicht Team-Durchschnitt)

Wenn Issues noch auftreten:
- `npm run db:reset` - Alles zurücksetzen (⚠️ Daten löschen!)
- `POST /api/replay` - Spiele neu berechnen ohne zu löschen

### "Server startet nicht"
```bash
# Logs prüfen
tail -f server.log

# Dependencies neuinstallieren
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Port-Konfiguration

- **Dev**: Port 3000 (in `package.json`)
- **Production**: Port 3000 (über `next/standalone`)
- Um Port zu ändern: Caddy/Reverse-Proxy vor Next.js konfigurieren

Caddy-Config: `Caddyfile`

---

## Monitoring (empfohlen mit PM2)

```bash
# Status prüfen
pm2 status

# Logs anschauen
pm2 logs spikeball

# Auto-Restart bei Crash aktivieren
pm2 install pm2-auto-pull  # Auto git pull + restart
```
