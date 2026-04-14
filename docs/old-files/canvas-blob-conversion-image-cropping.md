---
title: Canvas Blob Conversion for Image Cropping
tags: [canvas, image-processing, blob, typescript, client-side]
---

# PROBLEM
Die Konvertierung von Canvas zu Blob schlägt manchmal fehl, wenn der Canvas-Kontext nicht verfügbar ist oder wenn die Browser-Kompatibilität variiert. Dies führt zu fehlgeschlagenen Image-Cropper-Uploads.

# LÖSUNG
1. Überprüfe den Canvas-Kontext vor der Verwendung
2. Verwende Promise-basierte API für Canvas.toBlob()
3. Implementiere Fallback-Handling für verschiedene Bildformate
4. Setze Qualität-Parameter für JPEG-Komprimierung

# CODE / COMMANDS
```typescript
const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  canvas.width = crop.width;
  canvas.height = crop.height;
  
  // Critical: Check context availability
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No canvas context');
  }
  
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );
  
  // Return Promise for async blob conversion
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas to Blob failed'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.95); // 95% quality for JPEG
  });
};
```

# SHELL OUTPUT / ERROR
```
Error: Canvas to Blob failed
Error: No canvas context
```

# WEITERE RESOURCEN
- Dateipfad: `spikeball/src/components/profile/AvatarUpload.tsx`
- MDN Canvas API: <https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob>
- react-image-crop library: <https://github.com/DominicTobias/react-image-crop>
---