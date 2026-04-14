---
title: Profile System & Image Upload
tags: [profile, upload, cropping, blob, validation]
---
# PROBLEM

Implementierung von Profilbild-Uploads, Image Cropping und dynamischer Profil-Anzeige. Probleme mit Authentifizierung, Image-Conversion (Blob to File) und Missing Components mussten gelöst werden.

# LÖSUNG

1. **Image Cropping (react-image-crop):**
   - Pixel-Based Crop nötig für Next.js Image Component.
   - Canvas zur Konvertierung in Blob und anschließendes Upload.

2. **API Security (`/api/upload/profile-picture`):**
   - Valid: `contentType === 'image/png' || 'image/jpeg'`
   - Prüfe: User hat Rechte für diesen `playerId` (oder ist Admin).

3. **React File Input Desktop:**
   - Von `accept="image/*"` auf `.jpg,.jpeg,.png` ändern (erzwingt Desktop-Fenster).

4. **Profile Dynamic Ownership:**
   - `PlayerProfile` receives `isOwnProfile` prop, validiert zusätzlich via `useEffect` gegen `/api/players/current-player`.

# CODE / COMMANDS

```typescript
// Canvas Blob Conversion & Upload
export async function getCroppedImg(image: HTMLImageElement, crop: PixelCrop) {
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('No 2d context');

  ctx.drawImage(
    image,
    crop.x, crop.y, crop.width, crop.height,
    0, 0, crop.width, crop.height
  );

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      resolve(blob);
    }, 'image/jpeg', 0.9); // Quality 0.9
  });
}
```

```typescript
// Secure Upload Route
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const playerId = formData.get('playerId') as string;

  if (!file || !playerId) return NextResponse.json({ error: 'Missing data' }, { 400 });

  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { 400 });
  }

  const user = await getCurrentUser();
 
  // Check if user owns this profile or is admin
  const player = await db.player.findUnique({ where: { id: playerId } });
  if (!player || (player.userId !== user.userId && !user.isAdmin)) {
    return NextResponse.json({ error: 'Unauthorized' }, { 403 });
  }

  // Convert File to Buffer for BLOB storage
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await db.player.update({
    where: { id: playerId },
    data: { profilePicture: buffer } // Prisma handles BLOB
  });

  return NextResponse.json({ success: true });
}
```

# SHELL OUTPUT / ERROR

**Error:** `request.body is not a stream` (Node 20+)
**Fix:** Use `req.formData()` instead of JSON parsing for multipart uploads. Ensure `next.config.mjs` (if used) does not break body parsing.

**Error:** Desktop opens media library (mobile style) instead of file picker.
**Fix:** Change accept attribute to `.jpg,.jpeg,.png` explicitly.

# WEITERE RESOURCES

- Components: `src/components/profile/PlayerProfile.tsx`, `AvatarUpload.tsx`
- Routes: `src/app/api/upload/profile-picture/route.ts`, `api/players/current-player/route.ts`
- Schema: `prisma/schema.prisma` (Field `profilePicture Bytes?)`