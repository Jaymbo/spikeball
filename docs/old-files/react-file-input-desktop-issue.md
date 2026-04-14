---
title: React File Input Desktop Issue
tags: [react, typescript, file-upload, desktop, browser-compatibility]
---
# PROBLEM
Das Standard-Datei-Input-Element (`<input type="file">`) verhält sich in Desktop-Browsern inkonsistent und startet unter bestimmten Umständen keinen Dateiauswahl-Dialog, wenn es programmatisch über eine Ref angeklickt wird, besonders wenn es hidden ist.

# LÖSUNG
1. Verwende `display: none` statt dem `hidden` Attribut für das Input-Element
2. Erforsche alternative Upload-Methoden für kritische Upload-Szenarien
3. Implementieren Sie robustes Fehler-Handling und Benutzer-Feedback

# CODE / COMMANDS
```tsx
// ❌ Problem: hidden attribut verhindert Programmatische Events
<input
  ref={fileInputRef}
  type="file"
  hidden  // Dies kann das Programmatische click() verhindern
  accept="image/jpeg,image/jpg,image/png,image/webp"
  onChange={handleFileSelect}
/>

// ✅ Lösung: display: none CSS Klasse
<input
  ref={fileInputRef}
  type="file"
  className="hidden"  // Shadcn/ui Klasse - funktioniert zuverlässiger
  accept="image/jpeg,image/jpg,image/png,image/webp"
  onChange={handleFileSelect}
/>

// Trigger über Button
<Button
  onClick={() => fileInputRef.current?.click()}
  variant="outline"
  className="flex items-center gap-2 w-full"
>
  <Upload className="h-4 w-4" />
  Bild auswählen
</Button>
```

# SHELL OUTPUT / ERROR
```
Error: Cannot read properties of null (reading 'click')
Or: File selection dialog does not open on desktop browsers
```

# WEITERE RESOURCEN
- Dateipfad: `spikeball/src/components/profile/AvatarUpload.tsx`
- MDN Web Docs: <https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file>
- React Issue Discussion about hidden file inputs
---