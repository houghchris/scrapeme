'use client';

import ButtonAccount from "@/components/ButtonAccount";
import NavigationBar from "@/components/NavigationBar";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function Setup() {
  return (
    <Suspense fallback={
      <main className="min-h-screen p-8 pb-24 max-w-6xl mx-auto space-y-8">
        <NavigationBar />
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </main>
    }>
      <SetupContent />
    </Suspense>
  );
}

function SetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const scraperId = searchParams.get('id');
  
  const [formData, setFormData] = useState({
    name: "",
    websiteUrl: "",
    urlPath: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [touched, setTouched] = useState({
    name: false,
    websiteUrl: false,
  });

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch existing scraper data if ID is provided
  useEffect(() => {
    const fetchScraper = async () => {
      if (!scraperId) {
        setIsLoading(false);
        return;
      }

      if (status !== "authenticated") {
        return;
      }

      try {
        const response = await fetch(`/api/scrapers/${scraperId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error fetching scraper data");
        }

        console.log('Fetched scraper data:', data);
        
        // Pre-populate form data
        setFormData({
          name: data.name || "",
          websiteUrl: data.websiteUrl || "",
          urlPath: data.urlPath || "",
        });
      } catch (error) {
        console.error("Error:", error);
        toast.error(error.message || "Failed to load scraper data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchScraper();
  }, [scraperId, status]);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form submission
    
    // Mark all fields as touched
    setTouched({
      name: true,
      websiteUrl: true,
    });

    // Validate required fields
    if (!formData.name || !formData.websiteUrl) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch("/api/scrapers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error creating scraper");
      }

      toast.success("Scraper created successfully!");
      
      // Clear form
      setFormData({
        name: "",
        websiteUrl: "",
        urlPath: "",
      });
      // Reset touched state
      setTouched({
        name: false,
        websiteUrl: false,
      });

      // Redirect to the Map page with the scraper ID
      window.location.href = `/map?id=${data.scraper._id}`;
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));
  };

  // Validation states
  const showNameError = touched.name && !formData.name;
  const showUrlError = touched.websiteUrl && !formData.websiteUrl;

  return (
    <main className="min-h-screen p-8 pb-24 max-w-6xl mx-auto space-y-8">
      {/* Navigation Bar */}
      <NavigationBar />

      {/* Steps Section */}
      <div className="p-4 bg-base-200 rounded-lg">
        <ul className="steps w-full">
          <li className="step step-primary">Setup</li>
          <li className="step">Map</li>
          <li className="step">Fields</li>
          <li className="step">Scrape</li>
          <li className="step">Result</li>
        </ul>
      </div>

      {/* Setup Form */}
      <div className="p-4 bg-base-200 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Setup Scraper</h2>
        {isLoading ? (
          <div className="flex justify-center items-center p-4">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Scraper Name <span className="text-error">*</span></span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur('name')}
                className={`input input-bordered w-full ${showNameError ? 'input-error' : ''}`}
                placeholder="Enter scraper name"
              />
              {showNameError && (
                <label className="label">
                  <span className="label-text-alt text-error">Name is required</span>
                </label>
              )}
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Website URL <span className="text-error">*</span></span>
              </label>
              <input
                type="url"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleChange}
                onBlur={() => handleBlur('websiteUrl')}
                className={`input input-bordered w-full ${showUrlError ? 'input-error' : ''}`}
                placeholder="https://example.com"
              />
              {showUrlError && (
                <label className="label">
                  <span className="label-text-alt text-error">Website URL is required</span>
                </label>
              )}
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">URL Path</span>
                <span className="label-text-alt text-info">Optional</span>
              </label>
              <input
                type="text"
                name="urlPath"
                value={formData.urlPath}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="/result/"
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Scraper"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
