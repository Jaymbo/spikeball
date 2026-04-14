---
title: React Image Crop Quality Controls
tags: [react-image-crop, image-quality, aspect-ratio, canvas, ui]
---

# PROBLEM
Die Bildqualität beim Crop-Vorgang kann verloren gehen, wenn Canvas-Parameter nicht korrekt eingestellt sind. Auch das Verhalten verschiedener Browser bei der Berechnung von Pixelmaßen ist inkonsistent, was zu verzerrten Endbildern führen kann.

# LÖSUNG
1. Verwende `naturalWidth/naturalHeight` des Originalbildes für korrekte Skalierungsfaktoren
2. Setze Canvas-Dimensionen explizit auf die crop.width/height in Pixel
3. Verwende keepSelection=Richtungen um Ausschlussfläche zu erhalten
4. Zeige Preview vor dem Upload und erlaube Neu-Cropping
5. Wähle 0.95 Quality-Parameter für JPEG Komprimierung
6. Round auf ganze Numbers bei Koordinaten-Berechnung

# CODE / COMMANDS
```tsx
// Canvas Skalierungsfaktoren basieren auf natürlichen Maßen
const scaleX = image.naturalWidth / image.width;
const scaleY = image.naturalHeight / image.height;

// ReactCrop Setup
<ReactCrop
  crop={crop}
  onChange={(_, percentCrop) => setCrop(percentCrop)}
  onComplete={(c) => setCompletedCrop(c)}
  aspect={1}  // Force quadratisch
  keepSelection  // Zuschnitt nach crop change behalten
  className="w-full"
>
  <img
    ref={imgRef}
    alt="Upload preview"
    src={preview}
    style={{ maxWidth: '100%', maxHeight: '300px' }}
  />
</ReactCrop>

// Preview vor Upload zur Qualitätskontrolle
{croppedImageUrl && (
  <div className="flex justify-center">
    <div className="relative w-32 h-32">
      <Image
        src={croppedImageUrl}
        alt="Cropped preview"
        fill
        className="object-cover rounded-full border-2 border-primary"
      />
    </div>
  </div>
)}

// Umkonfiguration erlaubt, wenn Result nicht zufriedenstellend
{croppedImageUrl && (
  <Button
    onClick={() => setCroppedImageUrl('')}
    variant="outline"
    disabled={uploading}
  >
    <X className="h-4 w-4" />
    Neu zuschneiden
  </Button>
)}
```

# SHELL OUTPUT / ERROR
```
Warning: Image appears stretched or distorted after crop
Warning: Quality degradation visible in cropped preview
```

# WEITERE RESOURCEN
- Dateipfad: `spikeball/src/components/profile/AvatarUpload.tsx`
- react-image-crop Documentation: <https://github.com/DominicTobias/react-image-crop>
- MDN Canvas Rendering: <https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage>
---