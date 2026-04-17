---
title: Caddy Configuration Examples for Spikeball Service
tags: [caddy, spikeball, ddns, reverse-proxy, port-forwarding]
---
# PROBLEM
Die aktuelle Caddy-Configuration für spikeball.ddns.net leitet ALLE Traffic (inkl. statische Dateien) durch den Reverse Proxy zu localhost:3000. Nach längerer Laufzeit (~24h) werden statische Dateien nicht mehr angezeigt. Die Konfiguration muss optimiert werden für Port-Forwarding und stabile Asset-Server.

# LÖSUNG
1. Statische Dateien direkt servieren (bypass Reverse Proxy)
2. Port-Forwarding für XTransformPort Query-Parameter beibehalten
3. Node.js Reverse Proxy mit optimierten Timeouts konfigurieren

# CODE / COMMANDS
## Aktuelle Konfiguration (Problematisch)
```
spikeball.ddns.net {
    @transform_port_query {
        query XTransformPort=*
    }
    handle @transform_port_query {
        reverse_proxy localhost:{query.XTransformPort}
    }
    handle {
        reverse_proxy localhost:3000
    }
}
```

## Optimierter Caddyfile (Empfohlen)
```
{
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
    handle /assets/* {
        file_server {
            root /var/www/spikeball/public/assets
        }
    }
    handle /uploads/* {
        file_server {
            root /var/www/spikeball/uploads
        }
    }
    handle /public/* {
        file_server {
            root /var/www/spikeball/public
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

## Caddy nach Änderungen neustarten
```bash
# Syntax prüfen
sudo caddy validate --config /etc/caddy/Caddyfile

# Caddy reload (keine Downtime)
sudo systemctl reload caddy

# Falls reload nicht klappt, full restart
sudo systemctl restart caddy
```

## Spikeball Service Logs prüfen nach Caddy-Changes
```bash
journalctl -u spikeball -f
journalctl -u spikeball --since 'today' | grep -E 'GET.*(profile|image|upload|asset)'
```

# SHELL OUTPUT / ERROR
Bei falschem Pfad zu statischen Dateien: 404 File Not Found
Bei Timeout-Problemen: 502 Bad Gateway / 504 Gateway Timeout
Health-Check-Endpoint `/health` muss in Spikeball implementiert sein

# WEITERE RESOURCEN
- Caddy Pfad: /etc/caddy/Caddyfile
- Caddy Logs: /var/log/caddy/access.log (nach Aktivierung)
- Spikeball Assets: Typischerweise `/public/assets`, `/uploads/`-Ordner prüfen
- DDNS Domain: spikeball.ddns.net muss dynamisch aktualisiert bleiben
---