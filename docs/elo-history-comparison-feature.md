"---
title: ELO-Verlauf und Vergleichsfunktion
tags: [elo, chart, comparison, profile, feature]
---

# PROBLEM
Es fehlte eine visuelle Darstellung der ELO-Entwicklung über die Zeit sowie die Möglichkeit, die ELO-Verläufe mehrerer Spieler miteinander zu vergleichen.

# LÖSUNG
1. ELO-Verlauf-Chart-Komponente erstellt (`EloHistoryChart.tsx`)
2. Vergleichs-Chart-Komponente erstellt (`EloComparisonChart.tsx`)
3. Profil um ELO-Verlauf-Tab erweitert
4. Neue Vergleichsseite unter `/compare` erstellt
5. API-Endpoint für ELO-Vergleich erstellt

# CODE / COMMANDS

## Neue Dateien erstellt:

### `src/components/profile/EloHistoryChart.tsx`
- Zeigt ELO-Entwicklung als LineChart
- Statistik-Karten (Aktuelles ELO, Gesamtveränderung, Spiele)
- Responsive Design mit Recharts

### `src/components/profile/EloComparisonChart.tsx`
- Unterstützt bis zu 8 Spieler gleichzeitig
- Automatische Farbzweisung
- Statistik-Tabelle mit Vergleichswerten
- Spieler können entfernt werden

### `src/app/compare/page.tsx`
- Neue Seite für ELO-Vergleich
- Spieler-Suche und Auswahl
- Integration mit PlayerAutocomplete

### `src/app/api/elo-compare/route.ts`
- API-Endpoint für ELO-Vergleichsdaten
- Authentifizierung erforderlich
- Maximal 8 Spieler

## Änderungen an bestehenden Dateien:

### `src/components/profile/PlayerProfile.tsx`
- Import von `LineChart` und `ArrowRight` Icons hinzugefügt
- Import von `EloHistoryChart` hinzugefügt
- Tabs von 2 auf 3 erweitert (Info, ELO-Verlauf, Spiele)
- Neuer Tab \"ELO-Verlauf\" mit Chart und Vergleichs-Button

### `src/app/page.tsx`
- Neuer Tab \"Vergleich\" zur Navigation hinzugefügt
- Link zur `/compare` Seite

# WEITERE RESOURCEN
- Recharts Library: https://recharts.org/
- Chart-Komponenten: `src/components/ui/chart.tsx`
- ELO-System: `src/lib/elo.ts`
"