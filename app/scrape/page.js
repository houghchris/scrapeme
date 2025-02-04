'use client';

import ButtonAccount from "@/components/ButtonAccount";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function Scrape() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const scraperId = searchParams.get('id');
  
  const [scraperData, setScraperData] = useState({
    name: "",
    urls: [],
    fields: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchScraper = async () => {
      if (!scraperId) {
        toast.error("No scraper ID provided");
        router.push('/setup');
        return;
      }

      if (status !== "authenticated") {
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/scrapers/${scraperId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error fetching scraper data");
        }

        console.log('Fetched scraper data:', data);
        setScraperData(data);
      } catch (error) {
        console.error("Error:", error);
        toast.error(error.message || "Failed to load scraper data");
        if (error.message.includes("not found")) {
          router.push('/setup');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchScraper();
  }, [scraperId, router, status]);

  const handleScrapeNow = async () => {
    try {
      const response = await fetch('/api/scrapers/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scraperId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start scraping');
      }

      toast.success('Scraping started successfully');
    } catch (error) {
      console.error('Error starting scrape:', error);
      toast.error(error.message || 'Failed to start scraping');
    }
  };

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
            <li><a href="/fields" className="btn btn-ghost">Fields</a></li>
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
          <li className="step step-primary">Purchase</li>
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
                <span className="label-text">Included URLs</span>
              </label>
              <textarea
                value={scraperData.urls ? scraperData.urls.join('\n') : ''}
                className="textarea textarea-bordered h-32 font-mono"
                readOnly
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Fields</span>
              </label>
              <div className="space-y-4">
                {scraperData.fields?.map((field, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="form-control flex-1">
                      <input
                        type="text"
                        value={field.id}
                        className="input input-bordered w-full"
                        readOnly
                      />
                    </div>
                    <div className="form-control flex-1">
                      <input
                        type="text"
                        value={field.prompt}
                        className="input input-bordered w-full"
                        readOnly
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="btn btn-primary w-full mt-4"
              onClick={handleScrapeNow}
            >
              Scrape Now
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
