---h 
title: Profil-Einstellungen Implementierung
tags: [react, nextjs, typescript, profile, auth]
---

# PROBLEM
User wollte die Möglichkeit haben, im eigenen Profil Einstellungen aufzurufen, um den Namen und das Passwort zu ändern. Die vorherige Implementierung funktionierte nicht, da die API-Route keine PATCH-Methode hatte.

# LÖSUNG
1. Profil-Einstellungs-Dialog (`ProfileSettingsDialog.tsx`) erstellt mit Tabs für Profilbild, Name und Passwort
2. Settings-Button neben dem Avatar im Profil hinzugefügt (nur für eigenes Profil sichtbar)
3. Profilbild-Upload in die Einstellungen integriert (zuvor separater Dialog)
4. Bestehenden `ChangePasswordDialog` integriert
5. Namensänderung über API-Route `/api/players/[id]` mit PATCH-Methode

# CODE / COMMANDS
Die Datei `ProfileSettingsDialog.tsx` enthält drei Tabs:
- Tab "Profilbild": AvatarUpload-Komponente für Profilbild-Upload
- Tab "Name": Feld für neuen Namen mit Validierung (2-30 Zeichen)
- Tab "Passwort": Button öffnet `ChangePasswordDialog`

# SHELL OUTPUT / ERROR
Keine nennenswerten Fehler bei der Implementierung.

# WEITERE RESOURCEN
- `src/components/profile/ProfileSettingsDialog.tsx` (neu erstellt)
- `src/components/profile/PlayerProfile.tsx` (angepasst: Settings-Button + Dialog am Ende)
- `src/components/auth/ChangePasswordDialog.tsx` (bereits vorhanden)
- `/api/players/[id]` (API-Route für Namensänderung)