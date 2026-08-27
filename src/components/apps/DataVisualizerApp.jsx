import { useState, useRef, useEffect } from 'react';
import { 
  BarChart2, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  AreaChart as AreaChartIcon,
  Download,
  UploadCloud,
  CheckCircle2,
  Settings2,
  FileText,
  ArrowLeft,
  Leaf,
  RotateCcw,
  Wand2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, Bar, 
  LineChart, Line, 
  AreaChart, Area, 
  PieChart, Pie, 
  XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Cell 
} from 'recharts';
import * as htmlToImage from 'html-to-image';
import clsx from 'clsx';
import { SegmentedControl } from '../theme/SegmentedControl';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#f472b6', '#a855f7', '#fbbf24', '#f87171', '#34d399'];

const sampleData = `Month, Revenue, Profit, Customers
Jan, 12000, 4000, 150
Feb, 15000, 5500, 180
Mar, 18000, 7000, 220
Apr, 14000, 4800, 190
May, 21000, 8500, 260
Jun, 25000, 10000, 310`;

export default function DataVisualizerApp({ persona, isDarkMode, onOpenSidebar, onOpenPersonaInfo }) {
  const [rawData, setRawData] = useState(sampleData);
  const [parsedData, setParsedData] = useState([]);
  const [keys, setKeys] = useState([]);
  const [error, setError] = useState('');
  
  // Chart Settings
  const [chartType, setChartType] = useState('bar'); // 'bar', 'line', 'area', 'pie'
  const [xAxisKey, setXAxisKey] = useState('');
  const [yAxisKey, setYAxisKey] = useState('');
  const [isXDropdownOpen, setIsXDropdownOpen] = useState(false);
  const [isYDropdownOpen, setIsYDropdownOpen] = useState(false);

  const chartRef = useRef(null);

  // Parse raw text whenever it changes
  useEffect(() => {
    if (!rawData.trim()) {
      setParsedData([]);
      setKeys([]);
      setError('');
      return;
    }

    try {
      let data = [];
      
      // Try parsing as JSON first
      if (rawData.trim().startsWith('[') || rawData.trim().startsWith('{')) {
        data = JSON.parse(rawData);
        if (!Array.isArray(data)) {
          data = [data];
        }
      } else {
        // Fallback to CSV/TSV
        const lines = rawData.trim().split('\n');
        if (lines.length < 2) throw new Error('Not enough data rows for CSV/TSV');
        
        // Detect delimiter
        let delimiter = ',';
        if (lines[0].includes('\t')) delimiter = '\t';
        else if (lines[0].includes(';')) delimiter = ';';
        else if (lines[0].includes(',')) delimiter = ',';
        else if (lines[0].includes(' ')) delimiter = ' '; // Fallback to space
        
        const headers = lines[0].split(delimiter).map(h => h.trim()).filter(Boolean);
        
        data = lines.slice(1).map(line => {
          const values = line.split(delimiter);
          let row = {};
          headers.forEach((header, i) => {
            let val = values[i] ? values[i].trim() : '';
            // Try to convert to number if possible
            if (!isNaN(val) && val !== '') {
              val = Number(val);
            }
            row[header] = val;
          });
          return row;
        });
      }

      if (data.length > 0) {
        const extractedKeys = Object.keys(data[0]);
        setKeys(extractedKeys);
        setParsedData(data);
        setError('');
        
        // Smart AI Auto-Config (On-Device Heuristic)
        let bestX = extractedKeys[0];
        let bestY = extractedKeys[1] || extractedKeys[0];
        let bestType = 'bar';

        // Find a string or date column for X
        const strKeys = extractedKeys.filter(k => typeof data[0][k] === 'string');
        if (strKeys.length > 0) {
          bestX = strKeys.find(k => /date|time|month|year|day/i.test(k)) || strKeys[0];
        }

        // Find a number column for Y
        const numKeys = extractedKeys.filter(k => typeof data[0][k] === 'number');
        if (numKeys.length > 0) {
          bestY = numKeys.find(k => /total|amount|price|value|count|sum/i.test(k)) || numKeys[0];
        }

        // Guess best chart type based on data shape
        if (/date|time|month|year|day/i.test(bestX)) {
          bestType = 'area'; // Time series
        } else if (data.length <= 6 && numKeys.length > 0 && !data.some(d => d[bestY] < 0)) {
          bestType = 'pie'; // Small positive datasets
        } else if (data.length > 15) {
          bestType = 'line'; // Dense points
        } else {
          bestType = 'bar';
        }

        setXAxisKey(bestX);
        setYAxisKey(bestY);
        setChartType(bestType);
      }
    } catch (err) {
      setError('Invalid format. Please use comma (,), tab, or space separated values. First row must be headers.');
    }
  }, [rawData]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setRawData(evt.target.result);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const handleLoadExample = () => {
    setRawData(sampleData);
  };

  const handleReset = () => {
    setRawData('');
  };

  const handleDownload = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(chartRef.current, {
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        pixelRatio: 2
      });
      const link = document.createElement('a');
      link.download = `echovisualizer_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert('Failed to download chart: ' + err.message);
    }
  };

  const renderChart = () => {
    if (parsedData.length === 0 || !xAxisKey || !yAxisKey) return null;

    const props = {
      data: parsedData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    const textColor = isDarkMode ? '#e2e8f0' : '#475569';
    const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
    const themeColor = persona.theme.primary;

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...props}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey={xAxisKey} stroke={textColor} />
            <YAxis stroke={textColor} />
            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', border: `1px solid ${gridColor}` }} />
            <Legend />
            <Line type="monotone" dataKey={yAxisKey} stroke={themeColor} strokeWidth={3} activeDot={{ r: 8 }} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...props}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey={xAxisKey} stroke={textColor} />
            <YAxis stroke={textColor} />
            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', border: `1px solid ${gridColor}` }} />
            <Legend />
            <Area type="monotone" dataKey={yAxisKey} fill={themeColor} stroke={themeColor} fillOpacity={0.3} />
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', border: `1px solid ${gridColor}`, borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
            <Legend 
              verticalAlign="bottom" 
              height={60} 
              content={(props) => {
                const { payload } = props;
                return (
                  <ul className="flex flex-wrap justify-center gap-6 mt-6">
                    {payload.map((entry, index) => (
                      <li key={`item-${index}`} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[13px] font-bold" style={{ color: entry.color }}>{entry.value}</span>
                      </li>
                    ))}
                  </ul>
                );
              }}
            />
            <Pie
              data={parsedData}
              nameKey={xAxisKey}
              dataKey={yAxisKey}
              cx="50%"
              cy="50%"
              outerRadius={190}
              stroke="none"
              isAnimationActive={true}
              style={{ outline: 'none' }}
              labelLine={{ stroke: isDarkMode ? '#475569' : '#cbd5e1', strokeWidth: 1.5 }}
              label={({ x, y, name, value, percent, fill, cx }) => (
                <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                  <tspan x={x} dy="-0.6em" fill={fill} fontSize="17" fontWeight="900" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', outline: 'none' }}>{name}</tspan>
                  <tspan x={x} dy="1.4em" fill={isDarkMode ? '#94a3b8' : '#64748b'} fontSize="15" fontWeight="700" style={{ outline: 'none' }}>
                    {Number(value).toLocaleString('id-ID')} ({(percent * 100).toFixed(1)}%)
                  </tspan>
                </text>
              )}
            >
              {parsedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  style={{ outline: 'none' }} 
                />
              ))}
            </Pie>
          </PieChart>
        );
      case 'bar':
      default:
        return (
          <BarChart {...props}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey={xAxisKey} stroke={textColor} />
            <YAxis stroke={textColor} />
            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', border: `1px solid ${gridColor}` }} />
            <Legend />
            <Bar dataKey={yAxisKey} fill={themeColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <div className="flex flex-col w-full h-full relative" style={{ backgroundColor: isDarkMode ? persona.theme.secondary + '11' : persona.theme.secondary + '05' }}>
      {/* Minimal Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30" />
      
      {/* Tool Header */}
      <div className="h-[60px] px-6 md:px-8 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md shrink-0 z-20 relative w-full overflow-hidden">
        <div className="flex items-center space-x-3 md:space-x-4 shrink-0 min-w-0 pr-4">
          <button onClick={onOpenSidebar} className="sm:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <img
            src={persona.avatar}
            alt={persona.name}
            onClick={onOpenPersonaInfo}
            className="w-9 h-9 rounded-full border bg-white dark:bg-[#030303] object-cover scale-110 shrink-0 cursor-pointer hover:scale-125 transition-transform"
            style={{
              borderColor: `color-mix(in srgb, ${persona.theme.primary} 50%, transparent)`
            }}
          />
          <div className="min-w-0 cursor-pointer" onClick={onOpenPersonaInfo}>
            <h2 className="font-medium text-slate-800 dark:text-white text-lg flex items-center gap-1.5 min-w-0">
              <span className="truncate">{persona.name}</span>
              {persona.isOnDevice && <Leaf size={16} className="text-green-500 fill-green-500/20 shrink-0" />}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              <span className="-translate-y-[1px]">On-Device</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleLoadExample} 
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 font-semibold text-[13px] transition-colors hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]"
            style={{ 
              '--btn-hover-bg': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
              '--btn-hover-text': persona.theme.primary
            }}
            title="Load Data Sample"
          >
            <Wand2 size={18} />
            <span className="hidden md:inline">Examples</span>
          </button>
          <button 
            onClick={handleReset} 
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 font-semibold text-[13px] transition-colors hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]"
            style={{ 
              '--btn-hover-bg': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
              '--btn-hover-text': persona.theme.primary
            }}
            title="Clear All Data"
          >
            <RotateCcw size={18} />
            <span className="hidden md:inline">Clear All</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full min-h-full lg:h-full">
          
          {/* Settings Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">
            
            {/* Source Data Input */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Source Data
                </h3>
              </div>
                <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-3 shrink-0">
                  <label
                    className="flex-1 flex items-center justify-center gap-2 h-9 bg-slate-50 dark:bg-white/5 border border-dashed rounded-lg transition-colors border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <input type="file" className="hidden" accept=".csv,.tsv,.json,.txt" onChange={handleFileUpload} />
                    <UploadCloud className="w-4 h-4" style={{ color: persona.theme.primary }} />
                    <span className="text-xs font-bold text-slate-500">
                      Upload CSV or JSON
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 pl-1 mt-1.5 mb-4 shrink-0">CSV, TSV, JSON, and TXT supported.</p>
                
                <div className="relative mb-4 shrink-0">
                  <div className="absolute top-0 left-0 right-0 h-px bg-slate-100 dark:bg-white/5" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#1a1a1a] px-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">OR PASTE DATA</div>
                </div>

                <textarea
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  placeholder="Paste your raw data here..."
                  spellCheck="false"
                  className="w-full min-h-[150px] flex-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-[11px] font-mono text-slate-800 dark:text-slate-300 resize-none focus:outline-none focus:border-[var(--color-primary)]/50 transition-colors"
                  style={{ '--color-primary': persona.theme.primary }}
                />
                {error && <p className="text-[10px] text-red-500 mt-2">{error}</p>}
                {!error && parsedData.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> Smart Config Applied ({parsedData.length} rows)
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5 ml-4">Detected columns: {keys.join(', ')}</p>
                </div>
                )}
              </div>
            </div>

            {/* Configuration */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col relative z-20">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0 rounded-t-xl">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Settings2 className="w-4 h-4" style={{ color: persona.theme.primary }} />
                  Configuration
                </h3>
              </div>
              <div className="p-4 flex flex-col gap-4">
                {/* Chart Type */}
                <div className="mb-0">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Chart Type</label>
                  <SegmentedControl
                    value={chartType}
                    onChange={setChartType}
                    options={[
                      { value: 'bar', icon: BarChart2, title: 'Bar Chart' },
                      { value: 'line', icon: LineChartIcon, title: 'Line Chart' },
                      { value: 'area', icon: AreaChartIcon, title: 'Area Chart' },
                      { value: 'pie', icon: PieChartIcon, title: 'Pie Chart' }
                    ]}
                  />
                  {/*
                    <div 
                      className="absolute top-1 bottom-1 bg-white dark:bg-[#2a2a2a] rounded-md transition-transform duration-300 ease-out border border-slate-200 dark:border-white/10"
                      style={{
                         width: `calc((100% - 8px) / 4)`,
                         transform: `translateX(calc(${['bar', 'line', 'area', 'pie'].indexOf(chartType)} * 100%))`
                      }}
                    />
                    {[
                      { id: 'bar', icon: BarChart2, title: 'Bar Chart' },
                      { id: 'line', icon: LineChartIcon, title: 'Line Chart' },
                      { id: 'area', icon: AreaChartIcon, title: 'Area Chart' },
                      { id: 'pie', icon: PieChartIcon, title: 'Pie Chart' }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setChartType(type.id)}
                        title={type.title}
                        className={clsx(
                          "flex-1 relative z-10 flex items-center justify-center py-2 transition-colors duration-300",
                          chartType === type.id
                            ? "text-[var(--color-primary)]"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                        style={{ '--color-primary': persona.theme.primary }}
                      >
                        <type.icon size={16} />
                      </button>
                    ))}
                  */}
                </div>

                {/* Axes Settings */}
                {keys.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">X-Axis</label>
                      <button
                        type="button"
                        className={clsx(
                          "w-full h-9 px-3 flex items-center justify-between bg-white dark:bg-[#1a1a1a] border rounded-lg transition-all",
                          isXDropdownOpen ? "border-[var(--color-primary)]" : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                        )}
                        style={{ borderColor: isXDropdownOpen ? persona.theme.primary : undefined, '--color-primary': persona.theme.primary }}
                        onBlur={() => setTimeout(() => setIsXDropdownOpen(false), 150)}
                        onClick={() => setIsXDropdownOpen(!isXDropdownOpen)}
                      >
                        <span className={clsx("text-xs font-semibold", isXDropdownOpen ? "text-[var(--color-primary)]" : "text-slate-800 dark:text-slate-200")} style={{ '--color-primary': persona.theme.primary }}>
                          {xAxisKey || 'Select X-Axis'}
                        </span>
                        {isXDropdownOpen ? <ChevronUp size={14} className="text-[var(--color-primary)]" style={{ '--color-primary': persona.theme.primary }} /> : <ChevronDown size={14} className="text-slate-400" />}
                      </button>
                      
                      {isXDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2">
                          {keys.map(k => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => { setXAxisKey(k); setIsXDropdownOpen(false); }}
                              className={clsx(
                                "flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                                xAxisKey === k
                                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                              )}
                              style={{ '--color-primary': persona.theme.primary }}
                            >
                              {k}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="relative">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Y-Axis</label>
                      <button
                        type="button"
                        className={clsx(
                          "w-full h-9 px-3 flex items-center justify-between bg-white dark:bg-[#1a1a1a] border rounded-lg transition-all",
                          isYDropdownOpen ? "border-[var(--color-primary)]" : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                        )}
                        style={{ borderColor: isYDropdownOpen ? persona.theme.primary : undefined, '--color-primary': persona.theme.primary }}
                        onBlur={() => setTimeout(() => setIsYDropdownOpen(false), 150)}
                        onClick={() => setIsYDropdownOpen(!isYDropdownOpen)}
                      >
                        <span className={clsx("text-xs font-semibold", isYDropdownOpen ? "text-[var(--color-primary)]" : "text-slate-800 dark:text-slate-200")} style={{ '--color-primary': persona.theme.primary }}>
                          {yAxisKey || 'Select Y-Axis'}
                        </span>
                        {isYDropdownOpen ? <ChevronUp size={14} className="text-[var(--color-primary)]" style={{ '--color-primary': persona.theme.primary }} /> : <ChevronDown size={14} className="text-slate-400" />}
                      </button>
                      
                      {isYDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2">
                          {keys.map(k => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => { setYAxisKey(k); setIsYDropdownOpen(false); }}
                              className={clsx(
                                "flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                                yAxisKey === k
                                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                              )}
                              style={{ '--color-primary': persona.theme.primary }}
                            >
                              {k}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Result Workspace */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  Result Workspace
                </h3>
                {parsedData.length > 0 && !error && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 shadow-md shadow-[var(--color-primary)]/25"
                    style={{ backgroundColor: persona.theme.primary }}
                  >
                    <Download size={14} />
                    Save Image
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-hidden p-6 flex flex-col relative min-h-[400px]">
                {parsedData.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3 opacity-50 p-8 text-center">
                    <BarChart2 className="w-12 h-12 mb-2" />
                    <span className="text-sm font-medium">No Data Available</span>
                    <span className="text-[11px] max-w-[200px] leading-relaxed">Paste your raw data in the sidebar to generate a chart automatically.</span>
                  </div>
                ) : error ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 font-medium text-sm gap-2 bg-slate-50/50 dark:bg-[#1a1a1a]/50">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-2">
                      <FileText className="w-5 h-5 text-red-500" />
                    </div>
                    {error}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col bg-transparent relative" ref={chartRef}>
                    <ResponsiveContainer width="100%" height="100%" minHeight={350} className="z-10 relative">
                      <div className="w-full h-full bg-white dark:bg-[#1a1a1a] rounded-xl" style={{ position: 'absolute', inset: 0, zIndex: -1 }}></div>
                      {renderChart()}
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
