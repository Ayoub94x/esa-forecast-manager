import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getAllForecasts, getBusinessUnits, getClients, getUsers } from '../services/supabaseApi';
import { Forecast, BusinessUnit, Client, User } from '../types';
import SummaryCard from '../components/SummaryCard';
import ForecastBarChart from '../components/ForecastBarChart';
import ForecastLineChart from '../components/ForecastLineChart';
import CountryFilter from '../components/filters/CountryFilter';
import { useFilters } from '../contexts/FilterContext';
import { useFilteredData } from '../hooks/useFilteredData';

import { CurrencyDollarIcon, DocumentChartBarIcon, TableCellsIcon, ArrowTrendingUpIcon, CalendarDaysIcon, FunnelIcon, ChartBarIcon, XMarkIcon } from '../components/icons';
import { CardSkeleton, ChartSkeleton, TableSkeleton } from '../components/skeletons';

const DashboardPage: React.FC = () => {
    const [forecasts, setForecasts] = useState<Forecast[]>([]);
    const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Utilizzo del FilterContext per gestire tutti i filtri
    const { filters, updateFilters } = useFilters();
    
    // Use the filtered data hook
    const { data: filteredForecasts, loading: filterLoading } = useFilteredData(forecasts);

    // Date range state (mantenuto per compatibilità con il codice esistente)
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29); // Default to last 30 days
        return { start, end };
    });

    // Filter state
    const [selectedBuIds, setSelectedBuIds] = useState<number[]>([]);
    const [isBuFilterOpen, setIsBuFilterOpen] = useState(false);
    const buFilterRef = useRef<HTMLDivElement>(null);

    // Date picker state
    const [isDateRangePickerOpen, setIsDateRangePickerOpen] = useState(false);
    const datePickerRef = useRef<HTMLDivElement>(null);
    const [tempDateRange, setTempDateRange] = useState(dateRange);

    // Note: FilterContext synchronization is handled by useFilteredData hook

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setIsDateRangePickerOpen(false);
            }
            if (buFilterRef.current && !buFilterRef.current.contains(event.target as Node)) {
                setIsBuFilterOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [datePickerRef, buFilterRef]);


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [forecastsData, buData, clientData, userData] = await Promise.all([
                    getAllForecasts(),
                    getBusinessUnits(),
                    getClients(),
                    getUsers(),
                ]);
                setForecasts(forecastsData);
                setBusinessUnits(buData);
                setClients(clientData);
                setUsers(userData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
    const formatDate = (date: Date) => new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
    const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];

    // --- Data Calculations based on Filtered Data ---

    const forecastsInRange = useMemo(() => {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return filteredForecasts.filter(f => {
            // Check if any part of the forecast's month falls within the date range
            const monthStart = new Date(f.year, f.month - 1, 1);
            const monthEnd = new Date(f.year, f.month, 0); // Last day of the forecast's month
            const isDateOverlap = monthStart <= end && monthEnd >= start;
            
            // Check if BU filter is applied
            const isBuMatch = selectedBuIds.length === 0 || selectedBuIds.includes(f.businessUnitId);

            return isDateOverlap && isBuMatch;
        });
    }, [filteredForecasts, dateRange, selectedBuIds]);

    const summaryData = useMemo(() => {
        const budget = forecastsInRange.reduce((sum, f) => sum + (f.budget || 0), 0);
        const forecast = forecastsInRange.reduce((sum, f) => sum + (f.forecast || 0), 0);
        const declaredBudget = forecastsInRange.reduce((sum, f) => sum + (f.declared_budget || 0), 0);
        const deltaValue = budget > 0 ? ((forecast - budget) / budget) * 100 : 0;
        return { 
            totalBudget: budget, 
            totalForecast: forecast,
            totalDeclaredBudget: declaredBudget,
            delta: { value: deltaValue, isPositive: deltaValue >= 0 }
        };
    }, [forecastsInRange]);

    const barChartData = useMemo(() => {
        const dataMap = new Map<string, { budget: number, forecast: number, declaredBudget: number }>();
        forecastsInRange.forEach(f => {
            const buName = businessUnits.find(bu => bu.id === f.businessUnitId)?.name || 'Unknown';
            const current = dataMap.get(buName) || { budget: 0, forecast: 0, declaredBudget: 0 };
            current.budget += f.budget || 0;
            current.forecast += f.forecast || 0;
            current.declaredBudget += f.declared_budget || 0;
            dataMap.set(buName, current);
        });
        return Array.from(dataMap.entries()).map(([name, values]) => ({ name, ...values }));
    }, [forecastsInRange, businessUnits]);
    
    const lineChartData = useMemo(() => {
        const monthDataMap = new Map<string, { budget: number, forecast: number, declaredBudget: number }>();
    
        // Populate map with data from forecasts in range
        forecastsInRange.forEach(f => {
            const monthKey = `${f.year}-${String(f.month).padStart(2, '0')}`;
            const current = monthDataMap.get(monthKey) || { budget: 0, forecast: 0, declaredBudget: 0 };
            current.budget += f.budget || 0;
            current.forecast += f.forecast || 0;
            current.declaredBudget += f.declared_budget || 0;
            monthDataMap.set(monthKey, current);
        });
    
        // Generate all months within the date range to ensure continuity
        const result = [];
        const iterDate = new Date(dateRange.start);
        iterDate.setDate(1); // Start from the first day of the start month
    
        while (iterDate <= dateRange.end) {
            const monthKey = `${iterDate.getFullYear()}-${String(iterDate.getMonth() + 1).padStart(2, '0')}`;
            const data = monthDataMap.get(monthKey) || { budget: 0, forecast: 0, declaredBudget: 0 };
            result.push({
                name: iterDate.toLocaleString('it-IT', { month: 'short', year: '2-digit' }),
                budget: data.budget,
                forecast: data.forecast,
                declaredBudget: data.declaredBudget,
            });
            iterDate.setMonth(iterDate.getMonth() + 1);
        }
    
        return result;
    }, [forecastsInRange, dateRange]);

    const activityData = useMemo(() => {
        return forecastsInRange
            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
            .slice(0, 10) // Show more activity for potentially larger ranges
            .map(f => ({ 
                ...f, 
                clientName: clients.find(c => c.id === f.clientId)?.name || 'N/A',
                userName: users.find(u => u.id === f.userId)?.name || 'N/A'
            }));
    }, [forecastsInRange, clients, users]);
    
    if (loading) {
        return (
            <div className="w-full space-y-6">
                 <div className="h-12 bg-slate-300 dark:bg-slate-700 rounded w-1/3 animate-pulse"></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <CardSkeleton /><CardSkeleton /><CardSkeleton />
                 </div>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartSkeleton /><TableSkeleton rows={5} cols={3} />
                 </div>
            </div>
        );
    }

    const renderEmptyChartState = () => (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
            <ChartBarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2"/>
            <p className="font-semibold">Nessun dato da visualizzare</p>
            <p className="text-sm">Prova a modificare i filtri o l'intervallo di date.</p>
        </div>
    );

    const renderBuFilter = () => {
        const handleBuSelection = (buId: number) => {
            setSelectedBuIds(prev =>
                prev.includes(buId)
                    ? prev.filter(id => id !== buId)
                    : [...prev, buId]
            );
        };
        const handleSelectAllBus = () => setSelectedBuIds(businessUnits.map(bu => bu.id));
        const handleClearAllBus = () => setSelectedBuIds([]);

        return (
            <div ref={buFilterRef} className="relative">
                 <button onClick={() => setIsBuFilterOpen(prev => !prev)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <FunnelIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>
                        {selectedBuIds.length === 0 ? "Tutte le Business Unit" : `${selectedBuIds.length} BU selezionate`}
                    </span>
                 </button>
                 {isBuFilterOpen && (
                    <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 w-64 animate-scale-up">
                        <div className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-slate-700">
                            <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Filtra per BU</h5>
                            <div>
                                <button onClick={handleSelectAllBus} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline mr-3">Seleziona tutto</button>
                                <button onClick={handleClearAllBus} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Pulisci</button>
                            </div>
                        </div>
                        <div className="p-1 max-h-60 overflow-y-auto">
                            {businessUnits.map(bu => (
                                <label key={bu.id} className="flex items-center space-x-2 p-2 m-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                                    <input type="checkbox" checked={selectedBuIds.includes(bu.id)} onChange={() => handleBuSelection(bu.id)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                    <span className="text-sm text-slate-800 dark:text-slate-200">{bu.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    };

    const renderDateRangePicker = () => {
        const predefinedRanges: { label: string; days?: number; period?: 'year' }[] = [
            { label: 'Ultimi 7 Giorni', days: 6 },
            { label: 'Ultimi 30 Giorni', days: 29 },
            { label: 'Ultimi 90 Giorni', days: 89 },
            { label: 'Quest\'anno', period: 'year' },
        ];
        
        const handleSetPredefinedRange = (config: { days?: number; period?: 'year' }) => {
            const end = new Date();
            let start = new Date();
            if (config.days !== undefined) {
                start.setDate(end.getDate() - config.days);
            } else if (config.period === 'year') {
                start = new Date(end.getFullYear(), 0, 1);
            }
            setTempDateRange({ start, end });
        };
        
        const handleApply = () => {
            setDateRange(tempDateRange);
            setIsDateRangePickerOpen(false);
        };
    
        return (
            <div ref={datePickerRef} className="relative">
                <button onClick={() => { setTempDateRange(dateRange); setIsDateRangePickerOpen(p => !p); }} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <CalendarDaysIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>{formatDate(dateRange.start)} - {formatDate(dateRange.end)}</span>
                </button>
    
                {isDateRangePickerOpen && (
                    <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 w-80 p-4 animate-scale-up">
                        <div className="flex justify-between items-center mb-3">
                           <h4 className="font-semibold text-slate-800 dark:text-slate-100">Seleziona Intervallo</h4>
                           <button onClick={() => setIsDateRangePickerOpen(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><XMarkIcon className="w-5 h-5 text-slate-500" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {predefinedRanges.map(range => (
                                <button key={range.label} onClick={() => handleSetPredefinedRange(range)} className="text-center text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    {range.label}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <div>
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Data Inizio</label>
                                <input type="date" value={formatDateForInput(tempDateRange.start)} onChange={e => setTempDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))} className="w-full mt-1 p-1.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Data Fine</label>
                                <input type="date" value={formatDateForInput(tempDateRange.end)} onChange={e => setTempDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))} className="w-full mt-1 p-1.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
                            </div>
                        </div>
                        <div className="flex justify-end mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <button onClick={handleApply} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">Applica</button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Dati dal {formatDate(dateRange.start)} al {formatDate(dateRange.end)}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {renderBuFilter()}
                    <CountryFilter 
                        selectedCountries={filters.countries || []}
                        onCountryChange={(countries) => updateFilters({ countries })}
                    />
                    {renderDateRangePicker()}
                </div>
            </div>
            
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <SummaryCard title="Total BDG Attivo" value={formatCurrency(summaryData.totalBudget)} icon={<CurrencyDollarIcon />} />
                    <SummaryCard title="Total Fcast Rolling" value={formatCurrency(summaryData.totalForecast)} icon={<DocumentChartBarIcon />} />
                    <SummaryCard title="Performance" value={`${summaryData.delta.value > 0 ? '+' : ''}${summaryData.delta.value.toFixed(2)}%`} icon={<ArrowTrendingUpIcon />} delta={summaryData.delta}/>
                </div>
                

                
                <div className="grid grid-cols-1 gap-6">
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg h-[28rem] flex flex-col transition-colors">
                       {lineChartData.some(d => d.budget > 0 || d.forecast > 0) ? <ForecastLineChart data={lineChartData} /> : renderEmptyChartState()}
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg h-[28rem] flex flex-col transition-colors">
                        {barChartData.length > 0 ? <ForecastBarChart data={barChartData} /> : renderEmptyChartState()}
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col transition-colors">
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Attività Recenti</h3>
                        {activityData.length > 0 ? (
                            <div className="overflow-auto flex-grow">
                                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                                    <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-700/50">
                                        <tr><th scope="col" className="px-4 py-3">Utente</th><th scope="col" className="px-4 py-3">Cliente</th><th scope="col" className="px-4 py-3">Data</th></tr>
                                    </thead>
                                    <tbody>
                                        {activityData.map((change, index) => (
                                            <tr key={change.id} className={`border-b border-slate-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-indigo-50 dark:hover:bg-slate-700`}>
                                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{change.userName}</td>
                                                <td className="px-4 py-3">{change.clientName}</td>
                                                <td className="px-4 py-3">{new Date(change.lastModified).toLocaleString('it-IT')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400 p-4">
                                <TableCellsIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2"/>
                                <p className="font-semibold">Nessuna attività registrata</p>
                                <p className="text-sm">Prova a modificare i filtri o l'intervallo di date.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;