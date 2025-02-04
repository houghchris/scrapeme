import clientPromise from "@/libs/mongodb";
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get the full scraper document
    const scraper = await db.collection('scrapers').findOne(
      { _id: new ObjectId("67a22c5f3313da252ef81c0f") }
    );

    if (!scraper) {
      return new Response(JSON.stringify({ error: "Scraper not found" }), { status: 404 });
    }

    // Also get the most recent update operation
    const recentOperations = await db.collection('scrapers')
      .find({ _id: new ObjectId("67a22c5f3313da252ef81c0f") })
      .sort({ $natural: -1 })
      .limit(1)
      .toArray();

    return new Response(JSON.stringify({
      scraper,
      recentOperations: recentOperations[0]
    }, null, 2), { status: 200 });
  } catch (error) {
    console.error('Debug error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
