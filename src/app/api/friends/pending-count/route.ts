import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - Liefert die Anzahl der ausstehenden Anfragen für den aktuellen User
export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const count = await db.friendship.count({
      where: {
        receiverId: currentUser.userId,
        status: "pending",
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching pending count:", error);
    return NextResponse.json({ count: 0 });
  }
}