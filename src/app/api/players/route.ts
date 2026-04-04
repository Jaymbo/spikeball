import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/players - List all players
export async function GET() {
  try {
    const playersRaw = await db.player.findMany({
      orderBy: { eloRating: "desc" },
      include: {
        _count: {
          select: { eloChanges: true },
        },
      },
    });

    const players = playersRaw
      .filter((player) => player.name.toLowerCase() !== "root");

    return NextResponse.json(players);
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}

// POST /api/players - Create a new player
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json(
        { error: "Nur Admins dürfen Spieler hinzufügen" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    if (trimmedName.toLowerCase() === "root") {
      return NextResponse.json(
        { error: "Dieser Name ist reserviert" },
        { status: 409 }
      );
    }

    // Check if player already exists
    const existing = await db.player.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Player already exists" },
        { status: 409 }
      );
    }

    const userModel = (db as any).user;
    if (!userModel) {
      return NextResponse.json(
        { error: "User model not available" },
        { status: 500 }
      );
    }

    const existingUser = await userModel.findUnique({
      where: { username: trimmedName },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Benutzername existiert bereits" },
        { status: 409 }
      );
    }

    const [user, player] = await db.$transaction([
      userModel.create({
        data: {
          username: trimmedName,
          passwordHash: hashPassword("12345678"),
          isAdmin: false,
          requiresPasswordChange: true,
        },
      }),
      db.player.create({
        data: { name: trimmedName },
      }),
    ]);

    await db.$executeRaw`
      UPDATE "Player"
      SET "userId" = ${user.id}, "updatedAt" = datetime('now')
      WHERE id = ${player.id}
    `;

    return NextResponse.json(
      {
        ...player,
        message: "Spieler erstellt. Standardpasswort: 12345678",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating player:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Spielers" },
      { status: 500 }
    );
  }
}

// PATCH /api/players - Rename a player or reset password (admin)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { id, name, resetPassword } = body;

    if (!user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    const player = await db.player.findUnique({
      where: { id },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Reset password (admin only)
    if (resetPassword) {
      if (!user?.isAdmin) {
        return NextResponse.json(
          { error: "Admin required" },
          { status: 403 }
        );
      }

      const playerWithUser = player as any;
      if (!playerWithUser.userId) {
        return NextResponse.json(
          { error: "Cannot reset password for player without user account" },
          { status: 400 }
        );
      }

      const temporaryPassword = "12345678";

      await db.$executeRaw`
        UPDATE "User" SET "passwordHash" = ${hashPassword(temporaryPassword)}, "requiresPasswordChange" = 1, "updatedAt" = datetime('now')
        WHERE id = ${playerWithUser.userId}
      `;

      return NextResponse.json({
        success: true,
        message: "Passwort wurde auf 12345678 zurückgesetzt",
        temporaryPassword,
      });
    }

    // Rename player
    if (name) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Name is required" },
          { status: 400 }
        );
      }

      const trimmedName = name.trim();

      if (trimmedName.toLowerCase() === "root") {
        return NextResponse.json(
          { error: "Dieser Name ist reserviert" },
          { status: 409 }
        );
      }

      const playerUserRows = await db.$queryRaw<Array<{ userId: string | null }>>`
        SELECT "userId"
        FROM "Player"
        WHERE id = ${id}
        LIMIT 1
      `;

      const playerUserId = playerUserRows?.[0]?.userId ?? null;

      if (!user.isAdmin && playerUserId !== user.userId) {
        return NextResponse.json(
          { error: "Du darfst nur deinen eigenen Spielernamen ändern" },
          { status: 403 }
        );
      }

      const existing = await db.player.findUnique({
        where: { name: trimmedName },
      });

      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: "Name already exists" },
          { status: 409 }
        );
      }

      const userModel = (db as any).user;
      if (userModel) {
        const existingUser = await userModel.findUnique({
          where: { username: trimmedName },
        });

        if (existingUser && existingUser.id !== playerUserId) {
          return NextResponse.json(
            { error: "Benutzername existiert bereits" },
            { status: 409 }
          );
        }
      }

      await db.$transaction(async (tx) => {
        await tx.player.update({
          where: { id },
          data: { name: trimmedName },
        });

        if (playerUserId) {
          await tx.$executeRaw`
            UPDATE "User"
            SET "username" = ${trimmedName}, "updatedAt" = datetime('now')
            WHERE id = ${playerUserId}
          `;
        }
      });

      const updatedPlayer = await db.player.findUnique({ where: { id } });
      return NextResponse.json(updatedPlayer);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json(
      { error: "Failed to update player" },
      { status: 500 }
    );
  }
}

// DELETE /api/players?id=xxx - Delete a player
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json(
        { error: "Nur Admins dürfen Spieler löschen" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
    }

    const player = await db.player.findUnique({
      where: { id },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const playerAny = player as any;

    if (player.name.toLowerCase() === "root") {
      return NextResponse.json({ error: "Root kann nicht gelöscht werden" }, { status: 403 });
    }

    // Check if player has games
    const gamesCount = await db.game.count({
      where: {
        OR: [
          { team1Player1Id: id },
          { team1Player2Id: id },
          { team2Player1Id: id },
          { team2Player2Id: id },
        ],
      },
    });

    if (gamesCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete player with ${gamesCount} game(s). Delete games first.` },
        { status: 409 },
      );
    }

    await db.$transaction(async (tx) => {
      await tx.eloChange.deleteMany({ where: { playerId: id } });
      await tx.player.delete({ where: { id } });

      if (playerAny.userId) {
        await tx.$executeRaw`
          DELETE FROM "User"
          WHERE id = ${playerAny.userId}
        `;
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting player:", error);
    return NextResponse.json({ error: "Failed to delete player" }, { status: 500 });
  }
}
