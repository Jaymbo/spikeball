---
title: Security Secrets Setup
tags: [security, auth, env]
---
# PROBLEM
Environment variables are required for security: JWT_SECRET for authentication and DATABASE_URL for the database connection. Without proper configuration, the application will fail to start or run in an insecure mode.

# LÖSUNG
1. Create a `.env.local` file in the project root
2. Add the required environment variables with secure values
3. Never commit `.env.local` or `.env` to git

# CODE / CONFIG
Create `.env.local` with the following content:

```bash
# Database
DATABASE_URL="file:./db/dev.db"

# JWT Secret - REQUIRED FOR PRODUCTION
# Generate a secure random string (at least 32 characters):
# Option 1: Node.js
npx uuid > JWT_SECRET.txt  (or copy the output)

# Option 2: OpenSSL
openssl rand -base64 32

# Then paste it here:
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-change-in-production"

# Auth Cookie Security (optional)
# Set to 'true' if behind reverse proxy with HTTPS
AUTH_COOKIE_SECURE="false"

# Environment
NODE_ENV="development"
```

# SECURITY NOTES
- JWT_SECRET MUST be at least 32 characters long
- Change JWT_SECRET immediately after initial setup in production
- Never share JWT_SECRET or commit to version control
- DATABASE_URL should use absolute paths in production

# MIGRATION REQUIREMENT
After upgrading from the old crypto-based password hashing to bcrypt, all existing users need to reset their passwords. The old password hashes are INSECURE and cannot be migrated automatically.

To force all users to change passwords on next login, run:
```sql
UPDATE User SET requiresPasswordChange = 1;
```
---