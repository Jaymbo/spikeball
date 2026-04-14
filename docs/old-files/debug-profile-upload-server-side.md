---
title: Debugging-Checkliste für Profilbild-Upload speichert nicht
tags: [nextjs, typescript, debugging, file-upload]
---
# PROBLEM
Das Profilbild wird nicht auf dem Server gespeichert, obwohl die API-Route ohne Fehler zurückkehrt (`success: true`). Das Problem tritt nur auf dem Laptop auf, nicht auf dem Handy. Beide verwenden Firefox.

# LÖSUNG
1. **Debug-Logs zur API-Route hinzufügen** um zu prüfen, ob das File und playerId korrekt ankommen
2. **Network-Request untersuchen** im Browser (F12 > Network)
3. **Server-Logs prüfen** während ein Upload-Versuch gemacht wird
4. **Upload-Verzeichnis Berechtigungen prüfen**
5. **FormData-Struktur zwischen Handy und Laptop vergleichen**

# CODE / COMMANDS

## API-Route mit Debug-Logs (`route.ts`)
Am Anfang der POST-Funktion hinzufügen:

```typescript
export async function POST(request: NextRequest) {
  try {
    // Debug: Request info loggen
    console.log("=== UPLOAD DEBUG START ===");
    console.log("Request URL:", request.url);
    
    const formData = await request.formData();
    console.log("FormData keys:", Array.from(formData.keys()));
    
    const file = formData.get("file") as File;
    const playerId = formData.get("playerId") as string;
    
    console.log("File:", file);
    console.log("File name:", file?.name);
    console.log("File size:", file?.size);
    console.log("File type:", file?.type);
    console.log("PlayerId:", playerId);
    
    if (!file || !playerId) {
      console.error("MISSING: file or playerId");
      return NextResponse.json(
        { error: "File and playerId are required" },
        { status: 400 }
      );
    }
    // ... rest of your code
    
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
    console.log("Upload directory:", uploadDir);
    console.log("Directory exists before write?", existsSync(uploadDir));
    
    // Write file
    const bytes = await file.arrayBuffer();
    console.log("ArrayBuffer size:", bytes.byteLength);
    const buffer = Buffer.from(bytes);
    console.log("Buffer size:", buffer.length);
    
    await writeFile(filepath, buffer);
    console.log("File written successfully to:", filepath);
    console.log("File exists after write?", existsSync(filepath));
    
    console.log("=== UPLOAD DEBUG END ===");
    // ...
```

## Frontend Debug-Hooks (AvatarUpload.tsx)
In `handleUpload` hinzufügen:

```typescript
const handleUpload = async () => {
  if (!preview || !completedCrop || !imgRef.current) return;

  setUploading(true);
  try {
    const croppedBlob = await getCroppedImg(
      imgRef.current,
      completedCrop,
      'cropped-avatar.jpg'
    );
    
    console.log("BLOBS:", {
      size: croppedBlob.size,
      type: croppedBlob.type
    });
    
    const formData = new FormData();
    formData.append("file", croppedBlob, `avatar-${playerId}.jpg`);
    formData.append("playerId", playerId);
    
    // Debug: FormData logging
    console.log("FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }
    // ...
```

## Terminal-Commands zum Prüfen
```bash
# Verzeichnis-Struktur prüfen
ls -la spikeball/public/uploads/profiles/

# Datei-Berechtigungen prüfen
ls -la spikeball/public/uploads/

# Schreibrechte testen
touch spikeball/public/uploads/test-file.txt
```

# SHELL OUTPUT / ERROR
Überprüfe diese Ausgaben in Browser Console & Server Terminal:

**Browser Console (beim Upload-Versuch):**
```
BLOBS: { size: 12345, type: "image/jpeg" }
FormData entries:
  file: [object File]
  playerId: "cmndiyoaf0002l04g12zyrwd2"
```

**Server Terminal (beim Upload-Versuch):**
```
=== UPLOAD DEBUG START ===
Request URL: http://localhost:3000/api/upload/profile-picture
FormData keys: [ 'file', 'playerId' ]
File: File { name: 'avatar-cmndiyoaf...', size: 12345, type: 'image/jpeg' }
File size: 12345
File type: image/jpeg
PlayerId: cmndiyoaf0002l04g12zyrwd2
ArrayBuffer size: 12345
Buffer size: 12345
File written successfully to: /path/to/public/uploads/profiles/...
=== UPLOAD DEBUG END ===
```

# WEITERE RESOURCEN
- API-Route: `spikeball/src/app/api/upload/profile-picture/route.ts`
- Frontend Component: `spikeball/src/components/profile/AvatarUpload.tsx`
- Browser DevTools Guide: https://developer.chrome.com/docs/devtools/

---