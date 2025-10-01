import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getAllForecasts, getBusinessUnits, getClients, getUsers } from '../services/supabaseApi';
import { Forecast, BusinessUnit, Client, User } from '../types';
import SummaryCard from '../components/SummaryCard';
import ForecastBarChart from '../components/ForecastBarChart';
import ForecastLineChart from '../components/ForecastLineChart';
import CountryFilter from '../components/filters/CountryFilter';
import DataTypeSelector from '../components/filters/DataTypeSelector';
import BusinessUnitFilter from '../components/filters/BusinessUnitFilter';
import DateFilter from '../components/filters/DateFilter';
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
    const { filters, updateFilters, dataTypeSelection, setDataTypeSelection, setBusinessUnitIds } = useFilters();
    
    // Use the filtered data hook
    const { data: filteredForecasts, loading: filterLoading } = useFilteredData(forecasts);

    // Date range state (keeping for data fetching compatibility)
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
        const end = new Date();
        const start = new Date(end.getFullYear(), 0, 1);
        return { start, end };
    });

    // Date filter state
    const [selectedDateRange, setSelectedDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
        startDate: new Date(new Date().getFullYear(), 0, 1),
        endDate: new Date()
    });

    // Sync selectedDateRange with dateRange for data fetching
    useEffect(() => {
        setDateRange({
            start: selectedDateRange.startDate || new Date(),
            end: selectedDateRange.endDate || new Date()
        });
    }, [selectedDateRange]);

    // Click outside handler for filter dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Handled by individual filter components
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


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
            const isBuMatch = filters.businessUnitIds.length === 0 || filters.businessUnitIds.includes(f.businessUnitId);

            return isDateOverlap && isBuMatch;
        });
    }, [filteredForecasts, dateRange, filters.businessUnitIds]);

    const summaryData = useMemo(() => {
        const budget = forecastsInRange.reduce((sum, f) => sum + (f.budget || 0), 0);
        const forecast = forecastsInRange.reduce((sum, f) => sum + (f.forecast || 0), 0);
        const declaredBudget = forecastsInRange.reduce((sum, f) => sum + (f.declaredBudget || 0), 0);
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
            current.declaredBudget += f.declaredBudget || 0;
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
            current.declaredBudget += f.declaredBudget || 0;
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
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400 p-4">
            <ChartBarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2"/>
            <p className="font-semibold">Nessun dato disponibile</p>
            <p className="text-sm">Prova a modificare i filtri o l'intervallo di date.</p>
        </div>
    );

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Dati dal {formatDate(dateRange.start)} al {formatDate(dateRange.end)}
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <DataTypeSelector 
                        selection={dataTypeSelection}
                        onChange={setDataTypeSelection}
                    />
                    <BusinessUnitFilter
                        selectedBusinessUnits={filters.businessUnitIds}
                        onBusinessUnitChange={setBusinessUnitIds}
                        disabled={loading || filterLoading}
                    />
                    <CountryFilter 
                        selectedCountries={filters.countries || []}
                        onCountryChange={(countries) => updateFilters({ countries })}
                    />
                    <DateFilter
                        selectedDateRange={selectedDateRange}
                        onDateRangeChange={setSelectedDateRange}
                    />
                </div>
            </div>
            
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dataTypeSelection?.budget && (
                        <SummaryCard title="Total BDG Attivo" value={formatCurrency(summaryData.totalBudget)} icon={<CurrencyDollarIcon />} />
                    )}
                    {dataTypeSelection?.forecast && (
                        <SummaryCard title="Total Fcast Rolling" value={formatCurrency(summaryData.totalForecast)} icon={<DocumentChartBarIcon />} />
                    )}
                    {dataTypeSelection?.declaredBudget && (
                        <SummaryCard title="Total BDG Dichiarato" value={formatCurrency(summaryData.totalDeclaredBudget)} icon={<TableCellsIcon />} />
                    )}
                    {(dataTypeSelection?.budget && dataTypeSelection?.forecast) && (
                        <SummaryCard title="Performance" value={`${summaryData.delta.value > 0 ? '+' : ''}${summaryData.delta.value.toFixed(2)}%`} icon={<ArrowTrendingUpIcon />} delta={summaryData.delta}/>
                    )}
                </div>
                

                
                <div className="grid grid-cols-1 gap-6">
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg h-[28rem] flex flex-col transition-colors">
                       {lineChartData.some(d => d.budget > 0 || d.forecast > 0 || d.declaredBudget > 0) ? <ForecastLineChart data={lineChartData} dataTypeSelection={dataTypeSelection} /> : renderEmptyChartState()}
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg h-[28rem] flex flex-col transition-colors">
                        {barChartData.length > 0 ? <ForecastBarChart data={barChartData} dataTypeSelection={dataTypeSelection} /> : renderEmptyChartState()}
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