// 'use client'; 

// import React, { useState, useMemo } from 'react';
// import dynamic from 'next/dynamic';
// import axios from 'axios';

// // Import Chart.js and its components
// import { Line } from 'react-chartjs-2';
// import {
//   Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
// } from 'chart.js';

// ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// // --- TypeScript Type Definitions ---
// interface PositionState {
//   lat: number;
//   lng: number;
// }
// interface ThresholdState {
//   temp: number;
//   rain: number;
//   wind: number;
// }
// interface MetricHistory {
//   labels: number[];
//   data: number[];
// }
// interface MetricAnalysis {
//   probability: number;
//   trend: 'Increasing' | 'Decreasing' | 'Stable';
//   history: MetricHistory;
// }
// interface AnalysisState {
//   overallRiskScore: number;
//   temperature: MetricAnalysis;
//   precipitation: MetricAnalysis;
//   wind: MetricAnalysis;
//   rawDataUrl: string;
// }
// interface AnalysisCardProps {
//   metric: MetricAnalysis;
//   name: string;
//   unit: string;
// }

// // --- Reusable Sub-Components ---
// function AnalysisCard({ metric, name, unit }: AnalysisCardProps) {
//   const chartData = {
//     labels: metric.history.labels,
//     datasets: [{
//       label: `${name} (${unit})`,
//       data: metric.history.data,
//       borderColor: '#22d3ee',
//       backgroundColor: 'rgba(34, 211, 238, 0.2)',
//       tension: 0.3,
//       fill: true,
//     }],
//   };
//   const chartOptions = {
//     responsive: true,
//     plugins: {
//       legend: { display: false },
//       title: { display: true, text: `Historical Trend for ${name}`, color: '#ffffff' },
//     },
//     scales: {
//       x: { ticks: { color: '#9ca3af' } },
//       y: { ticks: { color: '#9ca3af' } },
//     },
//   };
  
//   const trendColor = metric.trend.toLowerCase() === 'increasing' ? 'text-red-400' : metric.trend.toLowerCase() === 'decreasing' ? 'text-green-400' : 'text-gray-400';
//   const trendArrow = metric.trend.toLowerCase() === 'increasing' ? '▲' : metric.trend.toLowerCase() === 'decreasing' ? '▼' : '▬';

//   return (
//     <div className="bg-gray-900/50 p-4 rounded-lg backdrop-blur-sm">
//       <h3 className="text-xl font-semibold mb-2">{name}</h3>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
//         <div>
//           <p className="text-lg">Chance of exceeding threshold:</p>
//           <p className="text-4xl font-bold text-cyan-400">{metric.probability.toFixed(1)}%</p>
//           <p className="mt-2">
//             Historical Trend: <span className={`${trendColor} font-semibold`}>{trendArrow} {metric.trend}</span>
//           </p>
//         </div>
//         <div className="h-40">
//            <Line options={chartOptions} data={chartData} />
//         </div>
//       </div>
//     </div>
//   );
// }

// // --- Main Page Component ---
// export default function HomePage() {
//   // --- STATE MANAGEMENT with TypeScript ---
//   const [position, setPosition] = useState<PositionState>({ lat: 19.9975, lng: 73.7898 });
//   const [date, setDate] = useState<string>('2025-10-15');
//   const [thresholds, setThresholds] = useState<ThresholdState>({ temp: 35, rain: 5, wind: 25 });
//   const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);

//   const Map = useMemo(() => dynamic(
//     () => import('./MapComponent'),
//     { 
//       loading: () => <p className="text-center h-full flex items-center justify-center">Loading map...</p>,
//       ssr: false
//     }
//   ), []);

//   const getDayOfYear = (dateString: string): number => {
//     const date = new Date(dateString);
//     const start = new Date(date.getFullYear(), 0, 0);
//     const diff = date.getTime() - start.getTime();
//     const oneDay = 1000 * 60 * 60 * 24;
//     return Math.floor(diff / oneDay);
//   };

