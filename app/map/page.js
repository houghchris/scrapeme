'use client';

import ButtonAccount from "@/components/ButtonAccount";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import toast from "react-hot-toast";

export default function Map() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scraperId = searchParams.get('id');
  
  const [scraperData, setScraperData] = useState({
    name: "",
    websiteUrl: "",
    urlPath: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScraper = async () => {
      if (!scraperId) {
        toast.error("No scraper ID provided");
        // Redirect back to setup page if no ID is provided
        router.push('/setup');
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/scrapers/${scraperId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error fetching scraper data");
        }

        setScraperData(data);
      } catch (error) {
        console.error("Error:", error);
        toast.error(error.message || "Failed to load scraper data");
        // Redirect to setup page if scraper is not found
        if (error.message.includes("not found")) {
          router.push('/setup');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchScraper();
  }, [scraperId, router]);

  return (
    <main className="min-h-screen p-8 pb-24 max-w-6xl mx-auto space-y-8">
      {/* Navigation Bar */}
      <div className="navbar bg-base-100">
        <div className="flex-1">
          <a href="/" className="btn btn-ghost text-xl">Scraper App</a>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li><a href="/dashboard" className="btn btn-ghost">Dashboard</a></li>
            <li><a href="/setup" className="btn btn-ghost">Setup</a></li>
            <li><a href="/map" className="btn btn-ghost">Map</a></li>
          </ul>
        </div>
        <ButtonAccount />
      </div>

      {/* Steps Section */}
      <div className="p-4 bg-base-200 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Progress Steps</h2>
        <ul className="steps w-full">
          <li className="step step-primary">Register</li>
          <li className="step step-primary">Choose plan</li>
          <li className="step">Purchase</li>
          <li className="step">Receive Product</li>
        </ul>
      </div>

      {/* Scraper Info Section */}
      <div className="p-4 bg-base-200 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Scraper Information</h2>
        {isLoading ? (
          <div className="flex justify-center items-center p-4">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Scraper Name</span>
              </label>
              <input
                type="text"
                value={scraperData.name}
                className="input input-bordered w-full"
                readOnly
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Website URL</span>
              </label>
              <input
                type="url"
                value={scraperData.websiteUrl}
                className="input input-bordered w-full"
                readOnly
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">URL Path</span>
              </label>
              <input
                type="text"
                value={scraperData.urlPath}
                className="input input-bordered w-full"
                readOnly
              />
            </div>
          </div>
        )}
      </div>

      {/* Map Content Section */}
      <div className="p-4 bg-base-200 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Map View</h2>
        <div className="flex flex-col gap-4">
          {/* Add your map content here */}
          <div className="bg-base-100 p-4 rounded-lg">
            <p>Map content will be displayed here</p>
          </div>
        </div>
      </div>
    </main>
  );
}
