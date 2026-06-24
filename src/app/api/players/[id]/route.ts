import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth-Prüfung - Nur eingeloggte User dürfen Profile sehen
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const playerId = params.id;
    
    // Hole den aktuellen Player des eingeloggten Users
    const currentPlayer = await db.player.findFirst({
      where: { userId: currentUser.userId }
    });
    
    const currentPlayerId = currentPlayer?.id || null;
    
    // Validation
    if (!playerId || typeof playerId !== 'string') {
      console.error("[PlayerProfileAPI] Invalid playerId:", playerId);
      return NextResponse.json({ error: "Invalid playerId" }, { status: 400 });
    }

    // console.log(`[PlayerProfileAPI] Fetching data for player: ${playerId}`);

    const player = await db.player.findUnique({
      where: { id: playerId },
      include: {
        eloChanges: {
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            game: {
              include: {
                team1Player1: true,
                team1Player2: true,
                team2Player1: true,
                team2Player2: true,
              },
            },
          },
        },
        gamesTeam1P1: {
          orderBy: { playedAt: "desc" },
          take: 50,
          include: {
            team1Player1: true,
            team1Player2: true,
            team2Player1: true,
            team2Player2: true,
          },
        },
        gamesTeam1P2: {
          orderBy: { playedAt: "desc" },
          take: 50,
          include: {
            team1Player1: true,
            team1Player2: true,
            team2Player1: true,
            team2Player2: true,
          },
        },
        gamesTeam2P1: {
          orderBy: { playedAt: "desc" },
          take: 50,
          include: {
            team1Player1: true,
            team1Player2: true,
            team2Player1: true,
            team2Player2: true,
          },
        },
        gamesTeam2P2: {
          orderBy: { playedAt: "desc" },
          take: 50,
          include: {
            team1Player1: true,
            team1Player2: true,
            team2Player1: true,
            team2Player2: true,
          },
        },
      },
    });

    if (!player) {
      console.log(`[PlayerProfileAPI] Player not found: ${playerId}`);
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Combine all games and sort by playedAt
    const allGames = [
      ...player.gamesTeam1P1,
      ...player.gamesTeam1P2,
      ...player.gamesTeam2P1,
      ...player.gamesTeam2P2,
    ].sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());

    // Remove duplicates
    const uniqueGames = allGames.filter(
      (game, index, self) => index === self.findIndex((g) => g.id === game.id)
    );

    // console.log(`[PlayerProfileAPI] Found ${uniqueGames.length} unique games for ${playerId}`);

    // Check friendship status - OPTIMIZED: Include friendship ID for efficient operations
    let isFriend = false;
    let friendRequestType: string | null = null;
    let friendshipId: string | null = null;
    
    // DEBUG: Log what we are searching for
    // console.log(`[API Friendship Check] Searching for friendship between currentUser=${currentPlayerId} and viewedPlayer=${playerId}`);
    
    if (currentPlayerId && currentPlayerId !== playerId) {
      // CRITICAL FIX: Friendship uses USER IDs, but we have PLAYER IDs!
      // We need to fetch the User ID for both players first
      const [currentUserUser, viewedPlayerUser] = await Promise.all([
        db.player.findUnique({ where: { id: currentPlayerId }, select: { userId: true } }),
        db.player.findUnique({ where: { id: playerId }, select: { userId: true } })
      ]);
      
      const currentUserId = currentUserUser?.userId || null;
      const viewedUserId = viewedPlayerUser?.userId || null;
      
      // console.log(`[API Friendship Check] Mapped Player IDs to User IDs:`, {
      //   currentPlayerId,
      //   mappedToUserId: currentUserId,
      //   viewedPlayerId: playerId,
      //   mappedToUserId2: viewedUserId
      // });
      
      // Now search for friendship using the correct USER IDs
      // Only search if both user IDs are available
      let friendships: any[] = [];
      if (currentUserId && viewedUserId) {
        friendships = await db.friendship.findMany({
          where: {
            OR: [
              { requesterId: currentUserId, receiverId: viewedUserId },
              { requesterId: viewedUserId, receiverId: currentUserId }
            ]
          }
        });
      }
      
      // console.log(`[API Friendship Check] Found ${friendships.length} friendship(s):`, friendships);
      
      const friendship = friendships[0]; // Take the first one if any
      
      if (friendship) {
        friendshipId = friendship.id;
        isFriend = friendship.status === "accepted";
        
        // Compare with USER IDs, not Player IDs!
        if (friendship.status === "accepted") {
          friendRequestType = "accepted";
        } else if (friendship.requesterId === currentUserId) {
          friendRequestType = "outgoing"; // Current user sent the request
        } else if (friendship.requesterId === viewedUserId) {
          friendRequestType = "incoming"; // Other user sent the request
        }
      }
    }
    
    // Include isOwnProfile to avoid additional fetch
    const isOwnProfile = currentPlayerId === playerId;

    // DEBUG: Log the friendship status being returned
    // console.log(`[API] Returning friendship status for ${playerId}:`, {
    //   isFriend,
    //   friendRequestType,
    //   friendshipId,
    //   currentPlayerId,
    //   viewedPlayerId: playerId
    // });

    // Shape data with proper type conversions
    return NextResponse.json({
      player: {
        id: player.id,
        name: player.name,
        eloRating: Number(player.eloRating),
        gamesPlayed: player.gamesPlayed,
        wins: player.wins,
        losses: player.losses,
        profilePicture: player.profilePicture || null,
        createdAt: player.createdAt.toISOString(),
        lastPlayedAt: player.lastPlayedAt ? player.lastPlayedAt.toISOString() : null,
      },
      eloHistory: player.eloChanges.map((change) => ({
        id: change.id,
        previousRating: Number(change.previousRating),
        newRating: Number(change.newRating),
        change: Number(change.change),
        createdAt: change.createdAt.toISOString(),
        game: change.game ? {
          id: change.game.id,
          team1Player1: {
            id: change.game.team1Player1.id,
            name: change.game.team1Player1.name,
            eloRating: Number(change.game.team1Player1.eloRating),
            profilePicture: change.game.team1Player1.profilePicture || null,
          },
          team1Player2: {
            id: change.game.team1Player2.id,
            name: change.game.team1Player2.name,
            eloRating: Number(change.game.team1Player2.eloRating),
            profilePicture: change.game.team1Player2.profilePicture || null,
          },
          team2Player1: {
            id: change.game.team2Player1.id,
            name: change.game.team2Player1.name,
            eloRating: Number(change.game.team2Player1.eloRating),
            profilePicture: change.game.team2Player1.profilePicture || null,
          },
          team2Player2: {
            id: change.game.team2Player2.id,
            name: change.game.team2Player2.name,
            eloRating: Number(change.game.team2Player2.eloRating),
            profilePicture: change.game.team2Player2.profilePicture || null,
          },
          team1Score: change.game.team1Score,
          team2Score: change.game.team2Score,
          playedAt: change.game.playedAt.toISOString(),
        } : null,
      })),
      gameHistory: uniqueGames.map((game) => ({
        id: game.id,
        team1Player1: {
          id: game.team1Player1.id,
          name: game.team1Player1.name,
          eloRating: Number(game.team1Player1.eloRating),
          profilePicture: game.team1Player1.profilePicture || null,
        },
        team1Player2: {
          id: game.team1Player2.id,
          name: game.team1Player2.name,
          eloRating: Number(game.team1Player2.eloRating),
          profilePicture: game.team1Player2.profilePicture || null,
        },
        team2Player1: {
          id: game.team2Player1.id,
          name: game.team2Player1.name,
          eloRating: Number(game.team2Player1.eloRating),
          profilePicture: game.team2Player1.profilePicture || null,
        },
        team2Player2: {
          id: game.team2Player2.id,
          name: game.team2Player2.name,
          eloRating: Number(game.team2Player2.eloRating),
          profilePicture: game.team2Player2.profilePicture || null,
        },
        team1Score: game.team1Score,
        team2Score: game.team2Score,
        playedAt: game.playedAt.toISOString(),
      })),
      isFriend,
      friendRequestType,
      friendshipId,
      isOwnProfile,
    });
  } catch (error) {
    console.error("[PlayerProfileAPI] Error fetching player:", error);
    return NextResponse.json(
      { error: "Failed to fetch player data" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth-Prüfung - Nur eingeloggte User dürfen ihr eigenes Profil bearbeiten
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { id } = await params;
    const playerId = id;
    
    // Hole den aktuellen Player des eingeloggten Users
    const currentPlayer = await db.player.findFirst({
      where: { userId: currentUser.userId }
    });
    
    // Prüfe, ob der User der Besitzer des Profils ist
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    // Validierung
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
    }

    if (name.length < 2 || name.length > 30) {
      return NextResponse.json({ error: "Name muss zwischen 2 und 30 Zeichen lang sein" }, { status: 400 });
    }

    // Prüfe, ob der Name bereits vergeben ist
    const existingPlayer = await db.player.findFirst({
      where: {
        name: name,
        NOT: { id: playerId }
      }
    });

    if (existingPlayer) {
      return NextResponse.json({ error: "Dieser Name ist bereits vergeben" }, { status: 409 });
    }

    // Update den Spieler
    const updatedPlayer = await db.player.update({
      where: { id: playerId },
      data: { name }
    });

    return NextResponse.json({
      player: {
        id: updatedPlayer.id,
        name: updatedPlayer.name,
        eloRating: Number(updatedPlayer.eloRating),
        gamesPlayed: updatedPlayer.gamesPlayed,
        wins: updatedPlayer.wins,
        losses: updatedPlayer.losses,
        profilePicture: updatedPlayer.profilePicture || null,
        createdAt: updatedPlayer.createdAt.toISOString(),
        lastPlayedAt: updatedPlayer.lastPlayedAt ? updatedPlayer.lastPlayedAt.toISOString() : null,
      }
    });
  } catch (error) {
    console.error("[PlayerProfileAPI] Error updating player:", error);
    return NextResponse.json(
      { error: "Failed to update player data" },
      { status: 500 }
    );
  }
}