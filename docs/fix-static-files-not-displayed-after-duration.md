---
title: Static Files Not Showing After Extended Runtime
tags: [caddy, reverse-proxy, static-files, spikeball, nodejs, connection-timeout]
---
# PROBLEM
Nachdem der Server ca. 24 Stunden läuft, werden Profilbilder (und potentiell andere statische Dateien) nicht mehr angezeigt. Die Dateipfade sind korrekt und die Dateien existieren am erwarteten Ort. Ein Neustart des Spikeball-Services löst das Problem temporär für weiteren ca. 24 Stunden.

# LÖSUNG
1. Caddy konfigurieren, um statische Dateien direkt zu servieren statt durch den Reverse Proxy zu schicken
2. Alternativ: Caddy Reverse-Proxy Timeout- und Keep-Alive-Einstellungen anpassen
3. Verbindungspooling von Node.js untersuchen und konfigurieren

# CODE / COMMANDS
## Option A: Statische Dateien direkt via Caddy servieren (Empfohlen)
Zu Caddyfile vor dem reverse_proxy Block hinzufügen:
```
handle /assets/* {
    file_server {
        root /pfad/zu/spikeball/public/assets
    }
}
handle /uploads/* {
    file_server {
        root /pfad/zu/spikeball/uploads
    }
}
```

## Option B: Caddy Reverse-Proxy Timeouts konfigurieren
Reverse-Proxy-Direktive erweitern:
```
reverse_proxy localhost:3000 {
    transport http {
        dial_timeout 5s
        response_header_timeout 10s
        keepalive 90s
        keepalive_idle_conns 10
        max_idle_conns_per_host 100
    }
}
```

## Option C: Node.js Verbindungspooling untersuchen
In der Anwendung Keep-Alive konfigurieren:
```javascript
// Beispiel für Node.js/Express
server.timeout = 60000; // 60 seconds
server.keepAliveTimeout = 65000; // 65 seconds
```

# SHELL OUTPUT / ERROR
Erwartetes Verhalten: Bilder laden konsistent
Aktuelles Verhalten: Nach ~24h werden Bilder nicht mehr geladen (Timeout oder HTTP 5xx)
`systemctl restart spikeball` löst das Problem temporär

# WEITERE RESOURCEN
- Caddyfile Pfad: /etc/caddy/Caddyfile
- Spikeball Service Neustart: systemctl restart spikeball
- Caddy Reverse Proxy Docs: https://caddyserver.com/docs/caddyfile/directives/reverse_proxy
- Connection Pooling Issue: Stale connections after extended runtime
---