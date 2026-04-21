---
title: Optimized Caddyfile for Spikeball Service
tags: [caddy, spikeball, configuration, reverse-proxy, static-files]
---
# PROBLEM
Die aktuelle Caddy-Configuration leitet ALLE Traffic durch den Reverse Proxy zu localhost:3000. Nach ~24h werden statische Dateien nicht mehr angezeigt (stale connections).

# LÖSUNG
1. Statische Dateien direkt servieren (bypass Reverse Proxy)
2. Port-Forwarding (XTransformPort) beibehalten
3. Node.js Reverse Proxy mit optimierten Timeouts konfigurieren
4. Logging aktivieren für Debugging

# CODE / COMMANDS
## Optimierter Caddyfile
```
{
    # Globales Logging aktivieren
    log {
        output file /var/log/caddy/access.log
        format json
    }
}

spikeball.ddns.net {
    # Port-Forwarding (XTransformPort) bleibt bestehen
    @transform_port_query {
        query XTransformPort=*
    }
    handle @transform_port_query {
        reverse_proxy localhost:{query.XTransformPort}
    }
    
    # Statische Assets direkt servieren (Performance & Stabilität)
    # Pfade anpassen an deine Projektstruktur!
    handle /assets/* {
        file_server {
            root /home/server2/spikeball/public/assets
        }
    }
    handle /uploads/* {
        file_server {
            root /home/server2/spikeball/uploads
        }
    }
    handle /public/* {
        file_server {
            root /home/server2/spikeball/public
        }
    }
    
    # Alles andere an Node.js mit optimierten Timeouts
    handle {
        reverse_proxy localhost:3000 {
            transport http {
                dial_timeout 5s
                response_header_timeout 10s
                keepalive 90s
                keepalive_idle_conns 20
                max_idle_conns_per_host 100
            }
            health_uri /health
            health_interval 30s
            health_timeout 5s
            health_status 200
        }
    }
}
```

## Caddyfile aktualisieren
```bash
# Backup erstellen
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup

# Neue Konfiguration schreiben (mit nano oder vim)
sudo nano /etc/caddy/Caddyfile

# Syntax prüfen
sudo caddy validate --config /etc/caddy/Caddyfile

# Caddy reload (keine Downtime)
sudo systemctl reload caddy
```

## Health-Check Endpoint in Spikeball hinzufügen
In deiner Node.js App (z.B. index.js oder app.js):
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

# SHELL OUTPUT / ERROR
Bei falschem Pfad zu statischen Dateien: 404 File Not Found
Bei Syntax-Fehler: `caddy validate` zeigt die Zeile an
Health-Check-Endpoint `/health` muss implementiert sein

# WEITERE RESOURCEN
- Caddy Pfad: /etc/caddy/Caddyfile
- Caddy Logs: /var/log/caddy/access.log (nach Aktivierung)
- Spikeball Assets: Pfade anpassen an deine Projektstruktur
---