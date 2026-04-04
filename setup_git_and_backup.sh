"#!/bin/bash
# ####################################################
# Git & GitHub Setup und Backup Script für Spikeball
# Erzeugt: $(date)
# ####################################################

LOG_FILE=\"setup_git_backup.log\"
BACKUP_DIR=\"spikeball_backup_$(date +%Y%m%d_%H%M%S)\"
GITHUB_REPO_REPLACEMENT=\"GITHUB_REPO_ZWISCHENSPEICHERTERN\"  # Ersetze dies später mit deinem GitHub Repo

echo \"=== Spikeball Git & GitHub Setup Script ===\" | tee $LOG_FILE
echo \"Log-Datei: $LOG_FILE\" | tee -a $LOG_FILE
echo \"Backup-Verzeichnis: $BACKUP_DIR\" | tee -a $LOG_FILE
echo \"================================\" | tee -a $LOG_FILE
echo \"\" | tee -a $LOG_FILE

# Schritt 1: Backup erstellen
echo \"[SCHRITT 1] Erstelle Backup...\" | tee -a $LOG_FILE
mkdir -p \"$BACKUP_DIR\" 2>/dev/null
if [ $? -eq 0 ]; then
    echo \"-> Backup-Verzeichnis erstellt\" | tee -a $LOG_FILE
else
    echo \"-> FEHLER: Konnte Backup-Verzeichnis nicht erstellen\" | tee -a $LOG_FILE
    exit 1
fi

# Alle relevanten Dateien kopieren
rsync -av --exclude='node_modules' --exclude='.next' --exclude='*.log' \
  --exclude='spikeball_backup_*' . \"$BACKUP_DIR/\" >> $LOG_FILE 2>&1
echo \"-> Backup abgeschlossen\" | tee -a $LOG_FILE
echo \"\" | tee -a $LOG_FILE

