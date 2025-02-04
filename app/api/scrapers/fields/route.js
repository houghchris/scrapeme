import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import clientPromise from '@/libs/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log('Received request body:', body);
    
    const { scraperId, fields } = body;
    
    if (!scraperId) {
      console.error('No scraperId provided');
      return NextResponse.json(
        { error: 'Scraper ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(fields)) {
      console.error('Fields must be an array');
      return NextResponse.json(
        { error: 'Fields must be an array' },
        { status: 400 }
      );
    }

    let objectId;
    try {
      console.log('Converting to ObjectId:', scraperId);
      objectId = new ObjectId(scraperId);
      console.log('Successfully converted to ObjectId');
    } catch (error) {
      console.error('Invalid ObjectId format:', error);
      return NextResponse.json(
        { error: 'Invalid scraper ID format' },
        { status: 400 }
      );
    }

    console.log('Connecting to MongoDB...');
    const client = await clientPromise;
    const db = client.db();
    
    // First check if the scraper exists and belongs to the user
    const scraper = await db.collection('scrapers').findOne({
      _id: objectId,
      userId: session.user.id
    });
    
    if (!scraper) {
      console.error('No scraper found with ID:', scraperId, 'and userId:', session.user.id);
      return NextResponse.json(
        { error: 'Scraper not found' },
        { status: 404 }
      );
    }

    // Update the scraper document with the fields
    const result = await db.collection('scrapers').updateOne(
      { 
        _id: objectId,
        userId: session.user.id
      },
      {
        $set: {
          fields: fields,
          fieldsUpdatedAt: new Date()
        }
      }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      console.error('No scraper found with ID:', scraperId);
      return NextResponse.json(
        { error: 'Scraper not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save fields' },
      { status: 500 }
    );
  }
}
