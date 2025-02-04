import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import clientPromise from '@/libs/mongodb';

export async function GET() {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get the latest scraper for the authenticated user
    const latestScraper = await db.collection('scrapers')
      .findOne(
        { userId: session.user.id },
        { sort: { createdAt: -1 } }
      );

    if (!latestScraper) {
      return NextResponse.json({ error: "No scraper found" }, { status: 404 });
    }

    return NextResponse.json(latestScraper);
  } catch (error) {
    console.error("Error fetching latest scraper:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
