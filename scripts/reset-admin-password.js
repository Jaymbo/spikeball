const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Hash password mit der gleichen Methode wie die App
function hashPassword(password) {
  return crypto
    .pbkdf2Sync(password, 'spikeball-salt', 1000, 64, 'sha512')
    .toString('hex');
}

async function resetAdminPassword(newPassword) {
  console.log('=== Admin-Passwort zurücksetzen ===');

  try {
    // Admin-User finden
    const adminUser = await prisma.user.findFirst({
      where: { isAdmin: true },
    });

    if (!adminUser) {
      console.log('❌ Kein Admin-User gefunden!');
      console.log('');
      console.log('Du musst zuerst einen Admin-User erstellen.');
      return;
    }

    console.log(`👤 Admin-User gefunden: ${adminUser.username}`);
    console.log(`🔧 Setze neues Passwort...`);

    // Neues Passwort hashen (mit der gleichen Methode wie die App)
    const passwordHash = hashPassword(newPassword);

    // Passwort aktualisieren
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        passwordHash: passwordHash,
        requiresPasswordChange: false,
      },
    });

    console.log('✅ Admin-Passwort erfolgreich zurückgesetzt!');
    console.log('');
    console.log('📝 Login-Daten:');
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Passwort: ${newPassword}`);
    console.log('');
    console.log('🚀 Du kannst dich jetzt einloggen!');

  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Passwort aus Kommandozeile oder Standard
const newPassword = process.argv[2] || 'admin123';

if (newPassword.length < 6) {
  console.log('❌ Passwort muss mindestens 6 Zeichen lang sein!');
  process.exit(1);
}

resetAdminPassword(newPassword);