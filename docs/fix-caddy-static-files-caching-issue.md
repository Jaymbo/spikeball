---
title: Caddy Static Files Caching Issue
tags: [caddy, nextjs, caching, reverse-proxy, static-files]
---
# PROBLEM
Statische Dateien (Profilbilder) werden nach längerer Server-Laufzeit (ca. 1 Tag) nicht mehr angezeigt, obwohl die Dateien existieren und die Links korrekt sind. Ein Neustart des Spikeball-Services behebt das Problem temporär.

# LÖSUNG
1. Caddy so konfigurieren, dass statische Dateien direkt serviert werden, nicht durch reverse_proxy
2. Caching-Header explizit setzen oder deaktivieren
3. File-Handler in Caddyfile hinzufügen, der vor dem reverse_proxy ausgeführt wird

# CODE / COMMANDS
```caddyfile
spikeball.ddns.net {
    # Statische Dateien direkt servieren mit Cache-Control
    @static {
        path /images/* /public/* *.jpg *.jpeg *.png *.gif *.svg *.ico *.webp
    }
    handle @static {
        root * /home/server2/spikeball/.next/standalone/public
        file_server
        header Cache-Control "public, max-age=3600, must-revalidate"
    }
    
    # Transform Port Query Handler
    @transform_port_query {
        query XTransformPort=*
    }
    handle @transform_port_query {
        reverse_proxy localhost:{query.XTransformPort}
    }
    
    # Standard reverse_proxy für dynamische Inhalte
    handle {
        reverse_proxy localhost:3000
    }
}
```

Alternative Lösung mit file_server für alle statischen Assets:
```caddyfile
spikeball.ddns.net {
    # Versuche zuerst, Dateien direkt zu servieren
    @static_files {
        file {
            try_files {path} /index.html
        }
    }
    handle @static_files {
        root * /home/server2/spikeball/.next/standalone/public
        file_server
    }
    
    # Transform Port Query Handler
    @transform_port_query {
        query XTransformPort=*
    }
    handle @transform_port_query {
        reverse_proxy localhost:{query.XTransformPort}
    }
    
    # Fallback zu reverse_proxy
    handle {
        reverse_proxy localhost:3000
    }
}
```

# SHELL OUTPUT / ERROR
Kein direkter Fehler, aber Symptom: Bilder werden nach ~24h nicht mehr geladen, obwohl sie im Dateisystem vorhanden sind.

# WEITERE RESOURCEN
- Caddyfile: /etc/caddy/Caddyfile
- Next.js public folder: /home/server2/spikeball/.next/standalone/public
- Next.js docs: https://nextjs.org/docs/deploying/standalone
- Caddy docs: https://caddyserver.com/docs/caddyfile/directives/file_server
---