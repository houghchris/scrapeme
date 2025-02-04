'use client';

import ButtonAccount from "@/components/ButtonAccount";
import { useState } from "react";
import toast from "react-hot-toast";

export default function Setup() {
  const [formData, setFormData] = useState({
    name: "",
    websiteUrl: "",
    urlPath: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    websiteUrl: false,
  });

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

      {/* Buttons Section */}
      <div className="p-4 bg-base-200 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn">Button</button>
          <button className="btn btn-neutral">Neutral</button>
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-secondary">Secondary</button>
          <button className="btn btn-accent">Accent</button>
          <button className="btn btn-ghost">Ghost</button>
          <button className="btn btn-link">Link</button>
        </div>
      </div>

      {/* Input Fields Section */}
      <form onSubmit={handleSubmit} className="p-4 bg-base-200 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Scraper Setup</h2>
        <div className="flex flex-col gap-4">
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
        </div>
      </form>
    </main>
  );
}
