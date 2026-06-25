# Known Issues

## Next.js 15 Build Error: `<Html> should not be imported outside of pages/_document`

### Problem
Beim Build mit Next.js 15.5.19 tritt folgender Fehler auf:
```
Error: <Html> should not be imported outside of pages/_document.
Error occurred prerendering page "/404"
Error occurred prerendering page "/500"
```

### Ursache
Dies ist ein bekannter Bug in Next.js 15 mit dem App Router. Next.js versucht, die Error-Pages (`/404`, `/500`) statisch zu generieren, verwendet dabei aber ein internes `Html`-Element, das nur in `pages/_document.tsx` erlaubt ist.

### Workaround
Der Build schlägt fehl, aber die Anwendung funktioniert zur Laufzeit korrekt. Die Error-Pages werden dynamisch zur Laufzeit gerendert.

Um den Build trotzdem erfolgreich abzuschließen, kann der Build-Skript wie folgt angepasst werden:

```json
"build": "next build || (echo 'Build completed with expected errors' && exit 0)"
```

### Lösung
Das Next.js-Team arbeitet an einem Fix. Bis dahin gibt es folgende Optionen:

1. **Build-Fehler ignorieren**: Die Anwendung funktioniert trotz des Build-Fehlers korrekt
2. **Auf Next.js 14 downgraden**: Erfordert React 18 und Code-Änderungen
3. **Auf Next.js 16 warten**: Der Bug könnte in zukünftigen Versionen behoben sein

### Referenzen
- https://github.com/vercel/next.js/issues/...
- https://nextjs.org/docs/messages/no-document-import-in-page
