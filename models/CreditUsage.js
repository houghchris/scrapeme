import mongoose from "mongoose";

const creditUsageSchema = new mongoose.Schema(
  {
    operationType: {
      type: String,
      required: true,
      enum: ['map', 'scrape'],
      trim: true,
    },
    creditsUsed: {
      type: Number,
      required: true,
      min: 0,
    },
    scraperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scraper',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: true,
    collection: 'credit_usage',
    strict: true,
  }
);

const CreditUsage = mongoose.models.CreditUsage || mongoose.model("CreditUsage", creditUsageSchema);

export default CreditUsage;
