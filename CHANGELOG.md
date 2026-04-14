"# Changelog

Alle wichtigen Änderungen im Spikeball-Projekt werden in diesem Dokument dokumentiert.

## [Unreleased]

### Added
- **SEO-Implementierung für spikeball.ddns.net**:
  - Metadata API mit Spikeball-spezifischen Keywords (Spikeball Deutschland, ELO Ranking, Turnier-Statistik)
  - Sitemap automatisch generiert für Google-Crawler
  - Robots.txt mit Crawling-Regeln
  - OpenGraph & Twitter Tags für Social-Media-Sharing
- **Google Search Console Einrichtung** (manuell erforderlich für DDNS-Domains)

### Fixed
- **Friendship Status Display**: Freundschaftsstatus wird jetzt korrekt im Profil angezeigt
  - Badges zeigen den aktuellen Status: "Befreundet", "Eingehend", "Angefragt"
  - Buttons aktualisieren sich dynamisch basierend auf Beziehungsstatus
  - Debug-Logs in API und Frontend bei `/api/players/[id]` und `PlayerProfile.tsx`
  
- **Accept Friend Request**: Annehmen von Freundschaftsanfragen funktioniert jetzt
  - Fehlender POST-Handler in `/api/friends/requests` implementiert
  - Handler validiert User-Berechtigung und Anfrage-Status
  - Unterstützt sowohl "accept" als auch "reject" Aktionen

### Technical
- API-Logging verbessert: Freundschaftsprüfung protokolliert detailliert IDs und Status
- Frontend-Rendering debugbar: Zustandsvariablen werden in Console ausgegeben
- Build-System: Nutzung von npm statt bun (bun nicht auf Server installiert)

---

## [v1.0.2] - 2025-01-17

### Fixed
- **Prisma Foreign Key Constraint**: Player-Löschvorgang korrigiert
  - Problem: `FOREIGN KEY constraint failed (Code 1811)` beim Löschen
  - Lösung: Korrekte Löschreihenfolge etabliert:
    1. EloChange
    2. Friendship
    3. FeatureRequest
    4. User (Parent)
    5. Player (Child)

---

## [v1.0.1] - 2025-01-16

### Fixed
- **Race Condition in Friendship Display**: Buttons im Profil wurden beim ersten Laden nicht angezeigt
  - Problem: `currentUserId` wurde asynchron nachgeladen während UI wartete
  - Lösung: `isOwnProfile` wird serverseitig in API berechnet
  - `currentUserId` lädt asynchron im Hintergrund, blockiert aber nicht mehr UI

---

## [v1.0.0] - 2025-01-15

### Initial Features
- Usersystem mit Authentication
- Player-Profile mit Profilbild-Upload
- ELO Rating System
- Spiel-Historie und Statistiken
- Leaderboard
- Friends-System mit Anfragen
- Admin-Tools

---

**Hinweis**: Die Versionierung folgt semantischer Versionierung (SemVer).
- **MAJOR**: Inkompatible API-Änderungen
- **MINOR**: Neue Features, rückwärtskompatibel
- **PATCH**: Bugfixes, rückwärtskompatibel
"