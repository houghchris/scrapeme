import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Scraper from "@/models/Scraper";

// Enable mongoose debug mode
mongoose.set('debug', true);

// Connect to MongoDB only once
let isConnected = false;
const connectDB = async () => {
  if (isConnected) {
    console.log('Using existing connection');
    return;
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Attempting MongoDB connection...');
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(MONGODB_URI, options);
    
    // Test the connection by making a simple query
    await mongoose.connection.db.admin().ping();
    console.log('MongoDB connection successful and verified');
    isConnected = true;
    
    return true;
  } catch (error) {
    console.error('MongoDB Connection Error Details:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'MongoServerError') {
      console.error('MongoDB Server Error Details:', {
        codeName: error.codeName,
        writeErrors: error.writeErrors,
        errorLabels: error.errorLabels,
      });
    }
    
    throw error;
  }
};

export async function GET() {
  try {
    await connectDB();
    const scrapers = await Scraper.find().sort({ createdAt: -1 });
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

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await connectDB();

    // Create new scraper
    console.log('Creating new scraper with data:', { name, websiteUrl, urlPath });
    const scraper = await Scraper.create({
      name,
      websiteUrl,
      urlPath: urlPath || "",
    });
    console.log('Scraper created successfully:', scraper);

    return NextResponse.json(
      { message: "Scraper created successfully", scraper },
      { status: 201 }
    );
  } catch (error) {
    console.error("Detailed error creating scraper:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Check if it's a MongoDB validation error
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { error: "Validation error: " + error.message },
        { status: 400 }
      );
    }

    // Check if it's a MongoDB connection error
    if (error.name === "MongooseServerSelectionError") {
      return NextResponse.json(
        { error: "Database connection error. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Error creating scraper: " + error.message },
      { status: 500 }
    );
  }
}
