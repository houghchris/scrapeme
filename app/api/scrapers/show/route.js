import clientPromise from "@/libs/mongodb";
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const scraper = await db.collection('scrapers').findOne(
      { _id: new ObjectId("67a22c5f3313da252ef81c0f") }
    );

    if (!scraper) {
      return new Response(JSON.stringify({ error: "Scraper not found" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Pretty print the scraper object
    return new Response(JSON.stringify(scraper, null, 2), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Show error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
