import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChevronDown, CalendarDays, MapPin, Search } from 'lucide-react';

// Mock data - replace with API calls
const initialHistoricalData = [
  { date: '2023-01-01', price: 100, commodity: 'Wheat', location: 'North Farm' },
  { date: '2023-01-08', price: 105, commodity: 'Wheat', location: 'North Farm' },
  { date: '2023-01-15', price: 110, commodity: 'Wheat', location: 'North Farm' },
  { date: '2023-01-22', price: 108, commodity: 'Wheat', location: 'North Farm' },
  { date: '2023-01-29', price: 112, commodity: 'Wheat', location: 'North Farm' },
  { date: '2023-02-05', price: 115, commodity: 'Wheat', location: 'North Farm' },
  { date: '2023-01-01', price: 200, commodity: 'Corn', location: 'South Farm' },
  { date: '2023-01-08', price: 202, commodity: 'Corn', location: 'South Farm' },
  { date: '2023-01-15', price: 198, commodity: 'Corn', location: 'South Farm' },
  { date: '2023-01-22', price: 205, commodity: 'Corn', location: 'South Farm' },
  { date: '2023-01-29', price: 210, commodity: 'Corn', location: 'South Farm' },
  { date: '2023-02-05', price: 208, commodity: 'Corn', location: 'South Farm' },
  { date: '2023-01-01', price: 150, commodity: 'Soybeans', location: 'East Farm' },
  { date: '2023-01-08', price: 155, commodity: 'Soybeans', location: 'East Farm' },
  { date: '2023-01-15', price: 152, commodity: 'Soybeans', location: 'East Farm' },
  { date: '2023-01-22', price: 158, commodity: 'Soybeans', location: 'East Farm' },
];

const initialPredictedData = [
  { date: '2023-02-12', price: 118, commodity: 'Wheat', location: 'North Farm', confidenceMin: 115, confidenceMax: 121 },
  { date: '2023-02-19', price: 120, commodity: 'Wheat', location: 'North Farm', confidenceMin: 117, confidenceMax: 123 },
  { date: '2023-02-12', price: 212, commodity: 'Corn', location: 'South Farm', confidenceMin: 209, confidenceMax: 215 },
  { date: '2023-02-19', price: 215, commodity: 'Corn', location: 'South Farm', confidenceMin: 210, confidenceMax: 220 },
];

