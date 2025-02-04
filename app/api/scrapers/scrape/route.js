import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import clientPromise from "@/libs/mongodb";
import { ObjectId } from 'mongodb';
import FirecrawlApp from '@mendable/firecrawl-js';

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { scraperId } = await req.json();
    if (!scraperId) {
      return new Response(JSON.stringify({ error: 'Scraper ID is required' }), { status: 400 });
    }

    // Convert string ID to ObjectId
    let scraperObjectId;
    try {
      scraperObjectId = new ObjectId(scraperId);
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid scraper ID format' }), { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    console.log('Looking for scraper:', scraperObjectId);
    const scraper = await db.collection('scrapers').findOne({
      _id: scraperObjectId,
      userId: session.user.id
    });
    
    if (!scraper) {
      console.log('Scraper not found for ID:', scraperObjectId);
      return new Response(JSON.stringify({ error: 'Scraper not found' }), { status: 404 });
    }

    console.log('Found scraper:', scraper);

    // Convert field objects to schema properties
    const schemaProperties = {};
    scraper.fields.forEach(field => {
      schemaProperties[field.id] = { type: "string" };
    });

    // Define schema for extraction
    const schema = {
      type: "object",
      properties: schemaProperties,
      required: scraper.fields.map(field => field.id)
    };

    console.log('Sending request to Firecrawl with schema:', schema);

    // Start async batch scrape
    const batchScrapeJob = await app.batchScrapeUrls(scraper.urls, {
      formats: ['extract'],
      extract: {
        prompt: "Extract the specified fields from the page.",
        schema: schema
      }
    }, true); // Pass true to make it asynchronous

    console.log('Firecrawl response:', JSON.stringify(batchScrapeJob, null, 2));

    if (!batchScrapeJob.success) {
      console.error('Firecrawl error:', batchScrapeJob.error);
      throw new Error(batchScrapeJob.error || 'Failed to start batch scrape');
    }

    // Save the firecrawl job ID to the scraper document
    console.log('Updating MongoDB with Firecrawl ID:', batchScrapeJob.id);
    const updateResult = await db.collection('scrapers').updateOne(
      { _id: scraperObjectId },
      { 
        $set: { 
          lastFirecrawlId: batchScrapeJob.id,
          lastScrapeStarted: new Date()
        }
      }
    );
    console.log('MongoDB update result:', JSON.stringify(updateResult, null, 2));

    if (!updateResult.acknowledged || updateResult.modifiedCount !== 1) {
      console.error('Failed to update MongoDB:', JSON.stringify(updateResult, null, 2));
      throw new Error('Failed to save Firecrawl ID to database');
    }

    // Double-check that the update was successful
    const updatedScraper = await db.collection('scrapers').findOne({ _id: scraperObjectId });
    console.log('Verified updated scraper:', JSON.stringify(updatedScraper, null, 2));

    // Return both the Firecrawl response and the updated scraper state
    const response = {
      firecrawl: batchScrapeJob,  // This will have the id and url from Firecrawl
      scraper: updatedScraper     // This shows the MongoDB state after update
    };
    console.log('Sending response:', JSON.stringify(response, null, 2));

    return new Response(JSON.stringify(response), { status: 200 });

  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
