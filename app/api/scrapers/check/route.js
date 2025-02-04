import clientPromise from "@/libs/mongodb";
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const scraper = await db.collection('scrapers').findOne(
      { _id: new ObjectId("67a22c5f3313da252ef81c0f") },
      { projection: { lastFirecrawlId: 1, lastScrapeStarted: 1, name: 1 } }
    );

    console.log('Current scraper state:', scraper);

    return new Response(JSON.stringify(scraper), { status: 200 });
  } catch (error) {
    console.error('Check error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
