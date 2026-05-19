---
title: Fix File Corruption - Stray Quotes in Code Files
tags: [nextjs, typescript, build, syntax-error, file-corruption]
---
# PROBLEM
Next.js Build fehlgeschlagen mit zwei Syntax-Fehlern durch "File Corruption" (stray quotes in Code-Dateien):
1. `src/lib/elo.ts` - Interface und Kommentar mit Anführungszeichen umwickelt: `"export interface EloBreakdown {` und `// --- NEW CONSTANTS ---"`
2. `src/app/api/feature-requests/route.ts` - Komplett falscher Dateiinhalt: Enthielt React-Component-Code (`"use client"`, JSX) statt der API-Route

# LÖSUNG
1. **elo.ts:** Stray quotes entfernen - `"export interface` → `export interface` und `---"` → `---`
2. **feature-requests/route.ts:** Datei aus Git wiederherstellen mit `git checkout HEAD -- src/app/api/feature-requests/route.ts`
3. Build erneut ausführen mit `npm run build`

# CODE / COMMANDS
```bash
# Datei aus Git wiederherstellen
git checkout HEAD -- src/app/api/feature-requests/route.ts

# Build testen
npm run build
```

elo.ts Korrektur (vorher - falsch):
```typescript
"export interface EloBreakdown {
  ...
// --- NEW CONSTANTS ---"
```

elo.ts Korrektur (nachher - richtig):
```typescript
export interface EloBreakdown {
  ...
// --- NEW CONSTANTS ---
```

# SHELL OUTPUT / ERROR
```
Failed to compile.
./src/app/api/feature-requests/route.ts
Error:
x Expected '>', got 'className'
,-[/home/server2/spikeball/src/app/api/feature-requests/route.ts:191:1]
191 |   if (players.length < 4) {
192 |     return (
193 |       <Card>
194 |         <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">

./src/lib/elo.ts
Error:
x Unterminated string constant
,-[/home/server2/spikeball/src/lib/elo.ts:8:1]
11 | "export interface EloBreakdown {
21 | // --- NEW CONSTANTS ---"
```

# WEITERE RESOURCEN
- Datei: `spikeball/src/lib/elo.ts`
- Datei: `spikeball/src/app/api/feature-requests/route.ts`
- Verwandte Doku: `docs/old-files/fix-spikeball-build-error-unterminated-string.md` (gleiches Pattern - quotes in Code-Dateien)
- Verwandte Doku: `docs/old-files/file-corruption-pattern-analysis-text-in-code-files.md` (allgemeine Korruptions-Analyse)
- WICHTIG: Dies ist ein **wiederkehrendes Problem**! Die Ursache scheint ein AI-Tool zu sein, das Code-Dateien mit Anführungszeichen umwickelt oder falschen Inhalt schreibt.