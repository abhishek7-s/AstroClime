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


// --- Reusable Sub-Components (no change) ---
function AnalysisCard({ metric, name, unit }: AnalysisCardProps) {
  const chartData = { labels: metric.history.labels, datasets: [{ label: `${name} (${unit})`, data: metric.history.data, borderColor: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.2)', tension: 0.3, fill: true, }], };
  const chartOptions = { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: `Historical Trend`, color: '#9ca3af' }, }, scales: { x: { ticks: { color: '#9ca3af' } }, y: { ticks: { color: '#9ca3af' } }, }, };
  const trendColor = metric.trend.toLowerCase() === 'increasing' ? 'text-red-400' : metric.trend.toLowerCase() === 'decreasing' ? 'text-green-400' : 'text-gray-400';
  const trendArrow = metric.trend.toLowerCase() === 'increasing' ? '▲' : metric.trend.toLowerCase() === 'decreasing' ? '▼' : '▬';
  return ( <div className="bg-gray-700/50 p-4 rounded-lg"> <h3 className="text-xl font-semibold mb-2">{name}</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center"> <div> <p className="text-lg">Risk of exceeding threshold:</p> <p className="text-4xl font-bold text-cyan-400">{metric.probability.toFixed(1)}%</p> <p className="mt-2"> Long-Term Trend: <span className={`${trendColor} font-semibold`}>{trendArrow} {metric.trend}</span> </p> </div> <div className="h-40"> <Line options={chartOptions} data={chartData} /> </div> </div> </div> );
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
      loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-700"><p>Loading Map...</p></div>,
      ssr: false 
    }
  ), []);

  const getDayOfYear = (dateString: string): number => { const date = new Date(dateString); const start = new Date(date.getFullYear(), 0, 0); const diff = date.getTime() - start.getTime(); const oneDay = 1000 * 60 * 60 * 24; return Math.floor(diff / oneDay); };
  const handleAnalysis = async (): Promise<void> => { setIsLoading(true); setAnalysis(null); setError(null); try { const response = await axios.get('http://localhost:3001/weather-risk', { params: { lat: position.lat, lon: position.lng, dayOfYear: getDayOfYear(date), tempThreshold: thresholds.temp, rainThreshold: thresholds.rain, windThreshold: thresholds.wind } }); setAnalysis(response.data); } catch (e: any) { setError(e.response?.data?.message || e.message || "Failed to fetch weather analysis."); console.error(e); } finally { setIsLoading(false); } };
  
  // --- NEW: Function to handle the city search ---
  const handleSearch = async () => {
    if (!searchQuery) return;
    setError(null);
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setPosition({ lat: parseFloat(lat), lng: parseFloat(lon) });
      } else {
        setError("City not found. Please try a different search.");
      }
    } catch (e) {
      setError("Failed to fetch location data.");
      console.error(e);
    }
  };


  return (
    <main className="bg-gray-900 text-white min-h-screen font-sans p-4 sm:p-6 lg:p-8">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin=""/>
      
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400">AstroClime</h1>
          <p className="text-lg text-gray-400 mt-2">Plan your outdoor event with confidence using historical NASA climate data.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Controls */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col">
            <h2 className="text-2xl font-semibold mb-4 border-b-2 border-cyan-500 pb-2">1. Your Event Details</h2>

            {/* --- NEW: Search Bar --- */}
            <div className="mb-4">
              <label htmlFor="search" className="block text-lg font-medium mb-2">Search for a City:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g., Mumbai, India"
                  className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
                <button
                  onClick={handleSearch}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-lg font-medium mb-2">Or click on the map:</label>
              <div className="h-64 md:h-80 w-full rounded-lg overflow-hidden border-2 border-gray-600">
                  <Map position={position} setPosition={setPosition}/>
              </div>
               <p className="text-sm text-gray-400 mt-2">Lat: {position.lat.toFixed(4)}, Lon: {position.lng.toFixed(4)}</p>
            </div>
            <div className="mb-6"> <label htmlFor="date" className="block text-lg font-medium mb-2">Event Date:</label> <input type="date" id="date" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"/> </div>
            <h2 className="text-2xl font-semibold mb-4 mt-8 border-b-2 border-cyan-500 pb-2">2. Define "Bad Weather"</h2>
            <div className="space-y-4">
                <div> <label htmlFor="temp" className="block font-medium">"Too Hot" if Temp {'>'} {thresholds.temp}°C</label> <input type="range" id="temp" name="temp" min="20" max="50" value={thresholds.temp} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThresholds({...thresholds, temp: Number(e.target.value)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" /> </div>
                <div> <label htmlFor="rain" className="block font-medium">"Too Wet" if Rain {'>'} {thresholds.rain} mm/day</label> <input type="range" id="rain" name="rain" min="1" max="50" step="1" value={thresholds.rain} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThresholds({...thresholds, rain: Number(e.target.value)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" /> </div>
                <div> <label htmlFor="wind" className="block font-medium">"Too Windy" if Wind {'>'} {thresholds.wind} km/h</label> <input type="range" id="wind" name="wind" min="5" max="60" value={thresholds.wind} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThresholds({...thresholds, wind: Number(e.target.value)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" /> </div>
            </div>
            <div className="mt-auto pt-8 text-center"> <button onClick={handleAnalysis} disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg text-xl transition duration-300 shadow-lg"> {isLoading ? 'Analyzing...' : 'Analyze Weather Risk'} </button> </div>
          </div>

          {/* Right Panel: Results */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 border-b-2 border-cyan-500 pb-2">3. Historical Weather Risk</h2>
            <div className="flex items-center justify-center h-full">
              {isLoading && <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div><p className="mt-4 text-lg">Fetching decades of NASA data...</p></div>}
              {error && <div className="bg-red-900/80 border border-red-600 p-4 rounded-lg text-center"><p className="font-bold">Error</p><p>{error}</p></div>}
              {!isLoading && !analysis && !error && <div className="text-center text-gray-400"><p className="text-xl">Your personalized weather risk analysis will appear here.</p></div>}
              {analysis && ( <div className="space-y-6 w-full"> <div className="text-center bg-gray-700/50 p-4 rounded-lg"> <p className="text-lg text-gray-400">Overall Weather Risk Score</p> <p className={`text-6xl font-bold ${ analysis.overallRiskScore > 6.5 ? 'text-red-500' : analysis.overallRiskScore > 3.5 ? 'text-yellow-500' : 'text-green-500' }`}>{analysis.overallRiskScore.toFixed(1)} / 10</p> </div> <AnalysisCard metric={analysis.temperature} name="Max Temperature" unit="°C" /> <AnalysisCard metric={analysis.precipitation} name="Precipitation" unit="mm/day" /> <AnalysisCard metric={analysis.wind} name="Wind Speed" unit="km/h" /> <div className="text-center pt-4"> <a href={analysis.rawDataUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"> View Raw Data Source </a> </div> </div> )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}



// 'use client'; 

// import React, { useState, useMemo, useEffect } from 'react';
// import dynamic from 'next/dynamic';
// import axios from 'axios';

// // Chart.js imports (no change)
// import { Line } from 'react-chartjs-2';
// import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
// ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// // --- TypeScript Type Definitions (no change) ---
// interface PositionState { lat: number; lng: number; }
// interface ThresholdState { temp: number; rain: number; wind: number; }
// interface MetricHistory { labels: number[]; data: number[]; }
// interface MetricAnalysis { probability: number; trend: 'Increasing' | 'Decreasing' | 'Stable'; history: MetricHistory; }
// interface AnalysisState { overallRiskScore: number; temperature: MetricAnalysis; precipitation: MetricAnalysis; wind: MetricAnalysis; rawDataUrl: string; }
// interface AnalysisCardProps { metric: MetricAnalysis; name: string; unit: string; }


// // --- NEW: Animated Radial Score Component ---
// const AnimatedScore = ({ score }: { score: number }) => {
//   const [displayScore, setDisplayScore] = useState(0);
//   const size = 160;
//   const strokeWidth = 12;
//   const center = size / 2;
//   const radius = center - strokeWidth;
//   const circumference = 2 * Math.PI * radius;
//   const offset = circumference - (score / 10) * circumference;

//   const scoreColor = score > 6.5 ? 'text-red-400' : score > 3.5 ? 'text-yellow-400' : 'text-green-400';
//   const strokeColor = score > 6.5 ? '#f87171' : score > 3.5 ? '#facc15' : '#4ade80';

//   useEffect(() => {
//     let start = 0;
//     const end = score;
//     if (start === end) return;
//     const duration = 1500;
//     const incrementTime = (duration / end) || 1;
//     const timer = setInterval(() => {
//       start += 0.1;
//       setDisplayScore(parseFloat(start.toFixed(1)));
//       if (start >= end) {
//         setDisplayScore(parseFloat(end.toFixed(1)));
//         clearInterval(timer);
//       }
//     }, incrementTime / 10);
//     return () => clearInterval(timer);
//   }, [score]);

//   return (
//     <div className="relative" style={{ width: size, height: size }}>
//       <svg className="transform -rotate-90" width={size} height={size}>
//         <circle className="text-gray-700/50" stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={center} cy={center} />
//         <circle
//           stroke={strokeColor}
//           strokeWidth={strokeWidth}
//           strokeDasharray={circumference}
//           strokeDashoffset={offset}
//           strokeLinecap="round"
//           fill="transparent"
//           r={radius}
//           cx={center}
//           cy={center}
//           style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.25, 1, 0.5, 1)' }}
//         />
//       </svg>
//       <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
//         <span className={`text-4xl font-bold ${scoreColor}`}>
//           {displayScore.toFixed(1)}
//         </span>
//         <span className="text-gray-400 text-sm">/ 10</span>
//       </div>
//     </div>
//   );
// };

// // --- MODIFIED: AnalysisCard with enhanced styling ---
// function AnalysisCard({ metric, name, unit }: AnalysisCardProps) {
//   const chartData = { labels: metric.history.labels, datasets: [{ label: `${name} (${unit})`, data: metric.history.data, borderColor: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.2)', tension: 0.3, fill: true, pointRadius: 0 }], };
//   const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: false }, }, scales: { x: { display: false }, y: { display: false } }, };
//   const trendColor = metric.trend.toLowerCase() === 'increasing' ? 'text-red-400' : metric.trend.toLowerCase() === 'decreasing' ? 'text-green-400' : 'text-gray-400';
//   const trendArrow = metric.trend.toLowerCase() === 'increasing' ? '▲' : metric.trend.toLowerCase() === 'decreasing' ? '▼' : '▬';
//   return (
//     <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 hover:border-cyan-400 transition-all duration-300 group">
//       <div className="flex justify-between items-center">
//         <h3 className="text-lg font-semibold text-gray-200">{name}</h3>
//         <p className={`font-semibold ${trendColor}`}>{trendArrow} {metric.trend}</p>
//       </div>
//       <div className="flex items-end gap-4 mt-2">
//         <p className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">{metric.probability.toFixed(0)}<span className="text-3xl">%</span></p>
//         <div className="flex-1 h-16 relative">
//           <Line options={chartOptions} data={chartData} />
//         </div>
//       </div>
//     </div>
//   );
// }

// // --- Main Page Component ---
// export default function HomePage() {
//   const [position, setPosition] = useState<PositionState>({ lat: 28.6139, lng: 77.2090 });
//   const [date, setDate] = useState<string>('2025-10-15');
//   const [thresholds, setThresholds] = useState<ThresholdState>({ temp: 35, rain: 5, wind: 25 });
//   const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [searchQuery, setSearchQuery] = useState<string>("");

//   const Map = useMemo(() => dynamic(() => import('./MapComponent'), { loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-800"><p>Loading Map...</p></div>, ssr: false }), []);
  
//   const getDayOfYear = (dateString: string): number => { const date = new Date(dateString); const start = new Date(date.getFullYear(), 0, 0); const diff = date.getTime() - start.getTime(); const oneDay = 1000 * 60 * 60 * 24; return Math.floor(diff / oneDay); };
//   const handleAnalysis = async (): Promise<void> => { setIsLoading(true); setAnalysis(null); setError(null); try { const response = await axios.get('http://localhost:3001/weather-risk', { params: { lat: position.lat, lon: position.lng, dayOfYear: getDayOfYear(date), tempThreshold: thresholds.temp, rainThreshold: thresholds.rain, windThreshold: thresholds.wind } }); setAnalysis(response.data); } catch (e: any) { setError(e.response?.data?.message || e.message || "Failed to fetch weather analysis."); console.error(e); } finally { setIsLoading(false); } };
//   const handleSearch = async () => { if (!searchQuery) return; setError(null); try { const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`); if (response.data && response.data.length > 0) { const { lat, lon } = response.data[0]; setPosition({ lat: parseFloat(lat), lng: parseFloat(lon) }); } else { setError("City not found. Please try a different search."); } } catch (e) { setError("Failed to fetch location data."); console.error(e); } };

//   return (
//     <main className="bg-gray-900 text-white min-h-screen font-sans p-4 sm:p-6 lg:p-8 overflow-hidden relative">
//       <style jsx global>{`
//         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
//         body { font-family: 'Inter', sans-serif; }
//         .aurora-background { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; z-index: 0; }
//         .aurora-background::before, .aurora-background::after { content: ''; position: absolute; width: 800px; height: 800px; border-radius: 50%; opacity: 0.3; mix-blend-mode: screen; filter: blur(100px); animation: spin 20s linear infinite; }
//         .aurora-background::before { background: radial-gradient(circle, #0891b2, transparent 60%); top: -20%; left: -20%; }
//         .aurora-background::after { background: radial-gradient(circle, #6d28d9, transparent 60%); bottom: -20%; right: -20%; animation-direction: reverse; }
//         @keyframes spin { 0% { transform: rotate(0deg) scale(1.0); } 50% { transform: rotate(180deg) scale(1.2); } 100% { transform: rotate(360deg) scale(1.0); } }
//       `}</style>
//       <div className="aurora-background"></div>
      
//       <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin=""/>
      
//       <div className="max-w-7xl mx-auto relative z-10">
//         <header className="text-center mb-10">
//           <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 py-2">AstroClime</h1>
//           <p className="text-lg text-gray-300 mt-2">Plan your event with confidence using historical NASA climate data.</p>
//         </header>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* Left Panel: Controls */}
//           <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 p-6 rounded-2xl shadow-2xl flex flex-col">
//             <h2 className="text-2xl font-bold mb-4 border-b-2 border-cyan-500/30 pb-2">1. Event Details</h2>
//             <div className="mb-4">
//               <label htmlFor="search" className="block text-lg font-medium mb-2">Search for a City</label>
//               <div className="flex gap-2">
//                 <input type="text" id="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="e.g., Tokyo, Japan" className="w-full bg-gray-700/80 p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
//                 <button onClick={handleSearch} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition duration-300">Search</button>
//               </div>
//             </div>
            
//             {/* --- THIS IS THE FIX --- */}
//             {/* The parent div is now a flex container that grows to fill space */}
//             <div className="mb-6 flex-1 flex flex-col">
//               <label className="block text-lg font-medium mb-2">Or select on the map</label>
//               <div className="flex-1 rounded-lg overflow-hidden border-2 border-gray-700">
//                   <Map position={position} setPosition={setPosition}/>
//               </div>
//             </div>

//             <div className="mb-6"> <label htmlFor="date" className="block text-lg font-medium mb-2">Event Date</label> <input type="date" id="date" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} className="w-full bg-gray-700/80 p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"/> </div>
//             <div className="mt-auto pt-4 text-center"> <button onClick={handleAnalysis} disabled={isLoading} className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 px-4 rounded-lg text-xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/50"> {isLoading ? 'Analyzing...' : 'Analyze Risk'} </button> </div>
//           </div>

//           {/* Right Panel: Results */}
//           <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 p-6 rounded-2xl shadow-2xl">
//             <h2 className="text-2xl font-bold mb-4 border-b-2 border-cyan-500/30 pb-2">2. Climate Risk Analysis</h2>
//             <div className="flex items-center justify-center h-full">
//               {isLoading && <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div><p className="mt-4 text-lg">Contacting NASA Satellites...</p></div>}
//               {error && <div className="bg-red-900/80 border border-red-600 p-4 rounded-lg text-center"><p className="font-bold">Error</p><p>{error}</p></div>}
//               {!isLoading && !analysis && !error && <div className="text-center text-gray-400 p-8"><p className="text-xl">Your personalized weather risk analysis will appear here.</p></div>}
//               {analysis && ( <div className="space-y-4 w-full"> 
//                 <div className="flex flex-col items-center justify-center bg-gray-900/50 p-4 rounded-xl border border-gray-700"> 
//                   <p className="text-lg text-gray-300 mb-2">Overall Weather Risk Score</p>
//                   <AnimatedScore score={analysis.overallRiskScore} />
//                 </div> 
//                 <h3 className="text-xl font-semibold pt-2">Risk Factors</h3>
//                 <div className="space-y-3">
//                   <AnalysisCard metric={analysis.temperature} name="Extreme Heat" unit="°C" /> 
//                   <AnalysisCard metric={analysis.precipitation} name="Heavy Rain" unit="mm/day" /> 
//                   <AnalysisCard metric={analysis.wind} name="High Wind" unit="km/h" /> 
//                 </div>
//                 <div className="text-center pt-4"> <a href={analysis.rawDataUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 transition"> View Raw Data Source </a> </div> 
//               </div> )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }