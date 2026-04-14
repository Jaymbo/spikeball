---
title: Feature Request Chat Widget
tags: [feature, ui, api, database]
---

# PROBLEM
Nutzer sollten eine einfache Möglichkeit haben, Bugs zu melden oder neue Features zu beantragen. Das System sollte einseitig funktionieren (wie ein Chat, aber ohne Antwort-Funktion) und gut auf mobilen Geräten funktionieren.

# LÖSUNG
1. Datenbank-Schema um `FeatureRequest` Model erweitern
2. API-Endpoints für CRUD-Operationen erstellen
3. Floating Chat-Widget in unterer rechter Ecke implementieren
4. Admin-Interface zur Verwaltung der Requests erstellen

# CODE / COMMANDS

## Prisma Schema
```prisma
model FeatureRequest {
  id          String   @id @default(cuid())
  userId      String?
  type        String   // "bug" or "feature"
  title       String
  description String
  status      String   @default("open") // "open", "in_progress", "done", "rejected"
  priority    String   @default("low") // "low", "medium", "high"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User? @relation(fields: [userId], references: [id])
}
```

## API Endpoints
```bash
# POST - Neuen Request erstellen
POST /api/feature-requests
Body: { type: "bug"|"feature", title: string, description: string }

# GET - Alle Requests abrufen (Admin only)
GET /api/feature-requests?status=open&type=bug

# PATCH - Request aktualisieren (Admin only)
PATCH /api/feature-requests/[id]
Body: { status?: string, priority?: string }

# DELETE - Request löschen (Admin only)
DELETE /api/feature-requests/[id]
```

## Database Migration
```bash
cd spikeball
npm run db:push
npm run db:generate
```

# SHELL OUTPUT / ERROR
Keine kritischen Fehler bei der Implementierung.

# WEITERE RESOURCES
- File: `spikeball/prisma/schema.prisma` - Datenbank-Schema
- File: `spikeball/src/app/api/feature-requests/route.ts` - API Endpoint
- File: `spikeball/src/components/FeatureRequestChatWidget.tsx` - UI Komponente
- File: `spikeball/src/app/admin/feature-requests/page.tsx` - Admin Interface
- File: `spikeball/src/lib/feature-request-types.ts` - TypeScript Typen
