---
title: Secure File Upload API Validation
tags: [nextjs, api-route, security, file-upload, validation]
---

# PROBLEM
Datei-Uploads in Next.js API-Routen erfordern mehrfache Sicherheitsüberprüfungen (Authentifizierung, Autorisierung, Dateityp-Validierung, Größenbeschränkung) und korrekte Dateisystem-Operationen, um Sicherheitslücken zu vermeiden.

# LÖSUNG
1. Implementiere mehrstufige Validierung (Auth → Authz → Type → Size → Processing)
2. Verwende Poster-Authentifizierung und session-basierte Validierung
3. Generiere eindeutige Dateinamen mit Zeitstempel und User-ID
4. Lösche alte Dateien vor dem Hochladen neuer
5. Behandle Dateisystem-Operationen asynchron mit try/catch
6. Erstelle Upload-Verzeichnisse rekursiv, wenn sie nicht existieren

# CODE / COMMANDS
```typescript
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const playerId = formData.get("playerId") as string;

    // 2. Input Validation
    if (!file || !playerId) {
      return NextResponse.json(
        { error: "File and playerId are required" },
        { status: 400 }
      );
    }

    // 3. Fetch Player and Authorization Check
    const player = await db.player.findUnique({
      where: { id: playerId },
      include: { user: true },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // 4. Authorization: Only admin or own player
    const isAdmin = session.isAdmin;
    const isOwnPlayer = player.userId === session.userId;

    if (!isAdmin && !isOwnPlayer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 5. File Size Validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 }
      );
    }

    // 6. File Type Validation
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG and WebP allowed." },
        { status: 400 }
      );
    }

    // 7. Create Upload Directory
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 8. Generate Unique Filename
    const ext = path.extname(file.name);
    const filename = `${player.id}-${Date.now()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // 9. Write File
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // 10. Delete Old Profile Picture
    if (player.profilePicture) {
      const oldPath = path.join(process.cwd(), "public", player.profilePicture);
      if (existsSync(oldPath)) {
        try {
          await unlink(oldPath);
        } catch (error) {
          console.error("Failed to delete old profile picture:", error);
        }
      }
    }

    // 11. Update Database
    await db.player.update({
      where: { id: playerId },
      data: { profilePicture: `/uploads/profiles/${filename}` },
    });

    return NextResponse.json({
      success: true,
      path: `/uploads/profiles/${filename}`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
```

# SHELL OUTPUT / ERROR
```
Error: ENOENT: no such file or directory, mkdir 'public/uploads/profiles'
Error: EACCES: permission denied, unlink 'public/uploads/profiles/old-file.jpg'
```

# WEITERE RESOURCEN
- Dateipfad: `spikeball/src/app/api/upload/profile-picture/route.ts`
- Next.js API Routes: <https://nextjs.org/docs/app/building-your-application/routing/route-handlers>
- OWASP File Upload Guidelines: <https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html>
---