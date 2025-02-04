import mongoose from "mongoose";

const scraperSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    websiteUrl: {
      type: String,
      required: [true, "Website URL is required"],
      trim: true,
    },
    urlPath: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'scrapers',
    strict: true,
  }
);

// Check if model already exists to prevent OverwriteModelError
const Scraper = mongoose.models.Scraper || mongoose.model("Scraper", scraperSchema);

export default Scraper;