# Schritt 2: Git Initialisierung (falls noch nicht vorhanden)
echo \"[SCHRITT 2] Prüfe/Initialisiere Git...\" | tee -a $LOG_FILE
if [ ! -d \"./.git\" ]; then
    git init | tee -a $LOG_FILE
    echo \"-> Git Repository initialisiert\" | tee -a $LOG_FILE
else
    echo \"-> Git Repository existiert bereits\" | tee -a $LOG_FILE
fi
echo \"\" | tee -a $LOG_FILE

# Schritt 3: Alle Änderungen stagen
echo \"[SCHRITT 3] Stage alle Änderungen...\" | tee -a $LOG_FILE
git add -A >> $LOG_FILE 2>&1
echo \"-> Alle Dateien gestaged\" | tee -a $LOG_FILE
echo \"\" | tee -a $LOG_FILE

# Schritt 4: ersten Commit erstellen
echo \"[SCHRITT 4] Erstelle initialen Commit...\" | tee -a $LOG_FILE
COMMIT_MSG=\"Initial commit: Spikeball ELO System mit Friends Feature $(date +%Y-%m-%d)\"
git commit -m \"$COMMIT_MSG\" >> $LOG_FILE 2>&1
if [ $? -eq 0 ]; then
    echo \"-> Commit erfolgreich: $COMMIT_MSG\" | tee -a $LOG_FILE
else
    echo \"-> FEHLER: Commit fehlgeschlagen\" | tee -a $LOG_FILE
    echo \"-> Prüfe das Log: $LOG_FILE\" | tee -a $LOG_FILE
    exit 1
fi
echo \"\" | tee -a $LOG_FILE

# Schritt 5: GitHub Repo Setup (manuelle Schritte erforderlich)
echo \"[SCHRITT 5] GitHub Repository Setup:\" | tee -a $LOG_FILE
echo \"\" | tee -a $LOG_FILE
echo \"AUSSTEHENDE MANUELLE SCHRITTE:\" | tee -a $LOG_FILE
echo \"\" | tee -a $LOG_FILE
echo \"1. Gehe zu https://github.com und erstelle ein NEUES Repository\" | tee -a $LOG_FILE
echo \"2. Repo Name z.B.: spikeball-elo\" | tee -a $LOG_FILE
echo \"3. WICHTIG: Wähle 'Public' oder 'Private' als du magst\" | tee -a $LOG_FILE
echo \"4. WICHTIG: Mache KEIN 'Add README.md' oder похожие Optionen\" | tee -a $LOG_FILE
echo \"5. Kopiere die GitHub Repository URL (z.B. https://github.com/deinuser/spikeball-elo.git)\" | tee -a $LOG_FILE
echo \"\" | tee -a $LOG_FILE
echo \"6. DANACH führe diese Befehle aus:\" | tee -a $LOG_FILE
echo \"   git remote add origin DEINE_GITHUB_REPO_URL\" | tee -a $LOG_FILE
echo \"   git push -u origin main\" | tee -a $LOG_FILE
echo \"\" | tee -a $LOG_FILE

# Automatischer Setup-Versuch (wenn Repo URL vorhanden wäre)
if [ \"$GITHUB_REPO_REPLACEMENT\" != \"GITHUB_REPO_ZWISCHENSPEICHERTERN\" ]; then
    echo \"[SCHRITT 5b] Automatisches GitHub Setup...\" | tee -a $LOG_FILE
    git remote add origin \"$GITHUB_REPO_REPLACEMENT\" >> $LOG_FILE 2>&1 || \
      git remote set-url origin \"$GITHUB_REPO_REPLACEMENT\" >> $LOG_FILE 2>&1
    echo \"-> Remote gesetzt zu: $GITHUB_REPO_REPLACEMENT\" | tee -a $LOG_FILE
    
    git branch -M main >> $LOG_FILE 2>&1
    echo \"-> Branch zu 'main' umbenannt\" | tee -a $LOG_FILE
    
    git push -u origin main >> $LOG_FILE 2>&1
    if [ $? -eq 0 ]; then
        echo \"-> SUCCESS: Code wurde zu GitHub gepusht!\" | tee -a $LOG_FILE
    else
        echo \"-> FEHLER beim Push zu GitHub (Authentifizierungs-Problem?)\" | tee -a $LOG_FILE
        echo \"-> Prüfe das Log: $LOG_FILE\" | tee -a $LOG_FILE
    fi
else
    echo \"[SCHRITT 5b] Überspringe automatisches GitHub Setup (Repo URL nicht konfiguriert)\" | tee -a $LOG_FILE
fi
echo \"\" | tee -a $LOG_FILE

# Zusammenfassung
echo \"================================\" | tee -a $LOG_FILE
echo \"SETUP ZUSAMMENFASSUNG:\" | tee -a $LOG_FILE
echo \"\" | tee -a $LOG_FILE
echo \"✅ Backup: $BACKUP_DIR\" | tee -a $LOG_FILE
echo \"✅ Git Repository: Initialisiert\" | tee -a $LOG_FILE
echo \"✅ Initialer Commit: Erstellt\" | tee -a $LOG_FILE
echo \"📋 Log-Datei: $LOG_FILE\" | tee -a $LOG_FILE
echo \"\" | tee -a $LOG_FILE
echo \"NÄCHSTE SCHRITTE:\" | tee -a $LOG_FILE
echo \"------------------\" | tee -a $LOG_FILE
echo \"1. Prüfe den Log: cat $LOG_FILE\" | tee -a $LOG_FILE
echo \"2. Erstelle GitHub Repository (siehe oben)\" | tee -a $LOG_FILE
echo \"3. Setup GitHub Remote: git remote add origin DEINE_REPO_URL\" | tee -a $LOG_FILE
echo \"4. Push zu GitHub: git push -u origin main\" | tee -a $LOG_FILE
echo \"5. Überprüfe Backup: ls -la $BACKUP_DIR\" | tee -a $LOG_FILE
echo \"\" | tee -a $LOG_FILE
echo \"================================\" | tee -a $LOG_FILE

exit 0
"