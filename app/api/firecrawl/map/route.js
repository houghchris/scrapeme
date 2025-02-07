import { NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import clientPromise from "@/libs/mongodb";
import { ObjectId } from 'mongodb';

export async function POST(req) {
  try {
    const { websiteUrl, scraperId } = await req.json();
    
    if (!websiteUrl || !scraperId) {
      return NextResponse.json(
        { error: 'Website URL and Scraper ID are required' },
        { status: 400 }
      );
    }

    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
    const mapResult = await app.mapUrl(websiteUrl);

    if (!mapResult.success) {
      throw new Error(`Failed to map: ${mapResult.error}`);
    }

    // Record credit usage if available
    if (mapResult.creditsUsed) {
      const client = await clientPromise;
      const db = client.db();
      await db.collection('credit_usage').insertOne({
        operationType: 'map',
        creditsUsed: mapResult.creditsUsed,
        scraperId: new ObjectId(scraperId),
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return NextResponse.json({ urls: mapResult.links });
  } catch (error) {
    console.error('Error in FireCrawl Map API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch URLs' },
      { status: 500 }
    );
  }
}
