import { NextResponse } from "next/server";
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

    const scrapers = await db.collection('scrapers')
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(scrapers);
  } catch (error) {
    console.error("Error in GET /api/scrapers:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log('Received request body:', body);

    const { name, websiteUrl, urlPath } = body;

    if (!name || !websiteUrl) {
      console.log('Validation failed: Missing required fields');
      return NextResponse.json(
        { error: "Name and Website URL are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Create new scraper
    const scraper = {
      name,
      websiteUrl,
      urlPath: urlPath || "",
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('scrapers').insertOne(scraper);
    
    // Return the created scraper with its ID
    return NextResponse.json({
      message: "Scraper created successfully",
      scraper: { ...scraper, _id: result.insertedId }
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/scrapers:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
