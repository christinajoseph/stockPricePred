import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChevronDown, CalendarDays, MapPin, Search, Loader2 } from 'lucide-react';
import ReactDOM from 'react-dom/client';
import './index.css';              // Tailwind base imports

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

const commodities = ['All', 'Rice', 'Maize', 'Cotton', 'Red Gram', 'Green Gram'];
const locations = ['All', 'Bowenpally', 'Gudimalkapur', 'Erragadda'];
const dateRanges = ['All', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Custom'];

function App() {
  // State for data
  const [historicalData, setHistoricalData] = useState([]);
  const [predictedData, setPredictedData] = useState([]); // Will hold predictions
  const [filteredData, setFilteredData] = useState([]);
  
  // State for UI and filters
  const [chartType, setChartType] = useState('line');
  const [selectedCommodity, setSelectedCommodity] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedDateRange, setSelectedDateRange] = useState('All');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true); // For loading indicators
  const [error, setError] = useState(null); // For displaying errors


  // --- Step 1: Fetch historical data from backend when component mounts ---
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // The Vite proxy will redirect this request to http://localhost:5173/prices/history
        const response = await fetch('/api/prices/history');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setHistoricalData(data);
      } catch (error) {
        console.error("Failed to fetch historical prices:", error);
        setError("Could not load historical data. Make sure the backend server is running.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistoricalData();
  }, []); // Empty dependency array means this runs once when the component mounts

  // --- Step 2: Effect to filter data whenever filters or data change ---
  useEffect(() => {
    let combinedData = [...historicalData, ...predictedData];
    let Hdata = [...combinedData];
    
    // Apply filters
    if (selectedCommodity !== 'All') {
      Hdata = Hdata.filter(item => item.commodity === selectedCommodity);
    }
    if (selectedLocation !== 'All') {
      Hdata = Hdata.filter(item => item.location === selectedLocation);
    }
     if (searchTerm) {
        Hdata = Hdata.filter(item => item.commodity.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Sort by date before setting
    const sortedData = Hdata.sort((a,b) => new Date(a.date) - new Date(b.date));
    
    // Map data for chart compatibility (handle historical vs predicted prices)
    const chartReadyData = sortedData.map(d => ({
        ...d,
        price: d.price, // Historical price
        predictedPrice: d.predictedPrice // Predicted price
    }));
    
    setFilteredData(chartReadyData);

  }, [selectedCommodity, selectedLocation, searchTerm, historicalData, predictedData]);
  
  
  // --- Step 3: Function to trigger a new prediction ---
  const handlePrediction = async () => {
    // Basic validation: require a specific commodity and location for prediction
    if (selectedCommodity === 'All' || selectedLocation === 'All') {
        alert("Please select a specific Commodity and Location to get a prediction.");
        return;
    }

    setIsLoading(true);
    setError(null);
    
    // Create a future date for prediction (e.g., 7 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const predictionDate = futureDate.toISOString().split('T')[0];

    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: predictionDate,
                commodity: selectedCommodity,
                location: selectedLocation
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Prediction request failed');
        }

        const newPrediction = await response.json();
        
        // Add the new prediction to our predictedData state
        // Avoid adding duplicates
        setPredictedData(prev => {
            const isDuplicate = prev.some(p => p.date === newPrediction.date && p.commodity === newPrediction.commodity && p.location === newPrediction.location);
            return isDuplicate ? prev : [...prev, newPrediction];
        });

    } catch (error) {
        console.error("Failed to fetch prediction:", error);
        setError(`Prediction Error: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  }


  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-700">{`Date: ${label}`}</p>
          {data.price !== undefined && <p className="text-sm text-indigo-600">{`Price: $${data.price}`}</p>}
          {data.predictedPrice !== undefined && <p className="text-sm text-green-600">{`Predicted: $${data.predictedPrice.toFixed(2)}`}</p>}
          {data.confidenceMin !== undefined && data.confidenceMax !== undefined && (
            <p className="text-xs text-gray-500">{`Confidence: $${data.confidenceMin.toFixed(2)} - $${data.confidenceMax.toFixed(2)}`}</p>
          )}
          <p className="text-xs text-gray-500">{`Commodity: ${data.commodity}`}</p>
          <p className="text-xs text-gray-500">{`Location: ${data.location}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 min-h-screen p-4 md:p-8 font-sans text-gray-100">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          Stock Price Tracker for Farming
        </h1>
        <p className="text-slate-400 mt-2">Real-time market intelligence for informed decisions.</p>
      </header>
      
      {/* Filter Section with Prediction Button */}
      <div className="mb-8 p-6 bg-slate-800 rounded-xl shadow-2xl">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Filters... */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="commoditySelect" className="text-sm font-medium text-slate-300">Commodity</label>
            <div className="relative">
              <select id="commoditySelect" value={selectedCommodity} onChange={(e) => setSelectedCommodity(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-gray-100 py-3 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none">
                {commodities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <label htmlFor="locationSelect" className="text-sm font-medium text-slate-300">Location</label>
            <div className="relative">
              <select id="locationSelect" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-gray-100 py-3 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none">
                {locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
          </div>
           <div className="flex flex-col space-y-2">
             <label htmlFor="searchInput" className="text-sm font-medium text-slate-300">Search Commodity</label>
             <div className="relative">
                <input type="text" id="searchInput" placeholder="E.g., Wheat" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-gray-100 py-3 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 pl-10"/>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            </div>
          </div>
          {/* Prediction Button */}
           <div className="flex flex-col space-y-2 justify-end">
             <button onClick={handlePrediction} disabled={isLoading} className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center justify-center">
                 {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                 Get Prediction
             </button>
           </div>
        </div>
      </div>


      {/* Chart Display Section */}
      <div className="mb-8 p-4 md:p-6 bg-slate-800 rounded-xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-100">
                Price Trends
            </h2>
             <div className="flex space-x-2">
                <button onClick={() => setChartType('line')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${chartType === 'line' ? 'bg-green-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>Line</button>
                <button onClick={() => setChartType('bar')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${chartType === 'bar' ? 'bg-green-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>Bar</button>
            </div>
        </div>
        
        {isLoading && <div className="flex justify-center items-center h-96"><Loader2 className="h-12 w-12 text-green-500 animate-spin" /></div>}
        {error && <div className="text-center py-10 text-red-400 bg-red-900/20 rounded-lg"><p className="text-xl">An Error Occurred</p><p>{error}</p></div>}
        {!isLoading && !error && filteredData.length > 0 && (
            <div style={{ width: '100%', height: 450 }}>
                <ResponsiveContainer>
                    {chartType === 'line' ? (
                    <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis dataKey="date" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#A0AEC0" tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(74, 85, 104, 0.3)' }}/>
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line type="monotone" dataKey="price" name="Historical Price" stroke="#38BDF8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                        <Line type="monotone" dataKey="predictedPrice" name="Predicted Price" stroke="#34D399" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                    </LineChart>
                    ) : (
                    <BarChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis dataKey="date" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#A0AEC0" tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(74, 85, 104, 0.3)' }}/>
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="price" name="Historical Price" fill="#38BDF8" />
                        <Bar dataKey="predictedPrice" name="Predicted Price" fill="#34D399" />
                    </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        )}
        {!isLoading && !error && filteredData.length === 0 && (
             <div className="text-center py-10 text-slate-400">
                <p className="text-xl">No data available for the selected filters.</p>
                <p>Try adjusting your commodity, location, or date range selections.</p>
            </div>
        )}
      </div>

       <footer className="mt-12 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} AgriStock Insights. Empowering Farmers.</p>
      </footer>
    </div>
  );
}

export default App;