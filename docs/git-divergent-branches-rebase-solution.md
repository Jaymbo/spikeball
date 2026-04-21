---
title: Git Divergent Branches Rebase Solution
tags: [git, version-control, rebase, merge-conflict]
---
# PROBLEM
Nach `git stash apply` und lokalen Änderungen wird `git push` rejected (non-fast-forward). `git pull` scheitert mit "divergent branches" und fordert auf, eine reconciliation strategy zu wählen.

# LÖSUNG
1. Lokale Änderungen committen
2. `git pull --rebase` ausführen (rebase statt merge)
3. `git push` ausführen

# CODE / COMMANDS
```bash
git add -A
git commit -m "Apply stash changes"
git pull --rebase
git push
```

# SHELL OUTPUT / ERROR
```
! [rejected]        dev -> dev (non-fast-forward)
error: failed to push some refs to 'https://github.com/Jaymbo/spikeball.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. If you want to integrate the remote changes,
hint: use 'git pull' before pushing again.

fatal: Need to specify how to reconcile divergent branches.
```

# WEITERE RESOURCEN
- Git Documentation: https://git-scm.com/docs/git-pull
- Note about fast-forwards: `git push --help`
---