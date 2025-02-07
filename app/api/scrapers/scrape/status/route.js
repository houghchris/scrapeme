import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import FirecrawlApp from "@mendable/firecrawl-js";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the scrape ID from the query params
    const { searchParams } = new URL(req.url);
    const scrapeId = searchParams.get('id');
    
    if (!scrapeId) {
      return NextResponse.json({ error: "Scrape ID is required" }, { status: 400 });
    }

    // Initialize Firecrawl
    const app = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY
    });

    // Get the scrape status
    const status = await app.getBatchScrapeStatus(scrapeId);
    console.log('Firecrawl status:', JSON.stringify(status, null, 2));

    return NextResponse.json(status);
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
