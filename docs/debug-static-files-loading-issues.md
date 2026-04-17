---
title: Debug Static Files Loading Issues After Extended Runtime
tags: [caddy, debugging, logs, monitoring, spikeball]
---
# PROBLEM
Profilbilder werden nach langer Laufzeit nicht mehr geladen müssen systematisch debuggt werden, um die Ursache (Connection Pooling vs. Timeout vs. File Descriptor Limit) zu identifizieren.

# LÖSUNG
1. Caddy-Access-Logs aktivieren und analysieren
2. Spikeball-Service Logs auf Fehler prüfen
3. System-Logs auf Resource Exhaustion prüfen
4. Reproduktion durch Zeitversatz-Test

# CODE / COMMANDS
## Caddy Access Logs aktivieren
Caddyfile mit globaler Log-Configuration erweitern:
```
{
    log {
        output file /var/log/caddy/access.log
        format json
    }
}

spikeball.ddns.net {
    # ... bestehende config ...
}
```

## Spikeball Service Logs prüfen
```bash
# Live-Logs auf Fehler überwachen
journalctl -u spikeball -f

# Logs der letzten Stunde suchen nach Bild-Routen
journalctl -u spikeball --since '1 hour ago' | grep -E 'GET.*(profile|image|upload|asset)'

# System-Ressourcen prüfen
systemctl status spikeball
```

## Caddy Neustart und Logs prüfen
```bash
systemctl reload caddy
tail -f /var/log/caddy/access.log
```

## System-Ressourcen Monitoring
```bash
# Offene Dateideskriptoren prüfen
lsof -p $(pgrep -f spikeball) | wc -l

# TCP-Verbindungen prüfen
ss -tn | grep :3000 | wc -l
```

## Reproduktionsschritte
1. Server starten und Zeitstempel notieren
2. Profilbild-Links direkt über Browser curlen (store für später)
3. Jeweils nach 6h, 12h, 18h, 24h curl erneut
4. Bei Erfolg/Failure Caddy- und Spikeball-Logs checken

Test-Script:
```bash
#!/bin/bash
IMAGE_URL="https://spikeball.ddns.net/uploads/profile/example.jpg"
SAVE_DIR="/tmp/monitoring"
mkdir -p $SAVE_DIR

# Alle 2 Stunden testen
while true; do
    TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
    STATUS=$(curl -o /dev/null -s -w '%{http_code}' $IMAGE_URL)
    echo "$TIMESTAMP: HTTP $STATUS" >> $SAVE_DIR/image_monitor.log
    sleep 7200
done
```

# SHELL OUTPUT / ERROR
Wichtig: HTTP-Statuscodes aus Caddy-Logs (200, 404, 502, 504)
Error-Muster in Spikeball-Logs (ECONNRESET, timeout, file descriptor exhaustion)

# WEITERE RESOURCEN
- Caddy Log Pfad: /var/log/caddy/access.log (nach Aktivierung)
- Spikeball Logs: journalctl -u spikeball
- Monitoring Script: /tmp/monitoring/image_monitor.sh
---