import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import clientPromise from "@/libs/mongodb";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "7");
    
    // Calculate the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const client = await clientPromise;
    const db = client.db();

    // Get daily credit usage aggregated by operation type
    const dailyUsage = await db.collection('credit_usage').aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            operationType: "$operationType"
          },
          totalCredits: { $sum: "$creditsUsed" }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]).toArray();

    // Get recent credit usage entries
    const recentUsage = await db.collection('credit_usage')
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    // Get scraper names for the recent usage entries
    const scraperIds = [...new Set(recentUsage.map(usage => usage.scraperId))];
    const scrapers = await db.collection('scrapers')
      .find({ _id: { $in: scraperIds } })
      .project({ _id: 1, name: 1 })
      .toArray();

    const scraperMap = new Map(scrapers.map(s => [s._id.toString(), s.name]));
    
    const recentUsageWithNames = recentUsage.map(usage => ({
      ...usage,
      scraperName: scraperMap.get(usage.scraperId.toString()) || 'Unknown'
    }));

    // Calculate total credits used in the period
    const totalCredits = dailyUsage.reduce((acc, curr) => acc + curr.totalCredits, 0);
    
    // Calculate percentage change from previous period
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    
    const previousPeriodUsage = await db.collection('credit_usage').aggregate([
      {
        $match: {
          timestamp: { $gte: previousStartDate, $lt: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalCredits: { $sum: "$creditsUsed" }
        }
      }
    ]).toArray();

    const previousTotal = previousPeriodUsage[0]?.totalCredits || 0;
    const percentageChange = previousTotal === 0 
      ? 100 
      : ((totalCredits - previousTotal) / previousTotal) * 100;

    return NextResponse.json({
      dailyUsage,
      recentUsage: recentUsageWithNames,
      totalCredits,
      percentageChange
    });
  } catch (error) {
    console.error("Error fetching credit usage:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