//   const handleAnalysis = async (): Promise<void> => {
//     // Stage 2: Log to console. Stage 3 will connect to the API.
//     console.log("--- Preparing to Analyze (TypeScript) ---");
//     console.log("Position:", position);
//     console.log("Date:", date);
//     console.log("Day of Year:", getDayOfYear(date));
//     console.log("Thresholds:", thresholds);
//     alert("Check the developer console (F12) to see the selected data! API connection coming in Stage 3.");
//   };

//   return (
//       <main className="bg-gray-900 text-white min-h-screen font-sans p-4 sm:p-6 lg:p-8">
//         <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin=""/>
        
//         <div className="max-w-7xl mx-auto">
//           <header className="text-center mb-10">
//             <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400">AstroClime</h1>
//             <p className="text-lg text-gray-400 mt-2">Plan your outdoor event with confidence using historical NASA climate data.</p>
//           </header>

//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//             <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col">
//               <h2 className="text-2xl font-semibold mb-4 border-b-2 border-cyan-500 pb-2">1. Your Event Details</h2>
//               <div className="mb-6">
//                 <label className="block text-lg font-medium mb-2">Location: (Click on the map)</label>
//                 <div className="h-64 md:h-80 w-full rounded-lg overflow-hidden border-2 border-gray-600">
//                     <Map position={position} setPosition={setPosition}/>
//                 </div>
//                  <p className="text-sm text-gray-400 mt-2">Lat: {position.lat.toFixed(4)}, Lon: {position.lng.toFixed(4)}</p>
//               </div>
//               <div className="mb-6">
//                 <label htmlFor="date" className="block text-lg font-medium mb-2">Date:</label>
//                 <input type="date" id="date" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"/>
//               </div>
//               <h2 className="text-2xl font-semibold mb-4 mt-8 border-b-2 border-cyan-500 pb-2">2. Define "Bad Weather"</h2>
//               <div className="space-y-4">
//                   <div>
//                       <label htmlFor="temp" className="block font-medium">"Too Hot" if Temp {'>'} {thresholds.temp}°C</label>
//                       <input type="range" id="temp" name="temp" min="20" max="50" value={thresholds.temp} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThresholds({...thresholds, temp: Number(e.target.value)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
//                   </div>
//                    <div>
//                       <label htmlFor="rain" className="block font-medium">"Too Wet" if Rain {'>'} {thresholds.rain} mm/day</label>
//                       <input type="range" id="rain" name="rain" min="1" max="50" step="1" value={thresholds.rain} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThresholds({...thresholds, rain: Number(e.target.value)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
//                   </div>
//                    <div>
//                       <label htmlFor="wind" className="block font-medium">"Too Windy" if Wind {'>'} {thresholds.wind} km/h</label>
//                       <input type="range" id="wind" name="wind" min="5" max="60" value={thresholds.wind} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThresholds({...thresholds, wind: Number(e.target.value)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
//                   </div>
//               </div>
//               <div className="mt-auto pt-8 text-center">
//                 <button onClick={handleAnalysis} disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg text-xl transition duration-300 shadow-lg">
//                   {isLoading ? 'Analyzing...' : 'Analyze Weather Risk'}
//                 </button>
//               </div>
//             </div>
//             <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
//               <h2 className="text-2xl font-semibold mb-4 border-b-2 border-cyan-500 pb-2">3. Historical Weather Risk</h2>
//               <div className="flex items-center justify-center h-full">
//                 {isLoading && <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div><p className="mt-4 text-lg">Fetching decades of NASA data...</p></div>}
//                 {error && <div className="bg-red-900/80 border border-red-600 p-4 rounded-lg text-center"><p className="font-bold">Error</p><p>{error}</p></div>}
//                 {!isLoading && !analysis && !error && <div className="text-center text-gray-400"><p className="text-xl">Your personalized weather risk analysis will appear here.</p></div>}
//                 {analysis && (
//                   <div className="space-y-6 w-full">
//                     <div className="text-center bg-gray-900/50 p-4 rounded-lg">
//                       <p className="text-lg text-gray-400">Overall Weather Risk Score</p>
//                       <p className={`text-6xl font-bold ${
//                         analysis.overallRiskScore > 6.5 ? 'text-red-500' :
//                         analysis.overallRiskScore > 3.5 ? 'text-yellow-500' : 'text-green-500'
//                       }`}>{analysis.overallRiskScore.toFixed(1)} / 10</p>
//                     </div>
//                     <AnalysisCard metric={analysis.temperature} name="Max Temperature" unit="°C" />
//                     <AnalysisCard metric={analysis.precipitation} name="Precipitation" unit="mm/day" />
//                     <AnalysisCard metric={analysis.wind} name="Wind Speed" unit="km/h" />
//                     <div className="text-center pt-4">
//                         <a href={analysis.rawDataUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
//                           View Raw Data Source
//                         </a>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>
//   );
// }






