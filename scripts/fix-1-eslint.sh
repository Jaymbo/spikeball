"#!/bin/bash
# Step 1: Fix ESLint configuration
BACKUP_DIR=\".backup-$(date +%Y%m%d-%H%M%S)\"
mkdir -p \"$BACKUP_DIR\"
cp eslint.config.mjs \"$BACKUP_DIR/\"

cat > eslint.config.mjs << 'EOF'
import nextCoreWebVitals from \"eslint-config-next/core-web-vitals\";
import nextTypescript from \"eslint-config-next/typescript\";
import { dirname } from \"path\";
import { fileURLToPath } from \"url\";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      \"@typescript-eslint/no-explicit-any\": \"error\",
      \"@typescript-eslint/no-unused-vars\": [\"warn\", { argsIgnorePattern: \"^_\", varsIgnorePattern: \"^_\" }],
      \"@typescript-eslint/no-non-null-assertion\": \"warn\",
      \"@typescript-eslint/ban-ts-comment\": [\"warn\", { \"ts-ignore\": \"allow-with-description\", \"ts-nocheck\": true }],
      \"@typescript-eslint/consistent-type-imports\": [\"warn\", { prefer: \"type-imports\", disallowTypeAnnotations: false }],
      \"react-hooks/exhaustive-deps\": \"warn\",
      \"react-hooks/rules-of-hooks\": \"error\",
      \"react/react-in-jsx-scope\": \"off\",
      \"react/prop-types\": \"off\",
      \"react/display-name\": \"off\",
      \"react/no-unescaped-entities\": \"warn\",
      \"no-console\": [\"warn\", { allow: [\"warn\", \"error\"] }],
      \"@next/next/no-img-element\": \"warn\",
      \"@next/next/no-html-link-for-pages\": \"warn\",
      \"prefer-const\": \"warn\",
      \"no-var\": \"error\",
      \"eqeqeq\": [\"error\", \"always\"],
      \"curly\": [\"error\", \"all\"],
      \"no-throw-literal\": \"error\",
    },
  },
  {
    ignores: [\"node_modules/**\", \".next/**\", \"out/**\", \"build/**\", \"next-env.d.ts\", \"examples/**\", \"skills\", \"*.config.js\", \"*.config.mjs\"]
  }
];

export default eslintConfig;
EOF

echo \"✅ ESLint fixed\"
echo \"Backup: $BACKUP_DIR\"
"