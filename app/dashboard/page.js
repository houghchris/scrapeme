'use client';

import ButtonAccount from "@/components/ButtonAccount";
import NavigationBar from "@/components/NavigationBar";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { MapIcon, ArrowDownOnSquareIcon, CodeBracketIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function Dashboard() {
  const [scrapers, setScrapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchScrapers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/scrapers');
      if (!response.ok) {
        throw new Error('Failed to fetch scrapers');
      }
      const data = await response.json();
      setScrapers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching scrapers:', error);
      setError(error.message);
      setScrapers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScrapers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scraper?')) {
      return;
    }

    try {
      const response = await fetch(`/api/scrapers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete scraper');
      }

      // Refresh the scrapers list
      fetchScrapers();
    } catch (error) {
      console.error('Error deleting scraper:', error);
      alert('Failed to delete scraper');
    }
  };

  return (
    <main className="min-h-screen p-8 pb-24 max-w-6xl mx-auto space-y-8">
      {/* Navigation Bar */}
      <NavigationBar />

      {/* Drawer */}
      <div className="drawer drawer-end">
        <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />
        
        <div className="drawer-content">
          {/* Table Section */}
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Website URL</th>
                    <th>URLs</th>
                    <th>Excluded</th>
                    <th>Fields</th>
                    <th>Created</th>
                    <th>Last Scrape</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="9" className="text-center">
                        <span className="loading loading-spinner loading-md"></span>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="9" className="text-center text-error">
                        Error: {error}
                      </td>
                    </tr>
                  ) : scrapers.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center">
                        No scrapers found. Create one in the <a href="/setup" className="link link-primary">setup page</a>.
                      </td>
                    </tr>
                  ) : (
                    scrapers.map((scraper, index) => (
                      <tr key={scraper._id}>
                        <th className="font-mono text-xs">
                          <div className="tooltip" data-tip={scraper._id}>
                            {scraper._id.slice(-5)}
                          </div>
                        </th>
                        <td>{scraper.name}</td>
                        <td>
                          <div className="tooltip" data-tip={scraper.websiteUrl}>
                            <a href={scraper.websiteUrl} target="_blank" rel="noopener noreferrer" className="link link-primary">
                              {scraper.websiteUrl.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </div>
                        </td>
                        <td>{scraper.urls?.length || 0}</td>
                        <td>{scraper.excludedUrls?.length || 0}</td>
                        <td>{scraper.fields?.length || 0}</td>
                        <td>{new Date(scraper.createdAt).toLocaleDateString()}</td>
                        <td>{scraper.lastScrapeTime ? new Date(scraper.lastScrapeTime).toLocaleString() : 'Never'}</td>
                        <td>
                          <div className="join">
                            <a 
                              href={`/map?id=${scraper._id}`} 
                              className="btn btn-square join-item btn-sm tooltip grid place-items-center" 
                              data-tip={scraper.urls?.length > 0 ? "Map" : "Add URLs to enable mapping"}
                              disabled={!scraper.urls?.length}
                            >
                              <MapIcon className="w-4 h-4" />
                            </a>
                            <a 
                              href={`/scrape?id=${scraper._id}`} 
                              className="btn btn-square join-item btn-sm tooltip grid place-items-center" 
                              data-tip={scraper.fields?.length > 0 ? "Scrape" : "Add fields to enable scraping"}
                              disabled={!scraper.fields?.length}
                            >
                              <ArrowDownOnSquareIcon className="w-4 h-4" />
                            </a>
                            <a 
                              href={`/api/xml?id=${scraper._id}`} 
                              className="btn btn-square join-item btn-sm tooltip grid place-items-center"
                              data-tip={scraper.lastFirecrawlResponse ? "XML" : "Scrape first to enable XML export"}
                              disabled={!scraper.lastFirecrawlResponse}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <CodeBracketIcon className="w-4 h-4" />
                            </a>
                            <button 
                              onClick={() => handleDelete(scraper._id)}
                              className="btn btn-square join-item btn-sm tooltip grid place-items-center hover:btn-error" 
                              data-tip="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Progress and Inputs Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          </div>

          {/* Drawer Button - Fixed Position */}
          <div className="fixed bottom-4 right-4">
            <label htmlFor="dashboard-drawer" className="btn btn-primary drawer-button">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
              Roadmap
            </label>
          </div>
        </div>

        <div className="drawer-side">
          <label htmlFor="dashboard-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
          <ol className="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
            <li>Deploy to Vercel</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
