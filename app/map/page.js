'use client';

import ButtonAccount from "@/components/ButtonAccount";
import NavigationBar from "@/components/NavigationBar";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function Map() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const scraperId = searchParams.get('id');
  
  const [scraperData, setScraperData] = useState({
    name: "",
    websiteUrl: "",
    urlPath: "",
    includedUrls: [],
    excludedUrls: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [urlList, setUrlList] = useState([]);
  const [excludedUrls, setExcludedUrls] = useState(new Set());
  const [isFetchingUrls, setIsFetchingUrls] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

        console.log('Raw scraper data:', JSON.stringify(data, null, 2));
        setScraperData(data);
        
        // Pre-populate URLs if they exist
        if (data.urls || data.excludedUrls) {
          console.log('Found URLs in data:', {
            included: data.urls?.length || 0,
            excluded: data.excludedUrls?.length || 0
          });
          
          // Combine all URLs
          const allUrls = [
            ...(data.urls || []),
            ...(data.excludedUrls || [])
          ];
          setUrlList(allUrls);
          
          // Create Set of excluded URLs
          const excludedSet = new Set(data.excludedUrls || []);
          setExcludedUrls(excludedSet);
          
          console.log('Setting URL states:', {
            totalUrls: allUrls.length,
            excludedCount: excludedSet.size,
            includedCount: data.urls?.length || 0
          });
        }
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

  const handleSaveAndScrape = async () => {
    if (!session) {
      toast.error("Please log in to save URLs");
      return;
    }

    try {
      setIsSaving(true);
      
      const filteredUrls = urlList.filter(url => !scraperData.urlPath || url.includes(scraperData.urlPath));
      const includedUrls = filteredUrls.filter(url => !excludedUrls.has(url));
      const excludedUrlsList = Array.from(excludedUrls).filter(url => filteredUrls.includes(url));

      console.log('Saving URLs:', {
        scraperId,
        includedCount: includedUrls.length,
        excludedCount: excludedUrlsList.length,
        scraperData,
        userId: session.user.id
      });

      const response = await fetch('/api/scrapers/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scraperId,
          includedUrls,
          excludedUrls: excludedUrlsList
        })
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save URLs');
      }

      toast.success('URLs saved successfully');
      router.push(`/fields?id=${scraperId}`);
    } catch (error) {
      console.error('Error saving URLs:', error);
      toast.error(error.message || 'Failed to save URLs');
    } finally {
      setIsSaving(false);
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
          <li className="step">Fields</li>
          <li className="step">Scrape</li>
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
                <span className="label-text">Website URL</span>
              </label>
              <input
                type="text"
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

            <button 
              className="btn btn-primary"
              onClick={async () => {
                try {
                  setIsFetchingUrls(true);
                  const response = await fetch('/api/firecrawl/map', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      websiteUrl: scraperData.websiteUrl
                    })
                  });
                  
                  if (!response.ok) {
                    throw new Error('Failed to fetch URLs');
                  }
                  
                  const data = await response.json();
                  setUrlList(data.urls);
                } catch (error) {
                  console.error('Error fetching URLs:', error);
                  toast.error('Failed to fetch URLs');
                } finally {
                  setIsFetchingUrls(false);
                }
              }}
              disabled={isFetchingUrls}
            >
              {isFetchingUrls ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Fetch URLs'
              )}
            </button>
          </div>
        )}
      </div>

      {/* URL List Section */}
      {urlList.length > 0 && (
        <div className="p-4 bg-base-200 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Found URLs</h2>
          <div className="overflow-x-auto">
            <div className="bg-base-100 p-4 rounded-lg">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Included</th>
                  </tr>
                </thead>
                <tbody>
                  {urlList
                    .filter(url => !scraperData.urlPath || url.includes(scraperData.urlPath))
                    .map((url, index) => (
                      <tr key={index}>
                        <td>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="link link-primary">
                            {url}
                          </a>
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={!excludedUrls.has(url)}
                            onChange={(e) => {
                              const newExcludedUrls = new Set(excludedUrls);
                              if (e.target.checked) {
                                newExcludedUrls.delete(url);
                              } else {
                                newExcludedUrls.add(url);
                              }
                              setExcludedUrls(newExcludedUrls);
                            }}
                            className="checkbox"
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                className="btn btn-primary"
                onClick={handleSaveAndScrape}
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Save & Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
