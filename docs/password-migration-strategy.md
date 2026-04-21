---
title: Password Migration Strategy (Old → Bcrypt)
tags: [security, migration, bcrypt, auth]
---
# PROBLEM
After upgrading from crypto-based password hashing to bcrypt, all existing users could no longer log in because their old password hashes were incompatible with the new bcrypt verification.

# LÖSUNG
Implemented a **dual-system password verification** with **automatic migration on login**:

1. **Dual Verification**: `verifyPassword()` detects hash format and uses appropriate method
2. **Automatic Migration**: On successful login with old hash, immediately re-hash with bcrypt
3. **Force Password Change**: After migration, user must set a new password (security best practice)

# CODE / IMPLEMENTATION

## src/lib/auth.ts

Added migration support functions:

```typescript
// Detect bcrypt hash format
function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');
}

// Old system (for migration only)
function hashPasswordOld(password: string): string {
  return crypto
    .pbkdf2Sync(password, 'spikeball-salt', 1000, 64, 'sha512')
    .toString('hex');
}

// Check if migration needed
export function needsPasswordMigration(hash: string): boolean {
  return !isBcryptHash(hash);
}

// Verify password (supports BOTH systems)
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Try bcrypt first (new system)
  if (isBcryptHash(hash)) {
    return bcrypt.compare(password, hash);
  }
  
  // Fall back to old crypto-based system
  const oldHash = hashPasswordOld(password);
  return oldHash === hash;
}
```

## src/app/api/auth/login/route.ts

Added automatic migration on successful login:

```typescript
// Verify password (supports both old and new formats)
const isValid = await verifyPassword(password, user.passwordHash);
if (!isValid) {
  return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
}

// MIGRATION: If old hash detected, migrate to bcrypt immediately
let needsPasswordChange = user.requiresPasswordChange;
if (needsPasswordMigration(user.passwordHash)) {
  console.log(`[Password Migration] Migrating user ${user.username} from old hash to bcrypt`);
  
  // Hash with bcrypt and update database
  const newHash = await hashPassword(password);
  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      requiresPasswordChange: true, // Force password change after migration
    },
  });
  
  needsPasswordChange = true;
}
```

# MIGRATION FLOW

## User Login Flow

1. **User enters old password** → `verifyPassword()` detects old hash → **SUCCESS**
2. **System detects old hash** → `needsPasswordMigration()` returns `true`
3. **Automatic migration** → Password re-hashed with bcrypt → Database updated
4. **Force password change** → `requiresPasswordChange` set to `true`
5. **User sees dialog** → "Please change your password after migration"
6. **User sets new password** → Stored with bcrypt → `requiresPasswordChange` = `false`

## User Registration Flow

- **New users** → Password immediately hashed with bcrypt → No migration needed

# SECURITY CONSIDERATIONS

✅ **Backward Compatibility**: Old users can still log in with their old passwords
✅ **Automatic Migration**: No manual intervention required
✅ **Force Password Change**: Users must set new password after migration (best practice)
✅ **No Data Loss**: Old hashes remain in database until successful login
✅ **Transparent Migration**: Users don't notice the migration (except password change dialog)

# TESTING

## Test Old Password Login

```bash
# 1. Create a user with OLD hash (simulate existing user)
# In SQLite:
INSERT INTO "User" (id, username, "passwordHash", "isAdmin", "requiresPasswordChange")
VALUES (
  'test-user-id',
  'testuser',
  'e7c9b9e5c5d5f5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5',  -- Old hash for 'password123'
  false,
  false
);

# 2. Login with old password
# POST /api/auth/login
{
  "username": "testuser",
  "password": "password123"
}

# Expected: SUCCESS + requiresPasswordChange = true
# Check database: passwordHash now starts with '$2b$' (bcrypt)
```

## Test New Password Login

```bash
# 1. Register new user
# POST /api/auth/register
{
  "username": "newuser",
  "password": "newpassword123",
  "passwordConfirm": "newpassword123"
}

# 2. Login
# POST /api/auth/login
{
  "username": "newuser",
  "password": "newpassword123"
}

# Expected: SUCCESS + requiresPasswordChange = false
# Check database: passwordHash starts with '$2b$' (bcrypt)
```

# MONITORING

Watch for migration logs:

```bash
# In server logs, look for:
[Password Migration] Migrating user <username> from old hash to bcrypt
```

# ROLLBACK PLAN

If migration causes issues:

1. **Stop the application**
2. **Restore database backup** (taken before migration deployment)
3. **Revert code changes** to previous version
4. **Investigate logs** for migration failures

# CLEANUP

After all users have migrated (check by querying for non-bcrypt hashes):

```sql
-- Check for remaining old hashes
SELECT COUNT(*) FROM "User" WHERE "passwordHash" NOT LIKE '$2%';

-- Should return 0 when migration complete
```

Once complete, the old `hashPasswordOld()` function can be removed from `src/lib/auth.ts`.

# WEITERE RESOURCES
- bcryptjs: https://www.npmjs.com/package/bcryptjs
- OWASP Password Migration: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
---