const commodities = ['All', 'Wheat', 'Corn', 'Soybeans'];
const locations = ['All', 'North Farm', 'South Farm', 'East Farm'];
const dateRanges = ['All', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Custom'];


// Main App Component
function App() {
  const [historicalData, setHistoricalData] = useState(initialHistoricalData);
  const [predictedData, setPredictedData] = useState(initialPredictedData);
  const [filteredData, setFilteredData] = useState([]);
  const [chartType, setChartType] = useState('line'); // 'line' or 'bar'
  
  const [selectedCommodity, setSelectedCommodity] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedDateRange, setSelectedDateRange] = useState('All');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Effect to filter data when selections change
  useEffect(() => {
    let Hdata = [...historicalData]; // Use a mutable copy for filtering
    let Pdata = [...predictedData];

    if (selectedCommodity !== 'All') {
      Hdata = Hdata.filter(item => item.commodity === selectedCommodity);
      Pdata = Pdata.filter(item => item.commodity === selectedCommodity);
    }
    if (selectedLocation !== 'All') {
      Hdata = Hdata.filter(item => item.location === selectedLocation);
      Pdata = Pdata.filter(item => item.location === selectedLocation);
    }

    // Date range filtering (simplified, enhance as needed)
    if (selectedDateRange !== 'All' && selectedDateRange !== 'Custom') {
        const today = new Date();
        let pastDate = new Date();
        if (selectedDateRange === 'Last 7 Days') pastDate.setDate(today.getDate() - 7);
        if (selectedDateRange === 'Last 30 Days') pastDate.setDate(today.getDate() - 30);
        if (selectedDateRange === 'Last 90 Days') pastDate.setDate(today.getDate() - 90);
        
        Hdata = Hdata.filter(item => new Date(item.date) >= pastDate);
        // Predicted data might not need date range filtering in the same way, or it might be future dates
    } else if (selectedDateRange === 'Custom' && customDateStart && customDateEnd) {
        const start = new Date(customDateStart);
        const end = new Date(customDateEnd);
        Hdata = Hdata.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= start && itemDate <= end;
        });
    }
    
    // Search term filtering (simple, searches commodity name)
    if (searchTerm) {
        Hdata = Hdata.filter(item => item.commodity.toLowerCase().includes(searchTerm.toLowerCase()));
        Pdata = Pdata.filter(item => item.commodity.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Combine historical and predicted data for the chart.
    // Ensure data is sorted by date if mixing types or commodities.
    // For simplicity, we are displaying them potentially on the same axis if commodity/location match.
    // A more sophisticated approach might involve separate series or chart areas.
    const combinedData = [...Hdata, ...Pdata.map(p => ({...p, predictedPrice: p.price, price: undefined}))]
        .sort((a,b) => new Date(a.date) - new Date(b.date));

    setFilteredData(combinedData);
  }, [selectedCommodity, selectedLocation, selectedDateRange, customDateStart, customDateEnd, searchTerm, historicalData, predictedData]);

  // Fetch data from backend (example)
  // useEffect(() => {
  //   const fetchPrices = async () => {
  //     try {
  //       // Replace with your actual API endpoint
  //       // const response = await fetch('/api/prices/history?commodity=Wheat&location=North Farm');
  //       // const data = await response.json();
  //       // setHistoricalData(data); 
  //       //
  //       // const predResponse = await fetch('/api/predict?commodity=Wheat&location=North Farm');
  //       // const predData = await predResponse.json();
  //       // setPredictedData(predData);
  //     } catch (error) {
  //       console.error("Failed to fetch prices:", error);
  //       // Handle error appropriately in UI
  //     }
  //   };
  //   fetchPrices();
  // }, []); // Add dependencies if filters should trigger API calls

  const handleCustomDateChange = () => {
      if (customDateStart && customDateEnd && new Date(customDateStart) > new Date(customDateEnd)) {
          // Basic validation for date range
          // In a real app, use a modal or toast for alerts
          console.error("Start date cannot be after end date.");
          return;
      }
      // Trigger filter update
      setSelectedDateRange('Custom');
  }

  // Custom Tooltip for richer information
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-700">{`Date: ${label}`}</p>
          {data.price !== undefined && <p className="text-sm text-indigo-600">{`Price: $${data.price}`}</p>}
          {data.predictedPrice !== undefined && <p className="text-sm text-green-600">{`Predicted: $${data.predictedPrice}`}</p>}
          {data.confidenceMin !== undefined && data.confidenceMax !== undefined && (
            <p className="text-xs text-gray-500">{`Confidence: $${data.confidenceMin} - $${data.confidenceMax}`}</p>
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

      {/* Filter Section */}
      <div className="mb-8 p-6 bg-slate-800 rounded-xl shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Commodity Filter */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="commoditySelect" className="text-sm font-medium text-slate-300">Commodity</label>
            <div className="relative">
              <select 
                id="commoditySelect"
                value={selectedCommodity} 
                onChange={(e) => setSelectedCommodity(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-gray-100 py-3 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
              >
                {commodities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Location Filter */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="locationSelect" className="text-sm font-medium text-slate-300">Location</label>
            <div className="relative">
              <select 
                id="locationSelect"
                value={selectedLocation} 
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-gray-100 py-3 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
              >
                {locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          {/* Date Range Filter */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="dateRangeSelect" className="text-sm font-medium text-slate-300">Date Range</label>
            <div className="relative">
              <select 
                id="dateRangeSelect"
                value={selectedDateRange} 
                onChange={(e) => {
                    setSelectedDateRange(e.target.value);
                    if (e.target.value !== 'Custom') {
                        setCustomDateStart('');
                        setCustomDateEnd('');
                    }
                }}
                className="w-full bg-slate-700 border border-slate-600 text-gray-100 py-3 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
              >
                {dateRanges.map(dr => <option key={dr} value={dr}>{dr}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

           {/* Search Input */}
          <div className="flex flex-col space-y-2">
             <label htmlFor="searchInput" className="text-sm font-medium text-slate-300">Search Commodity</label>
             <div className="relative">
                <input
                    type="text"
                    id="searchInput"
                    placeholder="E.g., Wheat"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-gray-100 py-3 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            </div>
          </div>
        </div>
        {/* Custom Date Range Inputs */}
        {selectedDateRange === 'Custom' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="flex flex-col space-y-2">
                <label htmlFor="customStartDate" className="text-sm font-medium text-slate-300">Start Date</label>
                <input 
                  type="date" 
                  id="customStartDate"
                  value={customDateStart}
                  onChange={(e) => setCustomDateStart(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-gray-100 py-3 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label htmlFor="customEndDate" className="text-sm font-medium text-slate-300">End Date</label>
                <input 
                  type="date" 
                  id="customEndDate"
                  value={customDateEnd}
                  onChange={(e) => setCustomDateEnd(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-gray-100 py-3 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                />
              </div>
              <button 
                onClick={handleCustomDateChange}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out h-fit"
              >
                Apply Custom Range
              </button>
            </div>
          )}
      </div>

      {/* Chart Display Section */}
      <div className="mb-8 p-4 md:p-6 bg-slate-800 rounded-xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-100">
                Price Trends: {selectedCommodity === 'All' ? 'All Commodities' : selectedCommodity} 
                {selectedLocation !== 'All' && ` in ${selectedLocation}`}
            </h2>
            <div className="flex space-x-2">
                <button 
                    onClick={() => setChartType('line')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${chartType === 'line' ? 'bg-green-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                >
                    Line
                </button>
                <button 
                    onClick={() => setChartType('bar')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${chartType === 'bar' ? 'bg-green-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                >
                    Bar
                </button>
            </div>
        </div>
        
        {filteredData.length > 0 ? (
            <div style={{ width: '100%', height: 450 }}> {/* Increased height for better visibility */}
                <ResponsiveContainer>
                    {chartType === 'line' ? (
                    <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis dataKey="date" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#A0AEC0" tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(74, 85, 104, 0.3)' }}/>
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line type="monotone" dataKey="price" name="Historical Price" stroke="#38BDF8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="predictedPrice" name="Predicted Price" stroke="#34D399" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        {/* Optional: Confidence Interval for predicted price */}
                        {/* This requires more complex data structure or multiple lines */}
                         <Line type="monotone" dataKey="confidenceMin" name="Confidence Min" stroke="#4ADE80" strokeWidth={1} strokeDasharray="3 3" dot={false} activeDot={false} hide={!predictedData.some(d => d.commodity === selectedCommodity || selectedCommodity === 'All')}/>
                         <Line type="monotone" dataKey="confidenceMax" name="Confidence Max" stroke="#4ADE80" strokeWidth={1} strokeDasharray="3 3" dot={false} activeDot={false} hide={!predictedData.some(d => d.commodity === selectedCommodity || selectedCommodity === 'All')}/>
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
        ) : (
            <div className="text-center py-10 text-slate-400">
                <p className="text-xl">No data available for the selected filters.</p>
                <p>Try adjusting your commodity, location, or date range selections.</p>
            </div>
        )}
      </div>

      {/* Optional: Dashboard Cards Section (Example) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-800 rounded-xl shadow-2xl">
            <h3 className="text-lg font-semibold text-green-400 mb-2">Wheat (North Farm)</h3>
            <p className="text-3xl font-bold text-slate-100">$115 <span className="text-sm text-green-500">(+2.5%)</span></p>
            <p className="text-xs text-slate-400 mt-1">Last updated: 5 mins ago</p>
        </div>
        <div className="p-6 bg-slate-800 rounded-xl shadow-2xl">
            <h3 className="text-lg font-semibold text-green-400 mb-2">Corn (South Farm)</h3>
            <p className="text-3xl font-bold text-slate-100">$208 <span className="text-sm text-red-500">(-0.5%)</span></p>
            <p className="text-xs text-slate-400 mt-1">Last updated: 8 mins ago</p>
        </div>
        <div className="p-6 bg-slate-800 rounded-xl shadow-2xl">
            <h3 className="text-lg font-semibold text-green-400 mb-2">Soybeans (East Farm)</h3>
            <p className="text-3xl font-bold text-slate-100">$158 <span className="text-sm text-green-500">(+1.0%)</span></p>
            <p className="text-xs text-slate-400 mt-1">Last updated: 2 mins ago</p>
        </div>
      </div>

      <footer className="mt-12 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} AgriStock Insights. Empowering Farmers.</p>
      </footer>
    </div>
  );
}

export default App;