---
title: Spikeball ELO System - Projektübersicht
tags: [spikeball, elo, nextjs, project]
---

# PROBLEM

Erstellung eines ELO-basierten Rating Systems für 2v2 Spikeball Matches mit Next.js 14 App Router, das folgende Anforderungen erfüllt:
- Per-Player Ratings für 2v2 Matches
- Dynamische Matchup-Generierung basierend auf ELO
- Erfassung von Spielverläufen und History
- Inaktivitäts-Decay für Ratings
- User-Authentifizierung und -Management

# LÖSUNG

1. **Next.js 14 App Router Setup** mit TypeScript und Tailwind CSS
2. **ELO Rating System** implementiert in `src/lib/elo.ts` mit logarithmischer Rating Update System
3. **Database Layer:** Prisma ORM mit SQLite für Persistenz, Transaktionen für Datenkonsistenz
4. **Auth System:** Custom JWT mit PBKDF2 Password Hashing (Next-App-Router-nativ)
5. **UI Layer:** shadcn/ui Komponenten mit responsive Design
6. **Deployement:** Standalone Next.js build mit systemd service

# CODE / COMMANDS

```bash
# Dev Server starten
npm run dev

# Database Schema updates
npm run db:push
npm run db:generate

# Build für Production
npm run build
sudo systemctl restart spikeball
```

# SHELL OUTPUT / ERROR

Keine kritischen Fehler im Core-System.

# WEITERE RESOURCES

- File: `src/app/page.tsx` - Main Entry Point
- File: `prisma/schema.prisma` - Database Schema
- File: `src/lib/elo.ts` - ELO Calculation Logic