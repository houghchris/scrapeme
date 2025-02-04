'use client';

import ButtonAccount from "@/components/ButtonAccount";
import NavigationBar from "@/components/NavigationBar";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function Fields() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const scraperId = searchParams.get('id');
  
  const [scraperData, setScraperData] = useState({
    name: "",
    urls: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [fields, setFields] = useState([]);
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

        console.log('Fetched scraper data:', data);
        setScraperData(data);
        // Load existing fields if they exist
        if (data.fields && Array.isArray(data.fields)) {
          setFields(data.fields);
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
                <span className="label-text">Included URLs</span>
              </label>
              <textarea
                value={scraperData.urls ? scraperData.urls.join('\n') : ''}
                className="textarea textarea-bordered h-32 font-mono"
                readOnly
              />
            </div>
          </div>
        )}
      </div>

      {/* Fields Section */}
      <div className="p-4 bg-base-200 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Fields</h2>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={index} className="flex gap-4">
              <div className="form-control flex-1">
                <label className="label">
                  <span className="label-text">Field ID</span>
                </label>
                <input
                  type="text"
                  value={field.id}
                  onChange={(e) => {
                    const newValue = e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, '');
                    const newFields = [...fields];
                    newFields[index] = { ...field, id: newValue };
                    setFields(newFields);
                  }}
                  placeholder="Enter field id"
                  className="input input-bordered w-full"
                />
              </div>
              <div className="form-control flex-1">
                <label className="label">
                  <span className="label-text">Prompt</span>
                </label>
                <input
                  type="text"
                  value={field.prompt}
                  onChange={(e) => {
                    const newFields = [...fields];
                    newFields[index] = { ...field, prompt: e.target.value };
                    setFields(newFields);
                  }}
                  placeholder="Enter prompt"
                  className="input input-bordered w-full"
                />
              </div>
            </div>
          ))}
          
          <button
            className="btn btn-secondary w-full"
            onClick={() => setFields([...fields, { id: '', prompt: '' }])}
          >
            Add Field
          </button>

          <button
            className={`btn btn-primary w-full ${isSaving ? 'loading' : ''}`}
            onClick={async () => {
              try {
                setIsSaving(true);
                const response = await fetch('/api/scrapers/fields', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    scraperId,
                    fields: fields
                  })
                });

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.error || 'Failed to save fields');
                }

                toast.success('Fields saved successfully');
                router.push(`/scrape?id=${scraperId}`);
              } catch (error) {
                console.error('Error saving fields:', error);
                toast.error(error.message || 'Failed to save fields');
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving}
          >
            Save & Proceed
          </button>
        </div>
      </div>
    </main>
  );
}
