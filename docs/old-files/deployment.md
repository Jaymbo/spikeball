---
title: Deployment Guide
tags: [deployment, production, systemd]
---

# PROBLEM

Spikeball ELO System für Production deployment konfigurieren mit:
- Standalone Next.js build
- Systemd service management
- Reverse Proxy via Caddy
- Database backup strategy

# LÖSUNG

## Build Configuration

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  ignoreBuildErrors: true,
};

module.exports = nextConfig;
```

## Systemd Service

### spikeball.service
```ini
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

### Service Management
```bash
# Enable service
sudo systemctl enable spikeball

# Start service
sudo systemctl start spikeball

# Check status
sudo systemctl status spikeball

# View logs
sudo journalctl -u spikeball -f
```

## Caddy Reverse Proxy

### Caddyfile
```
spikeball.example.com {
    reverse_proxy localhost:3000
}
```

## Database Backup

### Backup Script
```bash
#!/bin/bash
# Backup script for spikeball database

BACKUP_DIR="/home/server2/spikeball/backups"
DB_FILE="/home/server2/spikeball/db/custom.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
cp "$DB_FILE" "$BACKUP_DIR/custom_backup_$DATE.db"

# Keep only last 30 backups
ls -t "$BACKUP_DIR"/custom_backup_*.db | tail -n +31 | xargs rm -f

echo "Backup completed: custom_backup_$DATE.db"
```

### Cron Job
```bash
# Add to crontab (crontab -e)
0 */6 * * * /home/server2/spikeball/backup.sh
```

## Environment Variables

### .env
```env
DATABASE_URL="file:./db/custom.db"
JWT_SECRET="your-secret-key-change-in-production"
NODE_ENV="production"
```

# CODE / COMMANDS

```bash
# Build for production
npm run build

# Start production server
npm run start

# Restart service
sudo systemctl restart spikeball

# Check logs
sudo journalctl -u spikeball -n 100
```

# SHELL OUTPUT / ERROR

Keine kritischen Fehler bei Deployment.

# WEITERE RESOURCES

- File: `next.config.js`
- File: `spikeball.service`
- File: `Caddyfile`
- File: `DEPLOYMENT.md`