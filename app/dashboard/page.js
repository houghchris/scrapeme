'use client';

import ButtonAccount from "@/components/ButtonAccount";
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
      <div className="navbar bg-base-100">
        <div className="flex-1">
          <a href="/dashboard" className="btn btn-ghost text-xl">Scraper App</a>
        </div>
        <ButtonAccount />
      </div>

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
                          className="btn btn-square join-item btn-sm btn-error tooltip grid place-items-center" 
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
    </main>
  );
}
