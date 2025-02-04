import { NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';

export async function POST(req) {
  try {
    const { websiteUrl } = await req.json();
    
    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
    const mapResult = await app.mapUrl(websiteUrl);

    if (!mapResult.success) {
      throw new Error(`Failed to map: ${mapResult.error}`);
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