'use client'; 

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

// Chart.js imports
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// --- TypeScript Type Definitions ---
interface PositionState {
  lat: number;
  lng: number;
}
interface ThresholdState {
  temp: number;
  rain: number;
  wind: number;
}
interface MetricHistory {
  labels: number[];
  data: number[];
}
interface MetricAnalysis {
  probability: number;
  trend: 'Increasing' | 'Decreasing' | 'Stable';
  history: MetricHistory;
}
interface AnalysisState {
  overallRiskScore: number;
  temperature: MetricAnalysis;
  precipitation: MetricAnalysis;
  wind: MetricAnalysis;
  rawDataUrl: string;
}
interface AnalysisCardProps {
  metric: MetricAnalysis;
  name: string;
  unit: string;
}

// --- Reusable Sub-Components ---
function AnalysisCard({ metric, name, unit }: AnalysisCardProps) {
  const chartData = {
    labels: metric.history.labels,
    datasets: [{
      label: `${name} (${unit})`,
      data: metric.history.data,
      borderColor: '#22d3ee',
      backgroundColor: 'rgba(34, 211, 238, 0.2)',
      tension: 0.3,
      fill: true,
    }],
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: `Historical Trend`, color: '#9ca3af' },
    },
    scales: {
      x: { ticks: { color: '#9ca3af' } },
      y: { ticks: { color: '#9ca3af' } },
    },
  };
  
  const trendColor = metric.trend.toLowerCase() === 'increasing' ? 'text-red-400' : metric.trend.toLowerCase() === 'decreasing' ? 'text-green-400' : 'text-gray-400';
  const trendArrow = metric.trend.toLowerCase() === 'increasing' ? '▲' : metric.trend.toLowerCase() === 'decreasing' ? '▼' : '▬';

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg">
      <h3 className="text-xl font-semibold mb-2">{name}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <p className="text-lg">Risk of exceeding threshold:</p>
          <p className="text-4xl font-bold text-cyan-400">{metric.probability.toFixed(1)}%</p>
          <p className="mt-2">
            Long-Term Trend: <span className={`${trendColor} font-semibold`}>{trendArrow} {metric.trend}</span>
          </p>
        </div>
        <div className="h-40">
           <Line options={chartOptions} data={chartData} />
        </div>
      </div>
    </div>
  );
}


