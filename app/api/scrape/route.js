import { NextResponse } from "next/server";
import clientPromise from '@/libs/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const body = await req.json();
    const { scraperId, firecrawlResponse } = body;

    if (!scraperId || !firecrawlResponse) {
      return NextResponse.json({ error: 'Missing required fields: scraperId and firecrawlResponse' }, { status: 400 });
    }

    // Update the scraper document with firecrawl response and last scrape time
    const result = await db.collection('scrapers').updateOne(
      { _id: new ObjectId(scraperId) },
      {
        $set: {
          lastFirecrawlResponse: firecrawlResponse,
          lastScrapeTime: new Date().toISOString()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Scraper not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating scraper:', error);
    return NextResponse.json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
}
