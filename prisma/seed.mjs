import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const db = new PrismaClient();

function hashPassword(password) {
  return crypto
    .pbkdf2Sync(password, "spikeball-salt", 1000, 64, "sha512")
    .toString("hex");
}

async function seed() {
  try {
    const existingRoot = await db.user.findUnique({
      where: { username: "root" },
    });

    if (existingRoot) {
      console.warn("Root user already exists");
      process.exit(0);
    }

    const rootUser = await db.user.create({
      data: {
        username: "root",
        passwordHash: hashPassword("root"),
        isAdmin: true,
        requiresPasswordChange: false,
      },
    });

    console.warn("Root admin user created:", rootUser.id);
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
