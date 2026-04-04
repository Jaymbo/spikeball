#!/bin/bash
echo "=== Git Status ===" > /tmp/git_output.txt 2>&1
git status >> /tmp/git_output.txt 2>&1
echo "=== Git Output ==="
cat /tmp/git_output.txt