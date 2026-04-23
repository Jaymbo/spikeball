"---
title: Code Review 2025-01-18 - Critical Fixes & Refactoring
tags: [typescript, eslint, refactoring, cleanup]
---
# PROBLEM
Das GPT-generierte Repository enthält zahlreiche Code-Qualitäts-Probleme, die zu Wartungsschwierigkeiten, Typos und ineffizientem Code führen. Die wichtigste Datei (eslint.config.mjs) wurde mit ALLEN Regeln deaktiviert, wodurch die Code-Qualitätssicherung komplett fehlgeschlagen ist.

# LÖSUNG
Systematisches Refactoring nach Production-Standards. Alle Änderungen sollten schrittweise getestet werden.

1. ESLint Config aktivieren und straffen
2. TypeScript Config strikter konfigurieren
3. Typos im Frontend korrigieren
4. Debug-Logs entfernen oder mit Logger ersetzen
5. Type-Safety verbessern
6. Datenbank-Abfragen optimieren

# CRITICAL Fixes

## 1. ESLINT CONFIG (eslint.config.mjs)

**Problem:** ALLE ESLint-Regeln sind deaktiviert (`"off"` für alles)

**Fix:** Ersetze die gesamte Datei durch:

\`\`\`javascript
import nextCoreWebVitals from \"eslint-config-next/core-web-vitals\";\nimport nextTypescript from \"eslint-config-next/typescript\";\nimport { dirname } from \"path\";\nimport { fileURLToPath } from \"url\";\n\nconst __filename = fileURLToPath(import.meta.url);\nconst __dirname = dirname(__filename);\n\nconst eslintConfig = [\n  ...nextCoreWebVitals,\n  ...nextTypescript,\n  {\n    rules: {\n      // TypeScript Rules - STRICT MODE\n      \"@typescript-eslint/no-explicit-any\": \"error\",\n      \"@typescript-eslint/no-unused-vars\": [\"warn\", {\n        argsIgnorePattern: \"^_\",\n        varsIgnorePattern: \"^_\",\n      }],\n      \"@typescript-eslint/no-non-null-assertion\": \"warn\",\n      \"@typescript-eslint/ban-ts-comment\": [\"warn\", {\n        \"ts-ignore\": \"allow-with-description\",\n        \"ts-nocheck\": true\n      }],\n      \"@typescript-eslint/consistent-type-imports\": [\"warn\", {\n        prefer: \"type-imports\",\n        disallowTypeAnnotations: false,\n      }],\n      \"@typescript-eslint/naming-convention\": [\n        \"warn\",\n        {\n          selector: \"interface\",\n          format: [\"PascalCase\"],\n          custom: {\n            regex: \"^I[A-Z]\",\n            match: false\n          }\n        }\n      ],\n      \n      // React Rules\n      \"react-hooks/exhaustive-deps\": \"warn\",\n      \"react-hooks/rules-of-hooks\": \"error\",\n      \"react/react-in-jsx-scope\": \"off\", // Next.js doesn't need React import\n      \"react/prop-types\": \"off\", // Using TypeScript instead\n      \"react/display-name\": \"off\",\n      \"react/no-unescaped-entities\": \"warn\",\n      \"no-console\": [\"warn\", { allow: [\"warn\", \"error\"] }],\n      \n      // Next.js Rules\n      \"@next/next/no-img-element\": \"warn\",\n      \"@next/next/no-html-link-for-pages\": \"warn\",\n      \n      // General Rules\n      \"prefer-const\": \"warn\",\n      \"no-var\": \"error\",\n      \"eqeqq\": [\"error\", \"always\"],\n      \"curly\": [\"error\", \"all\"],\n      \"no-throw-literal\": \"error\",\n    },\n  },\n  {\n    ignores: [\n      \"node_modules/**\", \n      \".next/**\", \n      \"out/**\", \n      \"build/**\", \n      \"next-env.d.ts\", \n      \"examples/**\",\n      \"skills\",\n      \"*.config.js\",\n      \"*.config.mjs\",\n    ]\n  }\n];\n\nexport default eslintConfig;\n\`\`\`

## 2. TYPESCRIPT CONFIG (tsconfig.json)

**Problem:** `noImplicitAny: false` macht TypeScript nutzlos

**Fix:** Ändere in tsconfig.json:

\`\`\`json\n\"noImplicitAny\": true,\n\"noImplicitReturns\": true,\n\"noUnusedLocals\": true,\n\"noUnusedParameters\": true,\n\"noFallthroughCasesInSwitch\": true,\n\"target\": \"ES2022\"\n\`\`\`

## 3. FRONTEND TYPOS (src/components/profile/PlayerProfile.tsx)

**Problem:** Fehlende Umlaute in Button-Texten

**Fixes:**
- Zeile ~297: `\"Wird abgebrochen...\"` → `\"Wird abgebrochen...\"` (füge ü hinzu)
- Zeile ~297: `\"Wird abgebrochen\"` → `\"Wird abgebrochen\"`
- Zeile ~289: `\"Wird gesendet...\"` → `\"Wird gesendet...\"` (füge ü hinzu)
- Zeile ~289: `\"Freund hinzufügen\"` (füge ü hinzu)
- Zeile ~324: `\"Anfrage zurückziehen\"` (prüfe auf fehlende Umlaute)

