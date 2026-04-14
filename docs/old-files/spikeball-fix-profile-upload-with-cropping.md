---
title: Spikeball Profile Upload with Image Cropping
tags: [spikeball, profile, upload, cropping, react-image-crop, bugfix]
---
# PROBLEM
Profilbild-Upload funktionierte nicht korrekt - beim Auswählen eines Bildes wurde das Fenster geschlossen, aber nichts hochgeladen oder angezeigt. Es fehlte eine Möglichkeit, einen quadratischen Ausschnitt für das Profilbild zu wählen.

# LÖSUNG
1. `react-image-crop` Bibliothek installiert (mit --legacy-peer-deps wegen ESLint-Konflikten)
2. AvatarUpload.tsx komplett umgeschrieben mit Cropping-Funktionalität
3. Namenskonflikt zwischen `Crop` Icon und `Crop` Type behoben

# CODE / COMMANDS

## Installation
```bash
cd spikeball
npm install react-image-crop --legacy-peer-deps
```

## AvatarUpload.tsx mit Cropping
```typescript spikeball/src/components/profile/AvatarUpload.tsx
use client';

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Crop as CropIcon } from "lucide-react";
import Image from "next/image";
import ReactCrop, { type Crop as CropType, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

export function AvatarUpload({ playerId, currentImage, onSuccess }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10,
    aspect: 1,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // File validation and preview generation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation (5MB max, JPEG/PNG/WebP only)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Die Datei ist zu groß (max 5MB)");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Nur JPEG, PNG und WebP Bilder sind erlaubt");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      // Reset crop state for new image
      setCrop({
        unit: '%',
        width: 80,
        height: 80,
        x: 10,
        y: 10,
        aspect: 1,
      });
      setCompletedCrop(null);
      setCroppedImageUrl('');
    };
    reader.readAsDataURL(file);
  };

  // Crop image to blob
  const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width;
    canvas.height = crop.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No canvas context');
    
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0, 0, crop.width, crop.height
    );
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Canvas to Blob failed');
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    const croppedBlob = await getCroppedImg(imgRef.current, completedCrop, 'cropped-avatar.jpg');
    const croppedUrl = URL.createObjectURL(croppedBlob);
    setCroppedImageUrl(croppedUrl);
  };

  const handleUpload = async () => {
    if (!preview || !completedCrop || !imgRef.current) return;

    setUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop, `avatar-${playerId}.jpg`);
      const formData = new FormData();
      formData.append("file", croppedBlob, `avatar-${playerId}.jpg`);
      formData.append("playerId", playerId);

      const res = await fetch("/api/upload/profile-picture", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.path);
        // Reset state
        setPreview(null);
        setCrop({ unit: '%', width: 100, height: 100, aspect: 1 });
        setCompletedCrop(null);
        setCroppedImageUrl('');
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {preview && (
        <div className="space-y-4">
          {/* Original Image with Crop Overlay */}
          <div className="flex justify-center">
            <div className="relative max-w-sm">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                keepSelection
                className="w-full"
              >
                <img ref={imgRef} alt="Upload preview" src={preview} 
                  style={{ maxWidth: '100%', maxHeight: '300px' }} />
              </ReactCrop>
            </div>
          </div>

          {/* Cropped Preview (circular like profile picture) */}
          {croppedImageUrl && (
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                <Image src={croppedImageUrl} alt="Cropped preview" fill
                  className="object-cover rounded-full border-2 border-primary" />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-2">
            {!croppedImageUrl ? (
              <>
                <Button onClick={handleCrop}><CropIcon /> Zuschneiden</Button>
                <Button onClick={handleCancel} variant="outline"><X /> Abbrechen</Button>
              </>
            ) : (
              <>
                <Button onClick={handleUpload} disabled={uploading}>Hochladen</Button>
                <Button onClick={() => setCroppedImageUrl('')} variant="outline"><X /> Neu</Button>
              </>
            )}
          </div>
        </div>
      )}
      {!preview && (
        <>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" 
            onChange={handleFileSelect} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
            <Upload /> Bild auswählen
          </Button>
        </>
      )}
    </div>
  );
}
```

# SHELL OUTPUT / ERROR

## Build Error (Before Fix)
```
Module parse failed: Identifier 'Crop' has already been declared (7:20)
```
Ursache: Namenskonflikt zwischen `Crop` Icon von lucide-react und `Crop` Type von react-image-crop.

## NPM Install Error (Peer Dependency Conflicts)
```
npm ERR! ERESOLVE could not resolve
npm ERR! peer eslint@"^7.23.0 || ^8.0.0" from eslint-config-next@14.2.35
```
Lösung: `npm install react-image-crop --legacy-peer-deps`

# BEHEBUNG

1. **Namenskonflikt behoben:**
   ```typescript
   import { Crop as CropIcon } from "lucide-react";
   import ReactCrop, { type Crop as CropType, PixelCrop } from "react-image-crop";
   ```

2. **Crop Workflow implementiert:**
   - Originalbild anzeigen mit Crop Overlay (ReactCrop)
   - "Zuschneiden" Button generiert Vorschau
   - Vorschau in Circle-Form (wie Profilbild)
   - "Hochladen" lädt nur den zugeschnittenen Bereich

# WEITERE RESOURCES
- `spikeball/src/components/profile/AvatarUpload.tsx`
- `spikeball/src/components/profile/PlayerProfile.tsx`
- `spikeball/src/app/api/upload/profile-picture/route.ts`
- react-image-crop: https://github.com/DominicTobias/react-image-crop
---