import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import clientPromise from '@/libs/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Validate the ID format
    let scraperId;
    try {
      scraperId = new ObjectId(params.id);
    } catch (error) {
      return NextResponse.json({ error: "Invalid scraper ID format" }, { status: 400 });
    }

    // Get the scraper by ID
    const scraper = await db.collection('scrapers').findOne({
      _id: scraperId,
      userId: session.user.id
    });

    if (!scraper) {
      return NextResponse.json({ error: "Scraper not found" }, { status: 404 });
    }

    return NextResponse.json(scraper);
  } catch (error) {
    console.error("Error fetching scraper:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
