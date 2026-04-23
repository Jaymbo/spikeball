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

    // DEBUG: Log received data
    console.log("=== PROFILE UPLOAD DEBUG START ===");
    console.log("Received file:", file);
    console.log("File name:", file?.name);
    console.log("File size:", file?.size);
    console.log("File type:", file?.type);
    console.log("Player ID:", playerId);

    if (!file || !playerId) {
      console.error("ERROR: Missing file or playerId");
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
      console.error("ERROR: Player not found:", playerId);
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const isAdmin = session.isAdmin;
    const isOwnPlayer = player.userId === session.userId;

    if (!isAdmin && !isOwnPlayer) {
      console.error("ERROR: Forbidden - not admin or own player");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error("ERROR: File too large:", file.size);
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      console.error("ERROR: Invalid file type:", file.type);
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG and WebP allowed." },
        { status: 400 }
      );
    }

    // Create uploads directory if not exists
    const uploadDir = path.join("/home/server2/spikeball", "public", "uploads", "profiles");
    console.log("Upload directory:", uploadDir);
    console.log("Directory exists before mkdir?", existsSync(uploadDir));
    
    if (!existsSync(uploadDir)) {
      console.log("Creating directory...");
      await mkdir(uploadDir, { recursive: true });
      console.log("Directory exists after mkdir?", existsSync(uploadDir));
    }

    // Generate unique filename
    const ext = path.extname(file.name);
    const filename = `${player.id}-${Date.now()}${ext}`;
    const filepath = path.join(uploadDir, filename);
    console.log("Target filepath:", filepath);

    // Write file
    console.log("Starting file write...");
    const bytes = await file.arrayBuffer();
    console.log("ArrayBuffer size:", bytes.byteLength);
    const buffer = Buffer.from(bytes);
    console.log("Buffer size:", buffer.length);
    
    await writeFile(filepath, buffer);
    console.log("File write completed");
    console.log("File exists on disk after write?", existsSync(filepath));
    console.log("File size on disk:", existsSync(filepath) ? (await import('fs').then(fs => fs.statSync(filepath))).size : 'N/A');

    // Delete old profile picture if exists
    if (player.profilePicture) {
      const oldPath = path.join("/home/server2/spikeball", "public", player.profilePicture);
      console.log("Old profile picture path:", oldPath);
      if (existsSync(oldPath)) {
        try {
          await unlink(oldPath);
          console.log("Old profile picture deleted");
        } catch (error) {
          console.error("Failed to delete old profile picture:", error);
        }
      }
    }

    // Update player in database
    console.log("Updating database...");
    await db.player.update({
      where: { id: playerId },
      data: { profilePicture: `/uploads/profiles/${filename}` },
    });
    console.log("Database updated successfully");
    
    console.log("=== PROFILE UPLOAD DEBUG END ===");

    return NextResponse.json({
      success: true,
      path: `/uploads/profiles/${filename}`,
    });
  } catch (error) {
    console.error("=== UPLOAD ERROR ===");
    console.error("Upload error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack');
    console.error("=== END ERROR ===");
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}