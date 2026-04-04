"# Spikeball ELO System - Aktueller Stand

**Letztes Update:** automatisch generiert

---

## ✅ Implementierte Features

### 1. Core System
- ✅ Next.js 14 App Router Setup
- ✅ ELO Rating System für 2v2 Matches
- ✅ Players Management (CRUD)
- ✅ Game Recording & History
- ✅ Matchup Generation
- ✅ Admin Tools
- ✅ Leaderboard mit Decay (5% pro inaktivem Monat)
- ✅ JWT Auth System (Custom, PBKDF2)
- ✅ Responsive UI mit shadcn/ui Components

### 2. NEU: Friends Feature
- ✅ Database Schema (`Friendship` Model)
- ✅ API Endpoints:
  - `POST /api/friends` - Friend Request senden
  - `GET /api/friends` - Freundesliste abrufen
  - `GET /api/friends/requests` - Anfragen abrufen
  - `PATCH /api/friends/[id]` - Anfrage akzeptieren
  - `DELETE /api/friends/[id]` - Ablehnen/Löschen
- ✅ UI Components:
  - `AddFriendDialog` - Freund hinzufügen Dialog
  - `FriendRequests` - Anfragen-Liste
  - `FriendList` - Freundes-Liste
  - `FriendsTab` - Hauptkomponente mit Tabs
- ✅ Neue Tab in Hauptnavigation ("Freunde")

---

## 📁 Wichtige Dateistrukturen

### Database Schema
```
models:
  - User (mit friendshipsSent, friendshipsReceived)
  - Player (ELO, Stats)
  - Game
  - EloChange
  - Friendship (NEW - status: pending/accepted)
```

### API Routes
```
/api/auth/*         - Login, Logout, Check
/api/players/*       - Player CRUD
/api/games/*         - Game Recording, Deletion
/api/replay          - Full Replay (ELO Recalc)
/api/leaderboard     - Leaderboard with Decay
/api/friends/*       - NEW - Friendship System
```

### Components
```
/components/spikeball/* - Game, Leaderboard, Players, etc.
/components/friends/*   - NEW - Friends Feature
/components/auth/*      - Auth Modal, Password Change
/components/ui/*        - shadcn/ui components
```

---

## 🔧 Dev Workflows

```bash
# Dependencies installieren
npm install

# Dev Server starten (logs zu dev.log)
npm run dev

# Database Migrations
npm run db:push      # Schema anwenden
npm run db:generate  # Prisma Client generieren

# Linting
npm run lint

# Build (Production)
npm run build
npm run start        # uses standalone output
```

---

## 🗄️ Deployment Info

- **Runtime:** Node.js / Next.js
- **Database:** SQLite (file:/home/server2/spikeball/db/custom.db)
- **Port:** 3000 (Reverse Proxy via Caddy)
- **Service:** spikeball.service
- **Deployment Config:** next.config.js (ignoreBuildErrors: true)

---

## 🚨 Offene Aufgaben / TODO

1. **Git & GitHub Backup**
   - Git ist möglicherweise nicht korrekt installiert/konfiguriert
   - Repository initialisiert (.git exists)
   - GitHub Remote noch nicht verbunden
   - Achtung: Kein aktives Offsite-Backup!

2. **Testing**
   - Das komplette System sollte getestet werden:
     - User A sendet Anfrage an User B
     - User B akzeptiert
     - Beide sehen sich in Freundesliste
     - Freund entfernen test

3. **Performance**
   - Datei-Backup erstellen (db/custom.db)

---

## 📋 Manuelles Git Setup (wenn installiert)

```bash
# 1. GitHub Repository erstellen
#    - Name: spikeball-elo
#    - Kein README.md initialisieren!

# 2. Remote hinzufügen
git remote add origin https://github.com/DEIN_USER/spikeball-elo.git

# 3. Master Branch zu main
git branch -M main

# 4. Push zu GitHub
git push -u origin main

# Falls Auth-Problem: GitHub Personal Access Token verwenden!
```

---

## 🔒 Datenbank-Backup (WICHTIG!)

Erstelle regelmäßig Backups von `db/custom.db`:

```bash
# Backups erstellen
cp db/custom.db db/custom_backup_$(date +%Y%m%d_%H%M%S).db

# Backup in Archiv verschieben
mkdir -p backups
mv db/custom_backup_*.db backups/
```

---

## 🎯 Nächste Schritte

1. **SICHERHEIT:** Database-Backup erstellen (s.o.)
2. **TESTING:** Freunde Feature mit 2 Usern testen
3. **GIT:** Git auf GitHub connected testen
4. **DEPLOYMENT:** System-Check vor dem nächsten Sprint

---

*Status ist nur Momentaufnahme - Änderungen waren möglich seit letztem Test.*
"