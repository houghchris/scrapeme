'use client';

import ButtonAccount from "@/components/ButtonAccount";
import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function Dashboard() {
  const [scrapers, setScrapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScrapers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/scrapers');
        if (!response.ok) {
          throw new Error('Failed to fetch scrapers');
        }
        const data = await response.json();
        // Ensure we're setting an array
        setScrapers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching scrapers:', error);
        setError(error.message);
        setScrapers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScrapers();
  }, []);

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
          </ul>
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
                <th>URL Path</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    <span className="loading loading-spinner loading-md"></span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="text-center text-error">
                    Error: {error}
                  </td>
                </tr>
              ) : scrapers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    No scrapers found. Create one in the <a href="/setup" className="link link-primary">setup page</a>.
                  </td>
                </tr>
              ) : (
                scrapers.map((scraper, index) => (
                  <tr key={scraper._id}>
                    <th>{index + 1}</th>
                    <td>{scraper.name}</td>
                    <td>
                      <a href={scraper.websiteUrl} target="_blank" rel="noopener noreferrer" className="link link-primary">
                        {scraper.websiteUrl}
                      </a>
                    </td>
                    <td>{scraper.urlPath || '-'}</td>
                    <td>{scraper.createdAt ? format(new Date(scraper.createdAt), 'MMM d, yyyy HH:mm') : '-'}</td>
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
