# Spikeball ELO System

Next.js-basiertes ELO-Rating- und Spielverwaltungssystem für Spikeball 2v2-Matches.

## Tech-Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 18, Tailwind CSS 3.4, shadcn/ui
- **State:** Zustand, TanStack Query
- **Database:** SQLite mit Prisma ORM
- **Auth:** JWT (jose) + bcryptjs
- **Deployment:** Next.js standalone output

## Erst-Setup (Experimentiersystem)

1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

2. Environment-Datei aus Vorlage erstellen:
   ```bash
   cp env.example .env
   ```

   > **Wichtig:** Prisma löst SQLite-Pfade relativ zu `prisma/schema.prisma` auf. Verwende am besten einen **absoluten Pfad** in `DATABASE_URL`, z. B.:
   > ```env
   > DATABASE_URL="file:/home/jason/Dokumente/spikeball/db/custom.db"
   > ```

3. JWT Secret anpassen (mindestens 32 Zeichen):
   ```bash
   openssl rand -base64 32
   ```
   Den Wert in `.env` bei `JWT_SECRET` eintragen.

4. Prisma Client generieren und DB-Schema synchronisieren:
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```

   Die App ist dann unter http://localhost:3000 erreichbar.

## Wichtige Scripts

| Script | Beschreibung |
|--------|--------------|
| `npm run dev` | Dev-Server auf Port 3000 |
| `npm run build` | Production-Build (standalone) |
| `npm run start` | Production-Server starten |
| `npm run lint` | ESLint ausführen |
| `npm run db:push` | Schema auf Datenbank anwenden |
| `npm run db:generate` | Prisma Client generieren |
| `npm run db:migrate` | Neue Migration erstellen |
| `npm run db:reset` | Datenbank zurücksetzen (⚠️ Datenverlust) |

## Datenbank-Backup

Vor größeren Änderungen immer ein Backup der SQLite-Datei erstellen:

```bash
cp db/custom.db db/custom_backup_$(date +%Y%m%d_%H%M%S).db
```

## Deployment (Production)

Siehe [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Hinweise

- `db/custom.db` enthält die Produktivdaten und ist im Repository getrackt.
- `.env` ist gitignored und muss auf jedem System neu erstellt werden.
- Änderungen am ELO-System können über den Admin-Tab mit "Spiele neu berechnen" validiert werden.
