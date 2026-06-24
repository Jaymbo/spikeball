import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const playerId = formData.get("playerId") as string;

    if (!file || !playerId) {
      return NextResponse.json(
        { error: "File and playerId are required" },
        { status: 400 }
      );
    }

    // Authorization check: Only admin or own player
    const player = await db.player.findUnique({
      where: { id: playerId },
      include: { user: true },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const isAdmin = session.isAdmin;
    const isOwnPlayer = player.userId === session.userId;

    if (!isAdmin && !isOwnPlayer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG and WebP allowed." },
        { status: 400 }
      );
    }

    // Create uploads directory if not exists
    const uploadDir = path.join("/home/server2/spikeball", "public", "uploads", "profiles");
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const ext = path.extname(file.name);
    const filename = `${player.id}-${Date.now()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filepath, buffer);

    // Delete old profile picture if exists
    if (player.profilePicture) {
      const oldPath = path.join("/home/server2/spikeball", "public", player.profilePicture);
      if (existsSync(oldPath)) {
        try {
          await unlink(oldPath);
        } catch (error) {
          console.error("Failed to delete old profile picture:", error);
        }
      }
    }

    // Update player in database
    await db.player.update({
      where: { id: playerId },
      data: { profilePicture: `/uploads/profiles/${filename}` },
    });

    return NextResponse.json({
      success: true,
      path: `/uploads/profiles/${filename}`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}