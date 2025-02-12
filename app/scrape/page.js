'use client';

import ButtonAccount from "@/components/ButtonAccount";
import NavigationBar from "@/components/NavigationBar";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function Scrape() {
  return (
    <Suspense fallback={
      <main className="min-h-screen p-8 pb-24 max-w-6xl mx-auto space-y-8">
        <NavigationBar />
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </main>
    }>
      <ScrapeContent />
    </Suspense>
  );
}

function ScrapeContent() {
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
  const [isScraping, setIsScraping] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const [scrapeProgress, setScrapeProgress] = useState(null);

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
      setIsScraping(true);
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

      // Set debug data
      setDebugData(data);

      // Save firecrawl response to MongoDB
      const saveResponse = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scraperId,
          firecrawlResponse: data
        })
      });

      const saveData = await saveResponse.json();
      
      if (!saveResponse.ok) {
        throw new Error(saveData.error || 'Failed to save scrape results');
      }

      // Set progress for completed scrape
      setScrapeProgress({
        status: 'completed',
        completed: scraperData.urls.length,
        total: scraperData.urls.length,
        isComplete: true
      });

      toast.success('Scraping completed successfully');
    } catch (error) {
      console.error('Error starting scrape:', error);
      toast.error(error.message || 'Failed to start scraping');
      setDebugData({ error: error.message });
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <main className="min-h-screen p-8 pb-24 max-w-6xl mx-auto space-y-8">
      {/* Navigation Bar */}
      <NavigationBar />

      {/* Steps Section */}
      <div className="p-4 bg-base-200 rounded-lg">
        <ul className="steps w-full">
          <li className="step step-primary">Setup</li>
          <li className="step step-primary">Map</li>
          <li className="step step-primary">Fields</li>
          <li className="step step-primary">Scrape</li>
          <li className="step">Result</li>
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
              disabled={isScraping}
            >
              {isScraping ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Scraping...
                </>
              ) : (
                'Scrape Now'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Progress Section */}
      {scrapeProgress && (
        <div className="p-4 bg-base-200 rounded-lg text-center">
          <h2 className="text-xl font-bold mb-4">Scrape Progress</h2>
          {scrapeProgress.total > 0 && (
            <div className="flex flex-col items-center gap-4">
              <div 
                className="radial-progress" 
                style={{"--value": (scrapeProgress.completed / scrapeProgress.total) * 100}} 
                role="progressbar"
              >
                {Math.round((scrapeProgress.completed / scrapeProgress.total) * 100)}%
              </div>
              <div className="text-sm">
                {scrapeProgress.completed} of {scrapeProgress.total} URLs processed
              </div>
              {scrapeProgress.isComplete && (
                <button className="btn btn-primary">
                  XML
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Debug Info Section */}
      {debugData && (
        <div className="p-4 bg-base-200 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Debug Information</h2>
            {debugData.firecrawl?.success && (
              <a 
                href={`/api/xml?id=${scraperId}`}
                className="btn btn-primary"
                target="_blank"
              >
                View XML
              </a>
            )}
          </div>
          <pre className="whitespace-pre-wrap bg-base-300 p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
