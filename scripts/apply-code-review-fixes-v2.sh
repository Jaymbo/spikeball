#!/bin/bash
# Apply critical code review fixes

set -e  # Beende bei Fehlern

echo "=== CODE REVIEW FIXES - 2025-01-18 ==="
echo ""

# Backup erstellen
echo "[1/5] Creating backup..."
BACKUP_DIR=".backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp eslint.config.mjs "$BACKUP_DIR/"
cp tsconfig.json "$BACKUP_DIR/"
echo "Backup created at: $BACKUP_DIR"
echo ""

# ESLint Config ersetzen
echo "[2/5] Updating ESLint config..."
cat > eslint.config.mjs << 'EOF'
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // TypeScript Rules - STRICT MODE
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/ban-ts-comment": ["warn", {
        "ts-ignore": "allow-with-description",
        "ts-nocheck": true
      }],
      "@typescript-eslint/consistent-type-imports": ["warn", {
        prefer: "type-imports",
        disallowTypeAnnotations: false,
      }],
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "interface",
          format: ["PascalCase"],
          custom: {
            regex: "^I[A-Z]",
            match: false
          }
        }
      ],
      
      // React Rules
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react/react-in-jsx-scope": "off", 
      "react/prop-types": "off", 
      "react/display-name": "off",
      "react/no-unescaped-entities": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      
      // Next.js Rules
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      
      // General Rules
      "prefer-const": "warn",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "no-throw-literal": "error",
    },
  },
  {
    ignores: [
      "node_modules/**", 
      ".next/**", 
      "out/**", 
      "build/**", 
      "next-env.d.ts", 
      "examples/**",
      "skills",
      "*.config.js",
      "*.config.mjs",
    ]
  }
];

export default eslintConfig;
EOF
echo "ESLint config updated."
echo ""

# TypeScript Config patchen (mit jq, falls vorhanden, sonst sed)
echo -e "[3/5] Updating TypeScript config..."
if command -v jq &> /dev/null; then
    jq '.compilerOptions.noImplicitAny = true |
        .compilerOptions.noImplicitReturns = true |
        .compilerOptions.noUnusedLocals = true |
        .compilerOptions.noUnusedParameters = true |
        .compilerOptions.noFallthroughCasesInSwitch = true |
        .compilerOptions.target = "ES2022"' tsconfig.json > tsconfig.json.tmp
    mv tsconfig.json.tmp tsconfig.json
else
    # Fallback: Manual replacement mit sed
    sed -i 's/"noImplicitAny": false/"noImplicitAny": true/g' tsconfig.json
    echo "  Using sed fallback. Install jq for better JSON editing."
fi
echo "TypeScript config updated."
echo ""

# Typos korrigieren
echo "[4/5] Fixing German typos in PlayerProfile component..."
if [ -f "src/components/profile/PlayerProfile.tsx" ]; then
    cp src/components/profile/PlayerProfile.tsx "$BACKUP_DIR/PlayerProfile.tsx.backup"
    
    sed -i 's/Wird abgebrochen\.\.\./Wird abgebrochen.../g' src/components/profile/PlayerProfile.tsx
    sed -i 's/Wird gesendet\.\.\./Wird gesendet.../g' src/components/profile/PlayerProfile.tsx
    sed -i 's/Freund hinzufgen/Freund hinzufügen/g' src/components/profile/PlayerProfile.tsx
    
    echo "Typos fixed."
else
    echo "WARNING: PlayerProfile.tsx not found."
fi
echo ""

# Debug-Logs auskommentieren
echo "[5/5] Commenting out debug logs..."
for file in "src/app/api/players/[id]/route.ts" "src/components/profile/PlayerProfile.tsx"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/$(basename $file).log-backup"
        sed -i 's|^.*console\.log("\(Debug\|API\|PlayerProfile\)|// DEBUG: \0|g' "$file"
        echo " - Processed: $file"
    fi
done
echo ""

echo "=== DONE ==="
echo ""
echo "Next steps:"
echo "1. Check: git diff"
echo "2. Run: npm run build (will show TS errors now)"
echo "3. Review and fix errors"
echo ""
echo "Backup: $BACKUP_DIR"

exit 0