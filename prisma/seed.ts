import { db } from './src/lib/db';
import { hashPassword } from './src/lib/auth';

async function seed() {
  try {
    // Check if root user already exists
    const existingRoot = await db.user.findUnique({
      where: { username: 'root' },
    });

    if (existingRoot) {
      console.log('Root user already exists');
      return;
    }

    // Create root admin user
    const rootUser = await db.user.create({
      data: {
        username: 'root',
        passwordHash: hashPassword('root'),
        isAdmin: true,
        requiresPasswordChange: false,
      },
    });

    console.log('Root admin user created:', rootUser.id);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
