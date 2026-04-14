---
title: Profilbild-Upload in Next.js funktioniert nicht auf Laptop, funktioniert auf Handy
tags: [nextjs, typescript, api-upload, mobile-desktop-discrepancy]
---
# PROBLEM
Der Profilbild-Upload funktioniert auf dem Handy (Firefox) aber nicht auf dem Laptop (Firefox). Das Bild wird zwar an den Server gesendet, aber nicht gespeichert. Die API-Route ist implementiert und wurde kurzzeitig zum Laufen gebracht, das Problem trat danach wieder auf.

# LÖSUNG
1. Überprüfen, ob das File-Objekt im Frontend korrekt erstellt und als FormData gesendet wird
2. Prüfen der Netzwerk-Requests in den Browser-DevTools (F12 > Network)
3. Vergleichen der FormData-Struktur zwischen Handy und Laptop
4. Debugging der API-Route mit Console-Logs für Request-Daten

# CODE / COMMANDS

## API-Route Struktur (/src/app/api/upload/profile-picture/route.ts)
```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const playerId = formData.get("playerId") as string;
  
  // ... Validation und Speicherlogik
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filepath, buffer);
}
```

## Frontend Debugging (Browser Console)
```javascript
// Prüfen, ob FormData korrekt befüllt ist
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("playerId", playerId);

// Loggen der FormData
for (let [key, value] of formData.entries()) {
  console.log(`${key}:`, value);
}
```

# SHELL OUTPUT / ERROR
Typische Error-Messages im Network-Log:
- `{"error": "File and playerId are required"}` - FormData nicht korrekt gesendet
- `{"error": "Upload failed"}` - Serverseitiger Fehler beim Speichern
- Kein Response - Request wurde nicht abgeschickt

# WEITERE RESOURCES
- API-Route: `spikeball/src/app/api/upload/profile-picture/route.ts`
- Upload-Verzeichnis: `public/uploads/profiles/`
- Next.js File Upload Docs: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---