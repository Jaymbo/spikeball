import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const userId1 = req.nextUrl.searchParams.get("user1");
  const userId2 = req.nextUrl.searchParams.get("user2");

  if (!userId1 && !userId2) {
    return NextResponse.json({ error: "Mind. 1 Benutzer-ID erforderlich" }, { status: 400 });
  }

  try {
    const user1Promise = userId1 ? db.user.findUnique({
      where: { id: userId1 },
      include: { player: true }
    }) : Promise.resolve(null);

    const user2Promise = userId2 ? db.user.findUnique({
      where: { id: userId2 },
      include: { player: true }
    }) : Promise.resolve(null);

    const [user1, user2] = await Promise.all([user1Promise, user2Promise]);

    const comparison: any = {};

    if (user1?.player) {
      comparison.user1 = {
        id: user1.id,
        username: user1.username,
        playerName: user1.player.name,
        eloRating: user1.player.eloRating,
        wins: user1.player.wins,
        losses: user1.player.losses,
        gamesPlayed: user1.player.gamesPlayed,
        winRate: user1.player.gamesPlayed > 0 ? 
                (user1.player.wins / user1.player.gamesPlayed) * 100 : 0
      };
    }

    if (user2?.player) {
      comparison.user2 = {
        id: user2.id,
        username: user2.username,
        playerName: user2.player.name,
        eloRating: user2.player.eloRating,
        wins: user2.player.wins,
        losses: user2.player.losses,
        gamesPlayed: user2.player.gamesPlayed,
        winRate: user2.player.gamesPlayed > 0 ? 
                (user2.player.wins / user2.player.gamesPlayed) * 100 : 0
      };
    }

    // Calculate performance vs each other
    if (comparison.user1 && comparison.user2) {
      const headToHeadGames = await db.game.findMany({
        where: {
          OR: [
            {
              team1Player1Id: user1!.player!.id,
              team2Player2Id: user2!.player!.id
            },
            {
              team1Player2Id: user1!.player!.id,
              team2Player1Id: user2!.player!.id
            },
            {
              team1Player1Id: user2!.player!.id,
              team2Player2Id: user1!.player!.id
            },
            {
              team1Player2Id: user2!.player!.id,
              team2Player1Id: user1!.player!.id
            }
          ]
        },
        orderBy: { playedAt: "desc" },
        take: 10
      });

      const user1Wins = headToHeadGames.filter((game) =>
        (game.team1Player1Id === user1!.player!.id && game.team1Score > game.team2Score) ||
        (game.team2Player2Id === user1!.player!.id && game.team2Score > game.team1Score) ||
        (game.team1Player2Id === user1!.player!.id && game.team1Score > game.team2Score) ||
        (game.team2Player1Id === user1!.player!.id && game.team2Score > game.team1Score)
      ).length;
      comparison.headToHead = {
        totalGames: headToHeadGames.length,
        user1Wins,
        user2Wins: headToHeadGames.length - user1Wins,
        games: headToHeadGames.map((g) => ({
          date: g.playedAt,
          team1: [g.team1Player1Id, g.team1Player2Id],
          team2: [g.team2Player1Id, g.team2Player2Id],
          score: [g.team1Score, g.team2Score]
        }))
      };
    }

    return NextResponse.json(comparison);
  } catch (error) {
    console.error("Error comparing users:", error);
    return NextResponse.json({ error: "Fehler beim Vergleich" }, { status: 500 });
  }
}