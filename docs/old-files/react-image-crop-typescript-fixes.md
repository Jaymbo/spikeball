"---\ntitle: React Image Crop TypeScript Fixes\ntags: [react-image-crop, typescript, aspect-ratio, css-import, type-errors]\n---\n\n# PROBLEM\nTypeScript meldet Fehler beim verwendeten typing von `react-image-crop`:
1. `aspect` Property existiert nicht im `Crop` type (Error TS2353)
2. CSS Import erzeugt Side-Effect Import Error (Error TS2882)

## Ursache
- `aspect` gehört zu den Props der ReactCrop Komponente, nicht zum crop state object
- Bibliothek enthält keine TypeScript-Deklaration für ihre CSS-Datei. Das CSS Import führt zu einem Unrecognized Module Fehler.

# LÖSUNG\n1. Entferne das `aspect` Property aus allen crop state Objekten.\n2. Übergebe `aspect={1}` direkt als Prop an die <ReactCrop> Komponente.\n3. Den CSS Import entweder via // @ts-ignore, require, oder global integration.";

# CODE / COMMANDS

```tsx
// ❌ FALSCH: aspect im crop object
const [crop, setCrop] = useState<Crop>({
  unit: '%',
  width: 100,
  height: 100,
  aspect: 1,  // TypeScript Error: Property 'aspect' does not exist
});

// ✅ KORREKT: aspect als Prop an ReactCrop übergeben
const [crop, setCrop] = useState<Crop>({
  unit: '%',
  width: 80,
  height: 80,
});

// ✅ KORREKT Benutzung von ReactCrop
<ReactCrop
  crop={crop}
  onChange={(_, percentCrop) => setCrop(percentCrop)}
  onComplete={(c) => setCompletedCrop(c)}
  aspect={1}  // GETRENNT als Property
  keepSelection
  className="w-full"
>
  <img
    ref={imgRef}
    alt="Upload preview"
    src={preview}
    style={{ maxWidth: '100%', maxHeight: '300px' }}
  />
</ReactCrop>

// ❌ CSS Import Fehler
import "react-image-crop/dist/ReactCrop.css";
// TypeScript Error: Cannot find module or type declarations for side-effect import

// ✅ LÖSUNG 1: tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true
  },
  "include": [...]
}

// ✅ LÖSUNG 2: // @ts-ignore im import
// @ts-ignore
import "react-image-crop/dist/ReactCrop.css";

// ✅ LÖSUNG 3: Globales CSS (vorzugsweise)
// Füge diese Zeile zu src/app/globals.css hinzu (Anfang):
// @import "react-image-crop/dist/ReactCrop.css";
// und entferne den import aus der Component Datei
```

# SHELL OUTPUT / ERROR
```
TS2353: Object literal may only specify known properties, and 'aspect' does not exist in type 'Crop | (() => Crop)'.
TS2353: Object literal may only specify known properties, and 'aspect' does not exist in type 'SetStateAction<Crop>'.
TS2882: Cannot find module or type declarations for side-effect import of 'react-image-crop/dist/ReactCrop.css'.
```

# WEITERE RESOURCEN
- Dateipfad: `spikeball/src/components/profile/AvatarUpload.tsx`
- react-image-crop GitHub Issues: <https://github.com/DominicTobias/react-image-crop/issues>
- TypeScript Side-Effect Imports: <https://www.typescriptlang.org/docs/handbook/modules/guides/ambient-modules.html>
---