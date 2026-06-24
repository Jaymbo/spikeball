# Spikeball ELO — Project Runbook

Generated with [Continue](https://continue.dev)

Co-Authored-By: Continue <noreply@continue.dev>

---

## 1. Titel und Kurzbeschreibung

**Titel:** Spikeball ELO Rating System  
**Beschreibung:** Web-App zur Erfassung, Verwaltung und statistischen Auswertung von 2v2 Spikeball-Matches. Spieler erhalten ELO-Ratings, ELO-Historien, können Freundschaften verwalten, Avatare hochladen und Admins Spieler/Spiele administrieren. Zielgruppe: private Spikeball-Community.

---

## 2. Tech Stack & Architektur-Übersicht

| Ebene | Technologie |
|-------|-------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Runtime | Node.js 22 |
| Package Manager | npm (`package-lock.json` ist Single Source of Truth; `bun.lock`, `yarn.lock`, `pnpm-lock.yaml` sind ignored) |
| Database | SQLite über Prisma ORM |
| Auth | JWT-Cookie-basiert mit `jose`, `bcryptjs` |
| State/Data Fetching | TanStack Query (React Query) v5 |
| UI | Tailwind CSS 3.4, shadcn/ui, Radix UI Primitives |
| Charts | Recharts |
| Toast Notifications | sonner |
| Build Output | `output: "standalone"` |
| Server | Caddy Reverse Proxy + systemd-Service |

### Architekturprinzipien

- **Server Components** für datengetriebene Pages (z. B. `app/page.tsx` ist Client Component wegen Interaktivität).
- **Route Handlers** unter `src/app/api/**` für REST-APIs.
- **Prisma Client Singleton** über `src/lib/db.ts`.
- **TanStack Query** für alles Client-Side-Data-Fetching.
- **Tailwind + shadcn/ui** für konsistentes Design.

---

## 3. Standard-Workflow für neue Aufgaben

1. **Aufgabe in eigenen Worten formulieren.**
2. **Definition of Done festlegen.** Was genau muss am Ende erreicht sein?
3. **Kontext lesen.** Relevante Dateien, API-Routen, Datenbankschema, Hooks.
4. **Iterativ arbeiten.** Schritte ≤ 30 Minuten; nach jedem Schritt validieren/testen.
5. **Nur notwendige Änderungen vornehmen.** Keine ungefragten Refactorings.
6. **Tests/Lint/Build ausführen.** Siehe Checkliste in Abschnitt 17.
7. **Commit sauber aufbereiten.** Logisch gruppiert.
8. **Dokumentation aktualisieren.** README/Runbook/CHANGELOG, falls relevant.

### Definition of Done (empfohlen)

- [ ] Feature/Bugfix implementiert
- [ ] TypeScript läuft fehlerfrei (`tsc --noEmit`)
- [ ] ESLint läuft ohne Errors (Warnings dokumentiert oder behoben)
- [ ] Build erfolgreich (`npm run build`)
- [ ] Funktional manuell getestet (Happy Path)
- [ ] Keine neuen Warnungen eingeführt
- [ ] Keine Secrets im Code
- [ ] README/Runbook/CHANGELOG aktualisiert, falls notwendig

---

## 4. Verzeichnisstruktur & wichtige Dateien

```
/home/jason/Dokumente/spikeball/
├── .env.example                 # Env-Vorlage
├── .zscripts/                   # Server-Betriebsskripte (build.sh, dev.sh, start.sh, ...)
├── backups/                     # Manuelle Backups (ignored)
├── db/                          # SQLite-Datenbank (ignored, außer dev.db)
├── docs/                        # Aktive Dokumentation
│   └── old-files/               # Gelöschte/veraltete Markdowns (im Git-Index staged zum Löschen)
├── prisma/
│   ├── schema.prisma            # Prisma-Schema
│   └── seed.mjs                 # Seed-Skript (nur root-User)
├── public/                      # Statische Assets (Logos, Avatare, …)
├── src/
│   ├── app/api/                 # API-Route Handlers
│   ├── app/                     # App Router Pages
│   ├── components/              # React-Komponenten
│   │   ├── ui/                  # shadcn/ui Komponenten
│   │   ├── auth/                # Login/Register/Passwort-Dialoge
│   │   ├── friends/             # Freundschaftssystem
│   │   ├── profile/             # Profil, AvatarUpload, ELO-Charts
│   │   └── spikeball/           # Spieler, Spiele, Leaderboard, AdminTools
│   ├── hooks/                   # Custom React Hooks
│   │   ├── use-auth.ts          # Auth-Query-Hook
│   │   ├── use-friends.ts       # Freundschafts-Hooks
│   │   ├── use-players.ts       # Spieler-Hooks
│   │   └── use-*                # weitere
│   ├── lib/                     # Utilities
│   │   ├── auth.ts              # JWT-Helper
│   │   ├── db.ts                # Prisma Client Singleton
│   │   ├── elo.ts               # ELO-Berechnung, Matchup-Generierung
│   │   └── utils.ts             # cn()-Helper
│   └── types/                   # Globale TypeScript-Typen
├── .gitignore
├── next.config.js
├── eslint.config.mjs
├── postcss.config.js
├── tailwind.config.js
├── components.json              # shadcn/ui Config
├── package.json
└── package-lock.json
```

### Besonders wichtige Dateien

| Datei | Zweck |
|-------|-------|
| `src/lib/db.ts` | Prisma Client Singleton |
| `src/lib/auth.ts` | JWT verify/sign, getCurrentUser |
| `src/hooks/use-auth.ts` | Auth-Query + invalidateAuth + logout |
| `src/hooks/use-players.ts` | Spieler-Query + invalidatePlayers |
| `src/hooks/use-friends.ts` | Freundschafts-Queries + Mutationen |
| `src/lib/elo.ts` | ELO-Berechnung, RoundRobin/Matchup |
| `src/components/profile/PlayerProfile.tsx` | Profil + Freundschafts-Aktionen |
| `src/components/spikeball/RecordGame.tsx` | Spiel eintragen |
| `src/components/profile/AvatarUpload.tsx` | Bild-Crop + Upload |

---

## 5. Authentifizierung & Autorisierung

### Flow

1. User loggt/registriert sich über `/api/auth/login` oder `/api/auth/register`.
2. Server prüft `bcryptjs.compare()`.
3. Bei Erfolg wird ein **HttpOnly, Secure, SameSite=strict Cookie** mit JWT via `jose` gesetzt.
4. Middleware/Gateways prüfen den Cookie via `verifyToken()` aus `src/lib/auth.ts`.
5. `useAuth()` fragt `/api/auth/check` ab.

### Wichtige Dateien

- `src/lib/auth.ts` — `signToken`, `verifyToken`, `getCurrentUser`
- `src/hooks/use-auth.ts` — `useQuery({ queryKey: ['auth'] })`
- `src/app/api/auth/**` — Login/Register/Logout/Check/Change-Password
- `src/components/auth/AuthModal.tsx`
- `src/components/auth/ChangePasswordDialog.tsx`
- `src/components/auth/LoginForm.tsx`

### Musterverletzung vermeiden

- Auth-Invalidierung zentral über `invalidateAuth()` aus `useAuth()`.
- **Nicht** redundant in Dialogen und Parent-Component invalidieren.
- Logout entfernt Auth-Queries: `queryClient.removeQueries({ queryKey: ['auth'] })`.

---

## 6. Dateiupload & Bildverarbeitung

### Upload-Flow

1. Client: `AvatarUpload.tsx` mit `react-image-crop` → Blob → `FormData`
2. POST `/api/upload/profile-picture`
3. Server validiert:
   - Dateigröße (z. B. ≤ 5 MB)
   - MIME-Type (jpeg, png, webp)
   - Datei ist tatsächlich Bild (Magic Bytes)
   - User-Berechtigung (nur eigenes Profil/Admin)
4. Speicherung unter `public/uploads/profile-pictures/<uuid>.jpg`
5. Optional: `sharp` für Resize/WebP
6. Pfad wird in `User.profilePicture` (Prisma) gespeichert
7. `invalidatePlayers()` wird aufgerufen

### Validierungsregeln

- Allowed MIME: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- Max Size: 5 MB (empfohlen)
- Magic-Bytes-Check serverseitig
- Keine `.exe`, `.svg` mit Scripts, keine Traversal-Pfade

### Musterverletzung vermeiden

- Dateinamen niemals direkt verwenden. UUID + Extension aus validem MIME.
- Upload-Verzeichnis nicht executable.
- Bilder nicht serverseitig im Request-Handler mit `fs` synchron schreiben.

---

## 7. Freundschaftssystem

### Domain

- `Friendship` (Prisma) mit `requesterId`, `receiverId`, `status` (`PENDING`, `ACCEPTED`, `REJECTED`, `BLOCKED`).
- Statusänderungen via `/api/friendships/**`.

### Aktionen

| Aktion | Route | Effekt |
|--------|-------|--------|
| Anfrage senden | `POST /api/friendships/request` | Erstellt Friendship PENDING |
| Akzeptieren | `POST /api/friendships/[id]/accept` | Status ACCEPTED |
| Ablehnen | `POST /api/friendships/[id]/reject` | Status REJECTED |
| Zurückziehen | `DELETE /api/friendships/[id]` | Löscht Anfrage |
| Entfernen | `DELETE /api/friendships/[id]` | Löscht Friendship |

### Frontend

- `src/components/friends/AddFriendDialog.tsx`
- `src/components/friends/FriendList.tsx`
- `src/components/friends/FriendRequests.tsx`
- `src/components/friends/SentRequests.tsx`
- `src/components/friends/FriendsTab.tsx`

### Invalidierung

- `useInvalidateFriends()` aus `@/hooks/use-friends`
- Nach jeder Aktion `invalidateFriends()` aufrufen.
- `usePendingFriendRequests()` zeigt Badges an.

---

## 8. Spieler & Spiele

### ELO-System

- Implementiert in `src/lib/elo.ts`
- Team-basiertes 2v2 ELO
- `calculateEloChange(team1Avg, team2Avg, scoreDiff, actualResult)`
- ELO-Historie in `EloChange` (Prisma) gespeichert
- ELO-Decay: 5% pro inaktivem Monat (laut Footer)

### Features

| Feature | Komponente/Route |
|---------|------------------|
| Spiel eintragen | `RecordGame.tsx` → `POST /api/games` |
| Matchup-Generierung | `GenerateGames.tsx` → RoundRobin aus `elo.ts` |
| Leaderboard | `Leaderboard.tsx` |
| ELO-Historie | `EloHistoryChart.tsx` |
| ELO-Vergleich | `src/app/compare/page.tsx` → `EloComparisonChart.tsx` |
| Spieler-Verwaltung (Admin) | `AdminPlayers.tsx`, `PlayersTabUpdated.tsx` |

### Admin-Spieler-Operationen

- Spieler löschen
- Spieler umbenennen
- Passwort zurücksetzen

---

## 9. API-Routen & Konventionen

### Konventionen

- RESTful Route Handlers unter `src/app/api/**/route.ts`
- HTTP-Methoden: `GET`, `POST`, `PATCH`, `DELETE`
- JSON-Request/Response
- Fehlerformat: `{ error: "string" }`
- Berechtigungen immer serverseitig prüfen

### Fehlerbehandlung

```ts
export async function GET(req: NextRequest) {
  try {
    // ...
  } catch (error) {
    console.error('[API /example] error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
```

### Validierung

- Bei Body-Daten immer `zod` verwenden
- Query-Params casten und validieren
- Berechtigungen prüfen (Admin/Owner)

### Prisma-Queries

- Keine Raw-Queries ohne Notwendigkeit
- `Prisma.`-Typen verwenden (z. B. `Prisma.GameWhereInput`) statt `any`
- `include` nicht over-fetching; nur was wirklich benötigt wird

---

## 10. Frontend-Konventionen

### Client vs. Server Components

| Server Component | Client Component |
|------------------|------------------|
| Statische Pages | Interaktive Pages (`"use client"`) |
| Data Fetching initial | useQuery, useState, useEffect |
| Kein `'use client'` | Event Handler, Forms, Dialoge |

### Custom Hooks

- `useAuth()` — Auth-User + invalidateAuth + logout
- `usePlayers()` — Spielerliste
- `useInvalidatePlayers()` — Spieler-Cache invalidieren
- `useFriends()` — Freundschaften
- `usePendingFriendRequests()` — Pending-Count für Badges

### Invalidierungsmuster

```ts
const { invalidateAuth } = useAuth();
const invalidatePlayers = useInvalidatePlayers();
const invalidateFriends = useInvalidateFriends();

// Auth-Status ändern
invalidateAuth();

// Nach Spiel-Eintrag
invalidatePlayers();

// Nach Freundschafts-Aktion
invalidateFriends();
```

### Anti-Pattern vermeiden

- Nicht `window.location.href` für interne Navigation verwenden (außer absolut nötig).
- Nicht `queryClient.clear()` ohne Grund (löscht ALLE Queries).
- Nicht `queryClient.invalidateQueries({ queryKey: ['auth'] })` in Child-Components UND Parent gleichzeitig.

---

## 11. State Management & Data Fetching

### TanStack Query v5

- `queryKey` als Array, konsistent halten.
- `useAuth()` verwendet `queryKey: ['auth']`.
- `refetchInterval` für Auth alle 5 Minuten.
- Mutations invalidieren per `onSuccess` oder Callback.

### Empfohlene Query Keys

| Feature | Query Key |
|---------|-----------|
| Auth | `['auth']` |
| Players | `['players']` |
| Friends | `['friends']` |
| Friend Requests | `['friend-requests']` |
| Pending Count | `['friend-requests', 'pending']` |
| User Compare | `['users', 'compare', id1, id2]` |

### Globales State

- Kein Redux/Zustand nötig.
- TanStack Query ist primärer State.
- UI-State lokal in Components.

---

## 12. UI-Komponenten

### shadcn/ui & Radix

- Alle UI-Komponenten unter `src/components/ui/`
- Radix-Primitives direkt importieren, falls shadcn-Wrapper nicht reicht.

### Häufig genutzt

- `Button`, `Card`, `Dialog`, `Tabs`, `Input`, `Label`, `Badge`, `Avatar`
- `Table`, `Select`, `Popover`, `Command`
- `ChartContainer`, `ChartTooltip` (aus shadcn/ui charts)
- `toast` aus `sonner`

### Recharts

- `EloHistoryChart.tsx`
- `EloComparisonChart.tsx`
- Achsen, Tooltips, Legenden, responsive Container.

### Tailwind

- Utility-First.
- Darkmode via `next-themes`.
- Konsistente Farben via CSS-Variablen (`bg-background`, `text-foreground`, `text-muted-foreground`).

---

## 13. Deployment & Server-Betrieb

### Build

```bash
npm ci
npm run db:generate
npm run build
```

Output: `.next/standalone/`

### Start

```bash
DATABASE_URL=file:/home/server2/spikeball/db/custom.db NODE_ENV=production node .next/standalone/server.js
```

### systemd-Service

- Service-Datei: `spikeball.service` (im Repo)
- Verweist auf `.next/standalone/server.js`

### Caddy

- `Caddyfile` liegt im Repo.
- Reverse Proxy auf localhost:3000.
- HTTPS via Let's Encrypt.

### Betriebsskripte

| Skript | Zweck |
|--------|-------|
| `.zscripts/build.sh` | Production-Build |
| `.zscripts/dev.sh` | Dev-Server starten |
| `.zscripts/start.sh` | Production-Server starten |
| `.zscripts/mini-services-*.sh` | Modularer Start |

### Env-Variablen

- `DATABASE_URL=file:/.../custom.db`
- `NODE_ENV=production`
- `NEXTAUTH_SECRET` / `JWT_SECRET` (nur in `.env`, nie committed)
- `NEXT_PUBLIC_*` nur für öffentliche, nicht sensitive Werte

### Datenbankpflege

```bash
npm run db:generate   # Prisma Client generieren
npm run db:push       # Schema auf DB anwenden (Dev)
npm run db:migrate    # Migrationen anwenden
npm run db:reset      # ⚠️ Reset in Dev
npm run db:seed       # root-User seeden
```

---

## 14. Sicherheit & Best Practices

### Coding

- Keine Secrets, Passwörter, Tokens im Code.
- Keine `console.log` mit sensitiven Daten.
- `no-console` ESLint-Rule: nur `warn` und `error` erlaubt.
- Input validieren, Output escapen.
- Berechtigungen serverseitig prüfen.

### TypeScript

- Kein `any` ohne Begründung.
- `@typescript-eslint/no-explicit-any: warn`
- `any` nur dort, wo externe Libraries keine Typen liefern und ein Type-Wrapper überproportional aufwändig wäre.

### Auth

- HttpOnly, Secure, SameSite=strict JWT-Cookie.
- Passwörter nur gehasht (`bcryptjs`).
- Token-Verifizierung serverseitig.

### Upload

- MIME + Magic-Bytes + Größe + Berechtigung prüfen.
- UUID-Dateinamen.
- Keine Upload-Ausführung.

### API

- Rate-Limiting prüfen, falls nötig (noch nicht implementiert).
- SQL-Injection durch Prisma ORM vermieden.
- XSS durch React JSX Escaping vermieden.

---

## 15. Bekannte technische Schulden & Warnungen

### Lint-Warnungen (aktueller Stand)

- 161 Warnings, 0 Errors.
- Hauptursachen:
  - unused imports/vars (Icons, UI-Komponenten, Hooks)
  - `any` in Chart-Komponenten, `elo.ts`, `RecordGame.tsx`, `AdminTools.tsx`
  - fehlende `useEffect`-Dependencies
- Nicht kritisch, aber Aufmerksamkeit wert.

### Dateien, die besondere Aufmerksamkeit brauchen

| Datei | Problem | Empfohlene Aktion |
|-------|---------|-------------------|
| `src/app/compare/page.tsx` | Unused imports | Bereinigen |
| `src/components/spikeball/GenerateGames.tsx` | Viele unused imports/vars, unused State | Refactoren oder bereinigen |
| `src/components/spikeball/PlayersTabUpdated.tsx` | Viele unused imports/vars, scheinbar unfertig | Prüfen: wird genutzt? Entfernen oder vervollständigen |
| `src/components/spikeball/Leaderboard.tsx` | unused Icons | Bereinigen |
| `src/hooks/use-players.ts` | unused `useMutation` import | Entfernen |
| `src/hooks/use-toast.ts` | `actionTypes` unused-as-value | Refactoren |
| `src/lib/elo.ts` | 4x `any` in Tuple-Spread | Typsicheres `[number, number, number, number]` |
| `src/lib/game-utils.ts` | unused `Prisma`, `INITIAL_RATING` | Bereinigen |
| `src/components/profile/EloHistoryChart.tsx` | unused `Tooltip`, `name`, `any` | Bereinigen |
| `src/components/profile/PlayerProfile.tsx` | unused `ArrowRight`, `getCurrentUser`, `any`, unused props `isOwnProfile`, `onClose` | Bereinigen |
| `src/components/profile/ProfileSettingsDialog.tsx` | unused prop `currentProfilePicture` | Bereinigen |
| `src/components/spikeball/FeatureRequestsAdmin.tsx` | `exhaustive-deps`, `any` | Fixen |

### Hardcoded Werte

- `AvatarUpload.tsx`: `getCroppedImg` erzeugt Blob mit fester Dimension. Skaliert auf Basis des Crop-Selektions. Ggf. max. Ausgabe-Größe definieren.
- `AuthModal.tsx`, `LoginForm.tsx`: Credentials hardcoded? Nein, kommen aus State.

### Potentiell veraltet

- `docs/old-files/` enthält viele archivierte Markdowns. Prüfen, ob noch relevant; ansonsten entfernen.
- `CURRENT_STATE.md` wurde gelöscht. War Work-in-Progress-Dokumentation.

### Build-History

- Vorher: `next.config.js` hatte `typescript.ignoreBuildErrors: true`. Das wurde entfernt.
- Build-Fehler `<Html> should not be imported outside of pages/_document` trat auf. Ursache: vermutlich `/500` / `/_error` oder `next/document` Import. Noch nicht final gelöst.

---

## 16. Übersicht kürzlich gelöschter/alter Docs

### Gelöscht (staged)

- `CURRENT_STATE.md` — Arbeits-Status-Dokument
- `docs/old-files/` — viele Markdowns aus vorherigen Feature-Branches/Fixes
- `prisma/seed.js`, `prisma/seed.ts` — durch `prisma/seed.mjs` ersetzt
- `src/app/page-auth.tsx` — ungenutzte Auth-Page
- `.zscripts/dev.out.log`, `.zscripts/dev.pid` — Runtime-Logs
- `db/custom.db` — SQLite-DB (wird jetzt via `.gitignore` excluded)
- `bun.lock` — Lockfile, da npm verwendet wird

### Empfohlener Umgang

- Alte Docs archivieren oder löschen, falls kein Wert mehr.
- Wichtige Erkenntnisse ins Runbook migrieren.
- Einmaliges Backup der alten Docs (lokal) vor endgültigem Löschen.

---

## 17. Checkliste für sauberen Abschluss jeder Aufgabe

- [ ] Feature/Bugfix implementiert
- [ ] `tsc --noEmit` fehlerfrei
- [ ] `npm run lint` keine Errors
- [ ] `npm run build` erfolgreich
- [ ] Manuell getestet (Happy Path)
- [ ] Keine neuen Warnings ohne Notwendigkeit
- [ ] Keine `any` ohne Begründung
- [ ] Keine unused imports/vars in neuen/geänderten Dateien
- [ ] Keine Secrets im Code
- [ ] API validiert Inputs + Berechtigungen
- [ ] README/Runbook/CHANGELOG aktualisiert, falls relevant
- [ ] Git-Status sauber: logisch gruppierte Commits

---

## 18. Schnellreferenz für häufige Fehler

### `Error: <Html> should not be imported outside of pages/_document`

- Ursache: Import von `next/document` oder `Html` in `app/` Pages.
- Lösung: Entfernen. In App Router kein Custom `_document`.

### `queryClient.invalidateQueries({ queryKey: ['auth'] })` funktioniert nicht

- Prüfen, ob Query Key exakt matcht: `useAuth()` verwendet `['auth']`.
- Keine doppelten Invalidierungen in Dialog + Parent.

### Build failed wegen TypeScript-Fehler

- Vorher wurde `ignoreBuildErrors: true` entfernt.
- TypeScript-Fehler müssen jetzt behoben werden (korrekter Standard).

### ESLint: `'X' is defined but never used`

- Ungenutzte Imports/Vars entfernen.
- Oder mit `_` prefixen, falls Interface/API erfordert es.

### API route uses `any`

- Durch konkreten Prisma-Typ ersetzen, z. B. `Prisma.GameWhereInput`.

### Next/Image `<img>` warning

- `next/image` verwenden, wo möglich.
- Bei dynamischen Blob-URLs: `<img>` ist okay, aber Warnung bleibt.

### Standalone-Output kopiert public/ static nicht

- `build`-Script: `cp -r public .next/standalone/` und `cp -r .next/static .next/standalone/.next/`.

---

## 19. Kontakt / Verantwortlichkeit

- **Projekt:** Spikeball ELO Rating System
- **Repository:** `/home/jason/Dokumente/spikeball`
- **Deployment:** Caddy + systemd auf `spikeball.ddns.net`
- **Maintainer:** Projekt-Owner (via Continue-Assistent koordiniert)

---

## 20. Änderungshistorie

| Version | Datum | Änderungen | Autor |
|---------|-------|------------|-------|
| 1.0.0 | 2026-06-24 | Initiales Runbook erstellt: Tech Stack, Workflow, Auth, Upload, Freundschaften, Spiele, API, Frontend, Deployment, Sicherheit, Schulden, FAQ | Continue |

---

*Letzte Aktualisierung: 2026-06-24*
