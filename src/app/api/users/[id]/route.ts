import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Benutzer-ID erforderlich" }, { status: 400 });
  }

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const [user, friendshipsSent, friendshipsReceived, totalGames, recentGames, isAdmin] = await Promise.all([
      db.user.findUnique({
        where: { id },
        include: { player: true }
      }),
      db.friendship.findMany({
        where: {
          requesterId: id,
          status: "accepted"
        }
      }),
      db.friendship.findMany({
        where: {
          receiverId: id,
          status: "accepted"
        }
      }),
      db.game.count({
        where: {
          OR: [
            { team1Player1Id: id },
            { team1Player2Id: id },
            { team2Player1Id: id },
            { team2Player2Id: id }
          ]
        }
      }),
      db.game.findMany({
        where: {
          OR: [
            { team1Player1Id: id },
            { team1Player2Id: id },
            { team2Player1Id: id },
            { team2Player2Id: id }
          ]
        },
        orderBy: { playedAt: "desc" },
        take: 10,
        include: {
          team1Player1: { select: { name: true, id: true } },
          team1Player2: { select: { name: true, id: true } },
          team2Player1: { select: { name: true, id: true } },
          team2Player2: { select: { name: true, id: true } }
        }
      }),
      db.user.findUnique({
        where: { id: currentUser.userId },
        select: { isAdmin: true }
      })
    ]);

    if (!user || !user.player) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    const player = user.player;

    const isFriend = await db.friendship.findFirst({
      where: {
        OR: [
          { requesterId: currentUser.userId, receiverId: id },
          { requesterId: id, receiverId: currentUser.userId }
        ],
        status: "accepted"
      }
    }) !== null;

    const friendRequest = await db.friendship.findFirst({
      where: {
        requesterId: currentUser.userId,
        receiverId: id
      }
    });
    const friendRequestStatus = friendRequest?.status ?? null;

    // Time range filter for games
    const timeRange = req.nextUrl.searchParams.get("timeRange") || "allTime";
    let startDate: Date | null = null;
    
    if (timeRange === "month") {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "3months") {
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "year") {
      startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    }

    const where: Prisma.GameWhereInput = {
      OR: [
        { team1Player1Id: player.id },
        { team1Player2Id: player.id },
        { team2Player1Id: player.id },
        { team2Player2Id: player.id }
      ],
      ...(startDate && { playedAt: { gte: startDate } }),
    };

    const games = await db.game.findMany({
      where,
      orderBy: { playedAt: "asc" },
      include: {
        eloChanges: {
          where: { playerId: player.id }
        }
      }
    });

    // Calculate ELO history
    const eloHistory = games.map((game) => {
      const eloChange = game.eloChanges.find((e) => e.playerId === player.id);
      return {
        date: game.playedAt,
        rating: eloChange?.newRating || 1000,
        change: eloChange?.change || 0,
        gameId: game.id
      };
    }).reverse();

    // Add initial rating if no games
    if (eloHistory.length === 0) {
      eloHistory.push({
        date: new Date(user.createdAt),
        rating: 1000,
        change: 0,
        gameId: "initial"
      });
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      player: {
        id: player.id,
        name: player.name,
        eloRating: player.eloRating,
        gamesPlayed: player.gamesPlayed,
        wins: player.wins,
        losses: player.losses
      },
      createdAt: user.createdAt,
      isAdmin: isAdmin?.isAdmin,
      friendCount: friendshipsSent.length + friendshipsReceived.length,
      isFriend,
      friendRequestStatus,
      recentGames,
      eloHistory,
      timeRange
    });

  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Fehler beim Laden des Profils" }, { status: 500 });
  }
}