// --- Main Page Component ---
export default function HomePage() {
  // State Management
  const [position, setPosition] = useState<PositionState>({ lat: 28.6139, lng: 77.2090 }); // Default: New Delhi
  const [date, setDate] = useState<string>('2025-10-15');
  const [thresholds, setThresholds] = useState<ThresholdState>({ temp: 35, rain: 5, wind: 25 });
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic import for the Globe component
  const Globe = useMemo(() => dynamic(
    () => import('./GlobeComponent'),
    { 
      loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Globe...</p></div>,
      ssr: false
    }
  ), []);

  const getDayOfYear = (dateString: string): number => {
    const date = new Date(dateString);
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const handleAnalysis = async (): Promise<void> => {
    setIsLoading(true);
    setAnalysis(null);
    setError(null);
    
    try {
      const response = await axios.get('http://localhost:3001/weather-risk', {
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
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Failed to fetch weather analysis.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-screen h-screen bg-black text-white font-sans flex items-center justify-center overflow-hidden">
      {/* The 3D Globe is the background */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <Globe position={position} setPosition={setPosition} />
      </div>

      {/* The UI panels float on top */}
      <div className="relative z-10 w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row justify-between gap-8 pointer-events-none">
        
        {/* Left Panel: Controls */}
        <div className="w-full lg:w-1/3 lg:max-w-md h-auto lg:h-full bg-gray-900/70 backdrop-blur-md rounded-xl shadow-lg p-6 flex flex-col pointer-events-auto overflow-y-auto">
          <header className="text-center mb-6">
            <h1 className="text-3xl font-bold text-cyan-400">AstroClime</h1>
            <p className="text-md text-gray-400 mt-1">Click the globe to select a location</p>
          </header>

          <div className="mb-6">
            <p className="block text-lg font-medium mb-2">Selected Location:</p>
            <p className="text-md text-cyan-400">Lat: {position.lat.toFixed(4)}, Lon: {position.lng.toFixed(4)}</p>
          </div>
          <div className="mb-6">
            <label htmlFor="date" className="block text-lg font-medium mb-2">Event Date:</label>
            <input type="date" id="date" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"/>
          </div>

          <h2 className="text-xl font-semibold mb-4 mt-4 border-b border-cyan-500/50 pb-2">Risk Thresholds</h2>
          <div className="space-y-4">
              <div>
                  <label htmlFor="temp" className="block font-medium">&quot;Too Hot&quot; if Temp {'>'} {thresholds.temp}°C</label>
                  <input type="range" id="temp" name="temp" min="20" max="50" value={thresholds.temp} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThresholds({...thresholds, temp: Number(e.target.value)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
              </div>
               <div>
                  <label htmlFor="rain" className="block font-medium">&quot;Too Wet&quot; if Rain {'>'} {thresholds.rain} mm/day</label>
                  <input type="range" id="rain" name="rain" min="1" max="50" step="1" value={thresholds.rain} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThresholds({...thresholds, rain: Number(e.target.value)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
              </div>
               <div>
                  <label htmlFor="wind" className="block font-medium">&quot;Too Windy&quot; if Wind {'>'} {thresholds.wind} km/h</label>
                  <input type="range" id="wind" name="wind" min="5" max="60" value={thresholds.wind} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThresholds({...thresholds, wind: Number(e.target.value)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
              </div>
          </div>
          
          <div className="mt-auto pt-8 text-center">
            <button onClick={handleAnalysis} disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg text-xl transition duration-300 shadow-lg">
              {isLoading ? 'Analyzing...' : 'Analyze Weather Risk'}
            </button>
          </div>
        </div>

        {/* Right Panel: Results (appears only when there's data or an error) */}
        {(analysis || error) && (
            <div className="w-full lg:w-1/3 lg:max-w-md h-auto lg:h-full bg-gray-900/70 backdrop-blur-md rounded-xl shadow-lg p-6 flex flex-col pointer-events-auto overflow-y-auto">
                 {error && <div className="m-auto text-center"><div className="bg-red-900/80 border border-red-600 p-4 rounded-lg"><p className="font-bold">Error</p><p>{error}</p></div></div>}
                 {analysis && (
                  <div className="space-y-6 w-full">
                    <h2 className="text-2xl font-semibold text-center">Analysis Results</h2>
                    <div className="text-center bg-gray-900/50 p-4 rounded-lg">
                      <p className="text-lg text-gray-400">Overall Weather Risk Score</p>
                      <p className={`text-6xl font-bold ${
                        analysis.overallRiskScore > 6.5 ? 'text-red-500' :
                        analysis.overallRiskScore > 3.5 ? 'text-yellow-500' : 'text-green-500'
                      }`}>{analysis.overallRiskScore.toFixed(1)} / 10</p>
                    </div>
                    <AnalysisCard metric={analysis.temperature} name="Max Temperature" unit="°C" />
                    <AnalysisCard metric={analysis.precipitation} name="Precipitation" unit="mm/day" />
                    <AnalysisCard metric={analysis.wind} name="Wind Speed" unit="km/h" />
                    <div className="text-center pt-4">
                        <a href={analysis.rawDataUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                          View Raw Data Source
                        </a>
                    </div>
                  </div>
                 )}
            </div>
        )}
      </div>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="text-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div><p className="mt-4 text-xl">Fetching decades of NASA data...</p></div>
        </div>
      )}
    </main>
  );
}