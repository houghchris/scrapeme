'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import NavigationBar from "@/components/NavigationBar";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Usage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [usageData, setUsageData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch usage data
  useEffect(() => {
    const fetchUsageData = async () => {
      if (status !== "authenticated") return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/credit-usage?days=${selectedPeriod}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch usage data");
        }

        setUsageData(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsageData();
  }, [selectedPeriod, status]);

  // Prepare chart data
  const chartData = {
    labels: [],
    datasets: [
      {
        label: 'Map Credits',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'Scrape Credits',
        data: [],
        borderColor: 'rgb(153, 102, 255)',
        tension: 0.1
      }
    ]
  };

  if (usageData?.dailyUsage) {
    const dates = [...new Set(usageData.dailyUsage.map(item => item._id.date))];
    chartData.labels = dates;

    dates.forEach(date => {
      const mapUsage = usageData.dailyUsage.find(
        item => item._id.date === date && item._id.operationType === 'map'
      );
      const scrapeUsage = usageData.dailyUsage.find(
        item => item._id.date === date && item._id.operationType === 'scrape'
      );

      chartData.datasets[0].data.push(mapUsage?.totalCredits || 0);
      chartData.datasets[1].data.push(scrapeUsage?.totalCredits || 0);
    });
  }

  return (
    <main className="min-h-screen p-8 pb-24 max-w-6xl mx-auto space-y-8">
      <NavigationBar />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <>
          {/* Credit Usage Overview */}
          <div className="bg-base-200 rounded-lg p-6">
            <div className="flex justify-between mb-5">
              <div>
                <h5 className="text-3xl font-bold pb-2">
                  {usageData?.totalCredits || 0}
                </h5>
                <p className="text-base">
                  Credits used in the last {selectedPeriod} days
                </p>
              </div>
              <div className={`flex items-center px-2.5 py-0.5 text-base font-semibold ${
                usageData?.percentageChange >= 0 ? 'text-success' : 'text-error'
              }`}>
                {Math.abs(usageData?.percentageChange || 0).toFixed(1)}%
                {usageData?.percentageChange >= 0 ? (
                  <svg className="w-3 h-3 ms-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13V1m0 0L1 5m4-4 4 4"/>
                  </svg>
                ) : (
                  <svg className="w-3 h-3 ms-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1v12m0 0l4-4m-4 4L1 9"/>
                  </svg>
                )}
              </div>
            </div>

            {/* Chart */}
            <div className="h-64">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>

            {/* Period Selector */}
            <div className="flex justify-between items-center border-t border-base-300 mt-5 pt-5">
              <select
                className="select select-bordered w-full max-w-xs"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>

          {/* Recent Usage Table */}
          <div className="bg-base-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Recent Credit Usage</h2>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Scraper</th>
                    <th>Operation</th>
                    <th>Credits Used</th>
                  </tr>
                </thead>
                <tbody>
                  {usageData?.recentUsage.map((usage, index) => (
                    <tr key={index}>
                      <td>{new Date(usage.timestamp).toLocaleString()}</td>
                      <td>{usage.scraperId?.name || 'Unknown'}</td>
                      <td className="capitalize">{usage.operationType}</td>
                      <td>{usage.creditsUsed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