## 4. DEBUG LOGS ENTFERNEN

**Problem:** Production-Code enthält Hunderte von `console.log` Statements

**Files to clean:**
- src/app/api/players/[id]/route.ts (Zeilen mit `console.log(\"[API...`, `console.log(\"[PlayerProfile...`)
- src/components/profile/PlayerProfile.tsx (Zeilen mit `console.log(\"[PlayerProfile...`)

**Strategie:**
- Behalte nur `console.error` für echte Fehler
- Ersetze Debug-Logs mit einem optionalen Logger-System
- Oder entferne sie komplett

## 5. DUPLICATE IMPORTS (src/app/api/auth/login/route.ts)

**Problem:** `bcrypt` wird 2x importiert (einmal in auth, einmal direkt)

**Fix:** Entferne `import bcrypt from 'bcryptjs';` am Anfang der Datei, da es schon in `@/lib/auth` importiert wird

## 6. TYPE SAFETY (src/components/profile/PlayerProfile.tsx)

**Problem:** Viele `any` Types, zB. `const [playerData, setPlayerData] = useState<any>(null)`

**Fix:** Definiere Interfaces:

\`\`\`typescript\ninterface EloHistoryEntry {\n  id: string;\n  previousRating: number;\n  newRating: number;\n  change: number;\n  createdAt: string;\n  game: GameEntry | null;\n}\n\ninterface GameEntry {\n  id: string;\n  team1Player1: Player;\n  team1Player2: Player;\n  team2Player1: Player;\n  team2Player2: Player;\n  team1Score: number;\n  team2Score: number;\n  playedAt: string;\n}\n\ninterface Player {\n  id: string;\n  name: string;\n  eloRating: number;\n  profilePicture: string | null;\n}\n\ninterface PlayerData {\n  player: Player;\n  eloHistory: EloHistoryEntry[];\n  gameHistory: GameEntry[];\n  isFriend: boolean;\n  friendRequestType: string | null;\n  friendshipId: string | null;\n  isOwnProfile: boolean;\n}\n\n// Dann:\nconst [playerData, setPlayerData] = useState<PlayerData | null>(null);\n\`\`\`

## 7. DATABASE OPTIMIZATION (src/app/api/players/[id]/route.ts)

**Problem:** Die GET-Route lädt zu viel redundante Daten durch 4 separate Joins (gamesTeam1P1, gamesTeam1P2, etc.) und erstellt dann Arrays

**Optimierung:** Verwende Prisma's `or` operator direkt:

\`\`\`typescript\nconst player = await db.player.findUnique({\n  where: { id: playerId },\n  include: {\n    eloChanges: {\n      orderBy: { createdAt: \"desc\" },\n      take: 100,\n      include: {\n        game: {\n          include: {\n            team1Player1: true,\n            team1Player2: true,\n            team2Player1: true,\n            team2Player2: true,\n          },\n        },\n      },\n    },\n    // Verwende Prisma's 'or' in where:\n    games: {\n      where: {\n        OR: [\n          { team1Player1Id: playerId },\n          { team1Player2Id: playerId },\n          { team2Player1Id: playerId },\n          { team2Player2Id: playerId },\n        ],\n      },\n      orderBy: { playedAt: \"desc\" },\n      take: 50,\n      include: {\n        team1Player1: true,\n        team1Player2: true,\n        team2Player1: true,\n        team2Player2: true,\n      },\n    },\n  },\n});\n\`\`\`

Hinweis: Dafür muss das Prisma Schema angepasst werden, um eine `games Relation` hinzuzufügen (siehe Schema Update unten).

# SCHHEMA UPDATE (Prisma)

Für die DB-Optimierung sollte das Schema erweitert werden:

```prisma
model Player {
  // ... existing fields ...
  
  // Neue virtual relation für alle Spiele
  games Game[] @relation(\"PlayerGames\")
}

model Game {
  // ... existing fields ...
  
  // Add to each player relation:
  allPlayers Player[] @relation(\"PlayerGames\")  -- Comment out or remove this line after adding
}
```

Besser wäre: Verwende invalidForeignKeys oder Firestore. Aber für SQLite ist der aktuelle Ansatz vertretbar.

# AUSFÜHRUNG REIHENFOLGE

1. ⚠️ **VORHER:** Repo backupen (git commit oder zip)
2. Ändere eslint.config.mjs
3. Ändere tsconfig.json
4. Starte dev server, prüfe ESLint-Fehler
5. Behebe Typos in Komponenten
6. Entferne/optimiere Debug-Logs
7. Fehlende Types definieren
8. DB-Queries optimieren (als Schritt 8 wegen Komplexität)
9. Testen! (Alle features prüfen)

# NOTIZ

Es gibt fehlerhafte freundschaft-status-checks. Die api/players/[id]/route.ts verwendet playerIds um freundschaft-status zu prüfen, aber Friendship ist mit User-IDs verknüpft. Das ist bereits teilweise korrigiert (siehe DEBUG logs), aber sollte nochmal überprüft werden.
"