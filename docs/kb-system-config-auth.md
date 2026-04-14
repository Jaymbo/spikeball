---
title: System, Database & Auth Configuration
tags: [deployment, systemd, prisma, jwt, config]
---
# PROBLEM

Einrichtung der Infrastruktur für Production mit Next.js Standalone Build, Systemd Service, Prisma Singleton Pattern und JWT Authentifizierung.

# LÖSUNG

1. **Deployment (Standalone):** `next.config.js` -> `output: 'standalone'`. Systemd Service zum Starten.
2. **Database (Prisma):** Singleton Pattern für `PrismaClient` (Dev-Mode Query Spam verhindern).
3. **Auth:** JWT mit `jose` Library. `getCurrentUser` prüft Header `Authorization: Bearer <token>`.

# CODE / COMMANDS

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  ignoreBuildErrors: true, // For production safety
};
module.exports = nextConfig;
```

```typescript
// src/lib/db.ts - Singleton Pattern
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

```ini
# /etc/systemd/system/spikeball.service
[Unit]
Description=Spikeball ELO System
After=network.target

[Service]
Type=simple
User=server2
WorkingDirectory=/home/server2/spikeball
ExecStart=/usr/bin/node /home/server2/spikeball/.next/standalone/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Service Management
sudo systemctl enable spikeball
sudo systemctl restart spikeball
sudo journalctl -u spikeball -f  # Check logs
```

# SHELL OUTPUT / ERROR

**Error:** Too many Prisma Clients created / Connection limit exceeded.
**Fix:** Use Singleton Pattern (see Code above).

# WEITERE RESOURCES

- Config: `next.config.js`
- Database Logic: `src/lib/db.ts`
- Auth: `src/lib/auth.ts`
- Backups: `backup.sh` script (SQLite copy every 6h)