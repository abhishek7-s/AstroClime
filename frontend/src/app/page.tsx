
'use client'; 

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

// Chart.js imports (no change)
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// --- TypeScript Type Definitions (no change) ---
interface PositionState { lat: number; lng: number; }
interface ThresholdState { temp: number; rain: number; wind: number; }
interface MetricHistory { labels: number[]; data: number[]; }
interface MetricAnalysis { probability: number; trend: 'Increasing' | 'Decreasing' | 'Stable'; history: MetricHistory; }
interface AnalysisState { overallRiskScore: number; temperature: MetricAnalysis; precipitation: MetricAnalysis; wind: MetricAnalysis; rawDataUrl: string; }
interface AnalysisCardProps { metric: MetricAnalysis; name: string; unit: string; }


function AnalysisCard({ metric, name, unit }: AnalysisCardProps) {
  const chartData = { labels: metric.history.labels, datasets: [{ label: `${name} (${unit})`, data: metric.history.data, borderColor: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.2)', tension: 0.3, fill: true, pointRadius: 0, hoverRadius: 5 }], };
  const chartOptions = { 
    responsive: true, 
    maintainAspectRatio: false, // Allows chart to fill parent div better
    plugins: { 
      legend: { display: false }, 
      title: { display: true, text: `Historical Trend`, color: '#9ca3af', font: { size: 14 } }, 
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    }, 
    scales: { 
      x: { 
        ticks: { color: '#9ca3af' }, 
        grid: { color: 'rgba(107, 114, 128, 0.2)' } 
      }, 
      y: { 
        ticks: { color: '#9ca3af' }, 
        grid: { color: 'rgba(107, 114, 128, 0.2)' } 
      }, 
    }, 
  };
  const trendColor = metric.trend.toLowerCase() === 'increasing' ? 'text-red-400' : metric.trend.toLowerCase() === 'decreasing' ? 'text-green-400' : 'text-gray-400';
  const trendArrow = metric.trend.toLowerCase() === 'increasing' ? '▲' : metric.trend.toLowerCase() === 'decreasing' ? '▼' : '▬';
  
  return ( 
    <div className="bg-gray-800/60 border border-gray-700 p-5 rounded-xl shadow-lg  transition-shadow duration-300"> 
      <h3 className="text-xl font-semibold text-cyan-300 mb-3">{name}</h3> 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center"> 
        <div> 
          <p className="text-md text-gray-300">Risk of exceeding threshold:</p> 
          <p className="text-5xl font-extrabold text-cyan-400 my-2">{metric.probability.toFixed(1)}%</p> 
          <p className="mt-3 text-gray-400"> Long-Term Trend: <span className={`${trendColor} font-bold text-lg`}>{trendArrow} {metric.trend}</span> </p> 
        </div> 
        <div className="h-48 w-full"> {/* Increased height for better chart visibility */}
          <Line options={chartOptions} data={chartData} /> 
        </div> 
      </div> 
    </div> 
  );
}


// --- Main Page Component ---
export default function HomePage() {
  // State Management
  const [position, setPosition] = useState<PositionState>({ lat: 28.6139, lng: 77.2090 });
  const [date, setDate] = useState<string>('2025-10-15');
  const [thresholds, setThresholds] = useState<ThresholdState>({ temp: 35, rain: 5, wind: 25 });
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // --- NEW: State for the search query ---
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Dynamic import for the 2D Map component
  const Map = useMemo(() => dynamic(
    () => import('./MapComponent'),
    { 
      loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400 rounded-lg animate-pulse"><p>Loading Map...</p></div>,
      ssr: false 
    }
  ), []);

  const getDayOfYear = (dateString: string): number => { const date = new Date(dateString); const start = new Date(date.getFullYear(), 0, 0); const diff = date.getTime() - start.getTime(); const oneDay = 1000 * 60 * 60 * 24; return Math.floor(diff / oneDay); };
  
  const handleAnalysis = async (): Promise<void> => {
    setIsLoading(true);
    setAnalysis(null);
    setError(null);
    
    // Read the backend URL from the environment variable
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      setError("API URL is not configured. Please check your .env.local file.");
      setIsLoading(false);
      return;
    }

    try {
      // Use the variable to construct the full API endpoint
      const response = await axios.get(`${apiUrl}/weather-risk`, {
        params: {
          lat: position.lat,
          lon: position.lng,
          dayOfYear: getDayOfYear(date),
          tempThreshold: thresholds.temp,
          rainThreshold: thresholds.rain,
          windThreshold: thresholds.wind
        }
      });
      setAnalysis(response.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Failed to fetch weather analysis.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- NEW: Function to handle the city search ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a city name to search.");
      return;
    }
    setError(null);
    try {
      // Using OpenStreetMap Nominatim for geocoding
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      if (response.data && response.data.length > 0) {
        const { lat, lon, display_name } = response.data[0];
        setPosition({ lat: parseFloat(lat), lng: parseFloat(lon) });
        // Optional: Provide feedback to the user about the found location
        console.log(`Location found: ${display_name}`);
      } else {
        setError("City not found. Please try a different search.");
      }
    } catch (e) {
      setError("Failed to fetch location data. Please check your internet connection.");
      console.error(e);
    }
  };


  // --- NEW: Function to determine suitability for outdoor activities ---
  const getOutdoorSuitabilityMessage = (score: number) => {
    if (score <= 3.5) {
      return (
        <p className="text-green-300 text-lg mt-4 leading-relaxed">
           Weather shows a <b>low risk</b>. Plan your event with confidence.
        </p>
      );
    } else if (score <= 6.5) {
      return (
        <p className="text-yellow-300 text-lg mt-4 leading-relaxed">
          Weather shows a <b>moderate risk</b> — outdoor plans are possible but keep a backup in mind.
        </p>
      );
    } else {
      return (
        <p className="text-red-300 text-lg mt-4 leading-relaxed">
          A <b>high risk</b> of bad weather is expected. It’s best to reschedule or prepare indoor options.
        </p>
      );
    }
  };


  return (
    <main className="bg-gradient-to-br from-gray-900 to-gray-950 text-white min-h-screen font-sans p-4 sm:p-6 lg:p-10">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin=""/>
      
      <div className="max-w-screen-xl mx-auto">
        <header className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-cyan-400 drop-shadow-lg">AstroClime</h1>
          <p className="text-lg sm:text-xl text-gray-300 mt-4 max-w-2xl mx-auto">
            Plan your outdoor event with confidence using historical NASA climate data and advanced risk analysis.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Panel: Controls */}
          <div className="bg-gray-800 border border-gray-700 p-7 rounded-2xl shadow-xl flex flex-col h-full transform transition-all duration-300 ">
            <h2 className="text-3xl font-bold text-cyan-300 mb-6 pb-4 border-b border-gray-700">1. Event Location & Date</h2>

            {/* --- NEW: Search Bar --- */}
            <div className="mb-6">
              <label htmlFor="search" className="block text-lg font-medium text-gray-300 mb-3">Search for a City:</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g., London, UK or New York City"
                  className="w-full bg-gray-700 text-gray-100 p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                />
                <button
                  onClick={handleSearch}
                  className="bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="mb-6"> 
              <label className="block text-lg font-medium text-gray-300 mb-3">Or click on the map:</label>
              <div className="h-72 md:h-80 w-full rounded-xl overflow-hidden border-2 border-gray-600 shadow-inner">
                  <Map position={position} setPosition={setPosition}/>
              </div>
               <p className="text-sm text-gray-400 mt-3 text-center">Lat: <span className="font-semibold text-cyan-200">{position.lat.toFixed(4)}</span>, Lon: <span className="font-semibold text-cyan-200">{position.lng.toFixed(4)}</span></p>
            </div>
            
            <div className="mb-8"> 
              <label htmlFor="date" className="block text-lg font-medium text-gray-300 mb-3">Event Date:</label> 
              <input 
                type="date" 
                id="date" 
                value={date} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} 
                className="w-full bg-gray-700 text-gray-100 p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all duration-200"
              /> 
            </div>

            <h2 className="text-3xl font-bold text-cyan-300 mb-6 pb-4 border-b border-gray-700">2. Define &quot;Adverse Conditions&quot;</h2>
            <div className="space-y-6 flex-grow">
                <div> 
                  <label htmlFor="temp" className="block font-medium mb-2 text-gray-300">&quot;Too Hot&quot; if Temperature &gt; <span className="text-cyan-300 font-bold">{thresholds.temp}°C</span></label> 
                  <input type="range" id="temp" name="temp" min="10" max="50" value={thresholds.temp} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThresholds({...thresholds, temp: Number(e.target.value)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 transition-colors duration-200" /> 
                </div>
                <div> 
                  <label htmlFor="rain" className="block font-medium mb-2 text-gray-300">&quot;Too Wet&quot; if Rain &gt; <span className="text-cyan-300 font-bold">{thresholds.rain} mm/day</span></label> 
                  <input type="range" id="rain" name="rain" min="0" max="100" step="1" value={thresholds.rain} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThresholds({...thresholds, rain: Number(e.target.value)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 transition-colors duration-200" /> 
                </div>
                <div> 
                  <label htmlFor="wind" className="block font-medium mb-2 text-gray-300">&quot;Too Windy&quot; if Wind &gt; <span className="text-cyan-300 font-bold">{thresholds.wind} km/h</span></label> 
                  <input type="range" id="wind" name="wind" min="5" max="80" value={thresholds.wind} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThresholds({...thresholds, wind: Number(e.target.value)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 transition-colors duration-200" /> 
                </div>
            </div>
            
            <div className="mt-10 pt-6 border-t border-gray-700 text-center"> 
              <button 
                onClick={handleAnalysis} 
                disabled={isLoading} 
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-extrabold py-4 px-6 rounded-xl text-2xl transition duration-300 ease-in-out transform hover:scale-105 shadow-lg "
              > 
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Data...
                  </span>
                ) : 'Analyze Weather Risk'} 
              </button> 
            </div>
          </div>

          {/* Right Panel: Results */}
          <div className="bg-gray-800 border border-gray-700 p-7 rounded-2xl shadow-xl flex flex-col transform transition-all duration-300 ">
            <h2 className="text-3xl font-bold text-cyan-300 mb-6 pb-4 border-b border-gray-700">3. Historical Weather Risk Analysis</h2>
            <div className="flex-grow flex items-center justify-center min-h-[400px]"> {/* Added min-h for consistent height */}
              {isLoading && (
                <div className="text-center text-gray-300 p-6 rounded-lg">
                  <div className="animate-bounce-slow rounded-full h-16 w-16 border-b-4 border-cyan-400 mx-auto mb-4"></div>
                  <p className="mt-4 text-xl font-semibold">Fetching decades of NASA data...</p>
                  <p className="text-md text-gray-400">This might take a moment.</p>
                </div>
              )}
              {error && (
                <div className="bg-red-900/40 border border-red-600 p-6 rounded-xl text-center shadow-lg animate-fade-in-up">
                  <p className="font-bold text-xl text-red-300 mb-2">Analysis Error</p>
                  <p className="text-red-100">{error}</p>
                  <p className="text-sm text-red-200 mt-3">Please adjust your inputs or try again later.</p>
                </div>
              )}
              {!isLoading && !analysis && !error && (
                <div className="text-center text-gray-400 p-6 rounded-lg border border-gray-700 border-dashed animate-fade-in">
                  <p className="text-2xl font-semibold text-gray-300 mb-3">Your Event&apos;s Climate Story Awaits</p>
                  <p className="text-lg">Click &quot;Analyze Weather Risk&quot; to unveil a detailed historical analysis for your chosen location and date.</p>
                  <p className="text-sm text-gray-500 mt-2">Powered by NASA&apos;s climate archives.</p>
                </div>
              )}
              {analysis && ( 
                <div className="space-y-6 w-full animate-fade-in-up"> 
                  <div className="text-center bg-gray-800/60 border border-gray-700 p-5 rounded-xl shadow-lg"> 
                    <p className="text-lg text-gray-300">Overall Weather Risk Score</p> 
                    <p className={`text-7xl font-extrabold my-3 ${ 
                        analysis.overallRiskScore > 7 ? 'text-red-500' 
                      : analysis.overallRiskScore > 4 ? 'text-yellow-500' 
                      : 'text-green-500' 
                    }`}>
                      {analysis.overallRiskScore.toFixed(1)} <span className="text-4xl text-gray-400">/ 10</span>
                    </p> 
                    <p className="text-md text-gray-400">Based on your defined adverse conditions.</p>
                    
                    {/* --- NEW: Outdoor Activity Suitability Message --- */}
                    {getOutdoorSuitabilityMessage(analysis.overallRiskScore)}
                  </div> 
                  <AnalysisCard metric={analysis.temperature} name="Max Temperature" unit="°C" /> 
                  <AnalysisCard metric={analysis.precipitation} name="Precipitation" unit="mm/day" /> 
                  <AnalysisCard metric={analysis.wind} name="Wind Speed" unit="km/h" /> 
                  <div className="text-center pt-6"> 
                    <a href={analysis.rawDataUrl} target="_blank" rel="noopener noreferrer" 
                       className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"> 
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5L6 11H5a1 1 0 00-1 1v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-1-1h-1.133l-2.133-4.5a1 1 0 00-.867-.5zM9 9a1 1 0 00-1 1v1a1 1 0 001 1h2a1 1 0 001-1v-1a1 1 0 00-1-1H9z" clipRule="evenodd" />
                       </svg>
                       View Raw Data Source 
                    </a> 
                  </div> 
                </div> 
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}