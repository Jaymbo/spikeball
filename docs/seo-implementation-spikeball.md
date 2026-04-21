---
title: SEO Implementation for spikeball.ddns.net
tags: [seo, nextjs, google, indexing, ranking, spikeball]
---

# PROBLEM
Website spikeball.ddns.net existiert technisch aber wird nicht in Suchmaschinen gefunden. Google kann DDNS-Domains nicht automatisch indexieren und es fehlen SEO-Grundlagen (Metadata, Sitemap, Robots.txt).

# LÖSUNG
1. Google Search Console manuell einrichten (dringend notwendig für DDNS-Domains)
2. Next.js Metadata API für Spikeball-spezifische Keywords implementieren
3. Sitemap automatisch generieren für Google-Crawler
4. Robots.txt erstellen mit Crawling-Regeln
5. HTTPS für SEO-Trust implementieren (noch ausstehend)

# CODE / COMMANDS

**1. Google Search Console Einrichtung:**
```
1. Öffne: https://search.google.com/search-console/welcome
2. URL-Präfix: https://spikeball.ddns.net eintragen
3. Verifizierung: DNS-TXT Methode im DDNS-Portal
4. Sitemap einreichen: https://spikeball.ddns.net/sitemap.xml
5. Indexierung prüfen: "URL prüfen" Feature nutzen
```

**2. Metadata in src/app/layout.tsx:**
```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://spikeball.ddns.net'),
  title: {
    default: 'Spikeball ELO Ranking Deutschland - Turnier-Statistik',
    template: '%s | Spikeball ELO Ranking'
  },
  description: "Das ELO Ranking für Spikeball Deutschland. Tracke Turnier-Ergebnisse, Spieler-Statistiken und verbessere deine Spikeball-Erfahrung. Wer führt das aktuelle Ranking an?",
  keywords: "spikeball, spikeball deutschland, elo ranking, spikeball-turnier, mannsspiel-statistik, spikeball-elo, turnier-erstellung",
  authors: [{ name: "Spikeball Deutschland" }],
  openGraph: {
    title: "Spikeball ELO Ranking Deutschland",
    description: "Wer führt das Spikeball Ranking an? Tracke deine Statistiken und verbessere dein Matchup-Balancing.",
    type: "website",
    url: "https://spikeball.ddns.net",
    siteName: "Spikeball Ranking Deutschland",
    images: [{
      url: '/spikeball-logo.png',
      width: 1200,
      height: 630,
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spikeball ELO Ranking Deutschland",
    description: "Spieler-Statistiken & Leaderboard für Spikeball Deutschland",
    images: ['/spikeball-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/spikeball-logo.png",
  },
};
```

**3. Sitemap in src/app/sitemap.ts (automatisch generiert):**
```typescript
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://spikeball.ddns.net',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://spikeball.ddns.net/leaderboard',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://spikeball.ddns.net/players',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]
}
```

**4. Robots.txt in src/app/robots.ts:**
```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
      disallow: '/admin/',
      disallow: '/login',
    },
    sitemap: 'https://spikeball.ddns.net/sitemap.xml',
  }
}
```

# SHELL OUTPUT / ERROR
SEO-Betrachtung dauert 3-6 Monate bis erste Ergebnisse sichtbar sind! DDNS-Domains werden von Google nicht automatisch indexiert - manuelle Anmeldung in Search Console ist zwingend.

# WEITERE RESOURCES
- Google Search Console: https://search.google.com/search-console
- PageSpeed Insights: https://pagespeed.web.dev/
- Lighthouse: Chrome DevTools (dann Ctrl+Shift+I -> Lighthouse)
- Metadata API: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
---