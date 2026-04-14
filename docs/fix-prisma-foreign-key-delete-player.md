---
title: Prisma FOREIGN KEY Constraint beim Löschen eines Players
tags: [prisma, foreign-key, sqlite, deletion-order]
---
# PROBLEM
Beim Löschen eines Players per DELETE Request tritt ein FOREIGN KEY constraint failed Error auf (Code: 1811). Der Fehler entsteht, weil die Löschreihenfolge falsch ist: Zuerst wurde der Player gelöscht, dann der User. Aber Player.userId referenziert User.id.

# LÖSUNG
1. Die Löschreihenfolge ändern: Zuerst User (Parent) löschen, dann Player (Child)
2. Zuvor alle abhängigen Datensätze löschen: Friendship, FeatureRequest und EloChange
3. Innerhalb einer $transaction ausführen für Konsistenz

# CODE / COMMANDS
```typescript
await db.$transaction(async (tx) => {
  // Delete dependent records first
  await tx.eloChange.deleteMany({ where: { playerId: id } });

  // Delete friendships (through User table)
  if (playerAny.userId) {
    await tx.friendship.deleteMany({
      OR: [
        { requesterId: playerAny.userId },
        { receiverId: playerAny.userId },
      ],
    });

    // Delete feature requests
    await tx.featureRequest.deleteMany({
      where: { userId: playerAny.userId },
    });

    // Delete user first (parent record referenced by Player.userId)
    await tx.$executeRaw`
      DELETE FROM "User"
      WHERE id = ${playerAny.userId}
    `;
  }

  // Finally delete player
  await tx.player.delete({ where: { id } });
});
```

# SHELL OUTPUT / ERROR
```
Error deleting player: PrismaClientKnownRequestError: 
Invalid `prisma.$executeRaw()` invocation:
Raw query failed. Code: `1811`. Message: `FOREIGN KEY constraint failed`
{
  code: 'P2010',
  meta: { code: '1811', message: 'FOREIGN KEY constraint failed' },
  clientVersion: '6.19.2'
}
```

# WEITERE RESOURCEN
- File: `src/app/api/players/route.ts`
- Schema: `prisma/schema.prisma`