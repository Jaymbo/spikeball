---
title: Infrastructure Setup - Caddy & Next.js
tags: [infrastructure, caddy, nextjs, deployment, server]
---

# PROBLEM
Server-Infrastruktur muss dokumentiert werden für Wartung und Troubleshooting. Caddy reverse-proxy konfiguriert, aber HTTPS fehlt für SEO.

# LÖSUNG
1. Caddyfile dokumentieren und HTTPS-Optionen bereitstellen
2. Next.js Build-Prozess mit npm statt bun (da bun nicht installiert)
3. Service-Management dokumentieren (spikeball.service)

# CODE / COMMANDS

**Aktuelle Caddyfile-Konfiguration (HTTP only):**
```nginx
:80 {
	@transform_port_query {
		query XTransformPort=*
	}

	handle @transform_port_query {
		reverse_proxy localhost:{query.XTransformPort} {
			header_up Host {host}
			header_up X-Forwarded-For {remote_host}
			header_up X-Forwarded-Proto {scheme}
			header_up X-Real-IP {remote_host}
		}
	}

	handle {
		reverse_proxy localhost:3000 {
			header_up Host {host}
			header_up X-Forwarded-For {remote_host}
			header_up X-Forwarded-Proto {scheme}
			header_up X-Real-IP {remote_host}
		}
	}
}
```

**Empfohlene HTTPS-Konfiguration (für SEO):**
```nginx
spikeball.ddns.net {
	reverse_proxy localhost:3000 {
		header_up Host {host}
		header_up X-Forwarded-For {remote_host}
		header_up X-Forwarded-Proto https
		header_up X-Real-IP {remote_host}
	}
}
```

**Next.js Build & Start:**
```bash
# Build (Produktion)
cd /home/server2/spikeball
npm run build

# Start (Produktion)
npm run start

# Development Mode
npm run dev
```

**Service-Management:**
```bash
# Service starten
sudo systemctl start spikeball

# Service stoppen
sudo systemctl stop spikeball

# Service Status prüfen
sudo systemctl status spikeball

# Service Logs ansehen
sudo journalctl -u spikeball -f

# Service neu starten
sudo systemctl restart spikeball
```

# SHELL OUTPUT / ERROR
Bun ist nicht installiert auf dem Server. Nutze npm statt bun.

# WEITERE RESOURCES
- Caddyfile: `/home/server2/spikeball/Caddyfile`
- Service File: `/etc/systemd/system/spikeball.service`
- Next.js Config: `/home/server2/spikeball/next.config.js`
---